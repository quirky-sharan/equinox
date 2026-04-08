import os
import json
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Header, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.training import TrainingExample
from ..models.session import Session as DBSession

router = APIRouter(tags=["Admin"])

def verify_admin(x_admin_key: str = Header(...)):
    expected_key = os.getenv("ADMIN_API_KEY")
    if not expected_key or x_admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid or missing admin API key")
    return True

@router.get("/admin/training/export", dependencies=[Depends(verify_admin)])
def export_training_data(db: Session = Depends(get_db)):
    examples = db.query(TrainingExample).filter(TrainingExample.approved_for_training == True).all()
    
    jsonl_lines = []
    salt = os.getenv("ADMIN_API_KEY", "fallback_salt").encode()
    for ex in examples:
        # Anonymize user_id
        anon_user = hashlib.sha256(ex.user_id.encode() + salt).hexdigest()
        
        # Check that messages exist
        messages = ex.messages if ex.messages else []
        
        record = {
            "user_id_hash": anon_user,
            "session_id": ex.session_id,
            "messages": messages,
            "final_output": ex.final_output,
            "quality_score": ex.quality_score,
            "feedback_rating": ex.feedback_rating,
            "was_accurate": ex.was_accurate
        }
        jsonl_lines.append(json.dumps(record))
        
    content = "\n".join(jsonl_lines)
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=training_data.jsonl"}
    )

@router.post("/admin/training/approve/{example_id}", dependencies=[Depends(verify_admin)])
def approve_training_example(example_id: str, db: Session = Depends(get_db)):
    ex = db.query(TrainingExample).filter(TrainingExample.id == example_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Example not found")
    
    if ex.quality_score is None or ex.quality_score < 0.6:
        raise HTTPException(status_code=400, detail="Quality score must be >= 0.6 to approve")
        
    ex.approved_for_training = True
    db.commit()
    return {"status": "success", "approved": example_id}

@router.get("/admin/training/stats", dependencies=[Depends(verify_admin)])
def get_training_stats(db: Session = Depends(get_db)):
    total = db.query(TrainingExample).count()
    approved = db.query(TrainingExample).filter(TrainingExample.approved_for_training == True).count()
    
    avg_score = db.query(func.avg(TrainingExample.quality_score)).scalar() or 0.0
    accuracy_rate = 0.0
    
    rated_examples = db.query(TrainingExample).filter(TrainingExample.was_accurate != None).all()
    if len(rated_examples) > 0:
        accurate = sum(1 for e in rated_examples if e.was_accurate)
        accuracy_rate = (accurate / len(rated_examples)) * 100
        
    return {
        "total_examples": total,
        "approved_count": approved,
        "avg_quality_score": round(avg_score, 2),
        "accuracy_rate": round(accuracy_rate, 2)
    }

@router.post("/admin/seed/training-data", dependencies=[Depends(verify_admin)])
def seed_training_data(db: Session = Depends(get_db)):
    """One-time endpoint to ingest 45 sample cases from JSON file."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    seed_file = os.path.join(base_dir, "sample_cases_seed.json")
    
    if not os.path.exists(seed_file):
        raise HTTPException(status_code=404, detail=f"Seed file not found at {seed_file}")
        
    with open(seed_file, "r") as f:
        cases = json.load(f)
        
    added = 0
    skipped = 0
    system_prompt_hash = "seed_data_hash"
    
    for case in cases:
        session_id = case["id"] # e.g. case_001
        
        # Check if already seeded
        existing = db.query(TrainingExample).filter(TrainingExample.session_id == session_id).first()
        if existing:
            skipped += 1
            continue
            
        # Reconstruct messages into OpenAI format
        messages = []
        # Usually starts with system, but here just turns. We'll add a dummy complete system prompt info or skip.
        messages.append({"role": "system", "content": "Seeded clinical case background."})
        for user_msg, assistant_msg in case.get("turns", []):
            messages.append({"role": "user", "content": user_msg})
            messages.append({"role": "assistant", "content": assistant_msg})
            
        feedback = case.get("feedback", {})
        rating = feedback.get("rating", 0)
        was_accurate = feedback.get("was_accurate", False)
        
        # Calculate quality_score
        acc_score = 1.0 if was_accurate else 0.0
        quality_score = (rating / 5.0) * 0.6 + acc_score * 0.4
        
        te = TrainingExample(
            session_id=session_id,
            user_id="seed_user", # mock user
            messages=messages,
            system_prompt_hash=system_prompt_hash,
            final_output=case.get("final_data", {}),
            feedback_rating=rating,
            was_accurate=was_accurate,
            quality_score=quality_score,
            approved_for_training=True
        )
        db.add(te)
        added += 1
        
    db.commit()
    return {"status": "success", "added": added, "skipped": skipped}
