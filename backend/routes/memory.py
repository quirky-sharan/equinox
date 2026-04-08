from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..routes.auth import get_current_user
from ..models.user import User
from ..models.memory import UserHealthMemory

router = APIRouter(tags=["Memory"])

@router.get("/memory/me")
def get_memory_timeline(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memories = db.query(UserHealthMemory).filter(UserHealthMemory.user_id == current_user.id).order_by(UserHealthMemory.created_at.desc()).all()
    
    result = []
    for m in memories:
        result.append({
            "id": m.id,
            "session_id": m.session_id,
            "condition": m.condition,
            "risk_tier": m.risk_tier,
            "confidence_percent": m.confidence_percent,
            "symptoms_summary": m.symptoms_summary,
            "key_findings": m.key_findings,
            "see_doctor": m.see_doctor,
            "see_doctor_urgency": m.see_doctor_urgency,
            "created_at": m.created_at
        })
    return result

@router.delete("/memory/{memory_id}")
def delete_memory(memory_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mem = db.query(UserHealthMemory).filter(UserHealthMemory.id == memory_id, UserHealthMemory.user_id == current_user.id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found or not owned by user.")
    
    db.delete(mem)
    db.commit()
    return {"status": "success", "deleted": memory_id}

@router.delete("/memory/all/me")
def clear_all_memory(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(UserHealthMemory).filter(UserHealthMemory.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "All health memory cleared"}
