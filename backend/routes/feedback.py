from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..routes.auth import get_current_user
from ..models.user import User
from ..models.session import Session as DBSession
from ..models.feedback import SessionFeedback
from ..models.training import TrainingExample

router = APIRouter(tags=["Feedback"])

@router.post("/feedback/submit")
def submit_feedback(
    session_id: str = Body(...),
    rating: int = Body(...),
    was_accurate: bool = Body(None),
    helpful_text: str = Body(None),
    not_helpful_text: str = Body(None),
    actual_diagnosis: str = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify session
    session_rec = db.query(DBSession).filter(DBSession.id == session_id, DBSession.user_id == current_user.id).first()
    if not session_rec:
        raise HTTPException(status_code=404, detail="Session not found or not owned by user.")
    
    # Check if feedback already exists
    existing_feedback = db.query(SessionFeedback).filter(SessionFeedback.session_id == session_id).first()
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this session")

    # Create feedback
    feedback = SessionFeedback(
        session_id=session_id,
        user_id=current_user.id,
        rating=rating,
        was_accurate=was_accurate,
        helpful_text=helpful_text,
        not_helpful_text=not_helpful_text,
        actual_diagnosis=actual_diagnosis
    )
    db.add(feedback)
    
    # Update training example if it exists
    training_example = db.query(TrainingExample).filter(TrainingExample.session_id == session_id).first()
    if training_example:
        training_example.feedback_rating = rating
        training_example.was_accurate = was_accurate
        # Compute quality score
        acc_score = 1.0 if was_accurate else 0.0
        quality_score = (rating / 5.0) * 0.6 + acc_score * 0.4
        training_example.quality_score = quality_score
    
    db.commit()
    db.refresh(feedback)
    return {"status": "success", "feedback_id": feedback.id}

@router.get("/feedback/{session_id}")
def get_feedback(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    feedback = db.query(SessionFeedback).filter(SessionFeedback.session_id == session_id, SessionFeedback.user_id == current_user.id).first()
    if not feedback:
        return None
    return {
        "id": feedback.id,
        "rating": feedback.rating,
        "was_accurate": feedback.was_accurate,
        "helpful_text": feedback.helpful_text,
        "not_helpful_text": feedback.not_helpful_text,
        "actual_diagnosis": feedback.actual_diagnosis,
        "submitted_at": feedback.submitted_at
    }

@router.get("/feedback/analytics/me")
def get_feedback_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    feedbacks = db.query(SessionFeedback, DBSession).join(DBSession).filter(SessionFeedback.user_id == current_user.id).all()
    
    total_sessions_rated = len(feedbacks)
    if total_sessions_rated == 0:
        return {"total_sessions": 0, "avg_rating": 0, "accuracy_rate": 0, "rating_distribution": {1:0, 2:0, 3:0, 4:0, 5:0}, "history": []}
    
    sum_rating = sum([f.SessionFeedback.rating for f in feedbacks])
    accurate_count = sum([1 for f in feedbacks if f.SessionFeedback.was_accurate is True])
    
    rating_distribution = {1:0, 2:0, 3:0, 4:0, 5:0}
    history = []
    
    for f, s in feedbacks:
        rating_distribution[f.SessionFeedback.rating] += 1
        
        condition = "Unknown"
        if s.top_conditions and isinstance(s.top_conditions, list) and len(s.top_conditions) > 0:
            cond_obj = s.top_conditions[0]
            if isinstance(cond_obj, dict):
                condition = cond_obj.get("name", str(cond_obj))
            else:
                condition = str(cond_obj)
            
        history.append({
            "session_id": f.SessionFeedback.session_id,
            "condition": condition,
            "rating": f.SessionFeedback.rating,
            "submitted_at": f.SessionFeedback.submitted_at,
            "was_accurate": f.SessionFeedback.was_accurate,
            "helpful_text": f.SessionFeedback.helpful_text
        })
    
    return {
        "total_sessions": total_sessions_rated,
        "avg_rating": round(sum_rating / total_sessions_rated, 2),
        "accuracy_rate": round((accurate_count / total_sessions_rated) * 100, 2),
        "rating_distribution": rating_distribution,
        "history": sorted(history, key=lambda x: x["submitted_at"], reverse=True)
    }
