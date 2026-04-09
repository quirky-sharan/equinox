from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import uuid, httpx
from datetime import datetime
from io import BytesIO

import json

from ..database import get_db
from ..models.user import User
from ..models.session import Session as SessionModel, SessionAnswer, SymptomVector, PopulationAggregate
from ..models.memory import UserHealthMemory
from ..models.training import TrainingExample
from ..schemas.session import (
    SessionStartResponse, AnswerSubmit, AnswerResponse,
    RiskOutput, SessionHistoryItem, PopulationReport
)
from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/session", tags=["session"])


# ── Profile Fetch Utility ─────────────────────────────────────────────────────

_PROFILE_FIELDS = [
    ("age", "Age"),
    ("sex", "Sex"),
    ("weight", "Weight"),
    ("height", "Height"),
    ("blood_group", "Blood Group"),
    ("allergies", "Known Allergies"),
    ("medical_conditions", "Pre-existing Medical Conditions"),
    ("habits", "Lifestyle & Habits"),
    ("family_history", "Hereditary / Family Medical History"),
]

def _build_profile_context(user: User) -> str:
    """Dynamically build a profile context string from all non-null user fields."""
    lines = []
    for attr, label in _PROFILE_FIELDS:
        value = getattr(user, attr, None)
        if value is None or (isinstance(value, str) and value.strip() == ""):
            continue
        # Try to parse JSON habits into readable text
        if attr == "habits" and isinstance(value, str):
            try:
                habits = json.loads(value)
                parts = []
                for k, v in habits.items():
                    if v and str(v).strip():
                        parts.append(f"{k.replace('_', ' ').title()}: {v}")
                if parts:
                    value = "; ".join(parts)
                else:
                    continue
            except (json.JSONDecodeError, AttributeError):
                pass  # use raw value as-is
        lines.append(f"- **{label}**: {value}")
    return "\n".join(lines) if lines else ""


async def call_ml(endpoint: str, payload: dict = None, method: str = "POST", timeout: float = 90.0) -> dict:
    """Call ML microservice (RAG + Groq LLM)."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            if method == "POST":
                r = await client.post(f"{settings.ML_SERVICE_URL}/ml/{endpoint}", json=payload)
            else:
                r = await client.get(f"{settings.ML_SERVICE_URL}/ml/{endpoint}", params=payload)
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        print(f"[ML HTTP Error] {endpoint}: {e.response.text}")
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {e.response.text}")
    except httpx.RequestError as e:
        print(f"[ML Connection Error] {endpoint}: {e}")
        raise HTTPException(status_code=503, detail="AI Engine is offline or starting up. Please try again.")
    except Exception as e:
        print(f"[ML Unknown Error] {endpoint}: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


async def call_ml_raw(endpoint: str, payload: dict = None, params: dict = None, method: str = "GET", timeout: float = 30.0) -> bytes:
    """Call ML microservice and return raw bytes (for PDF)."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            if method.upper() == "POST":
                r = await client.post(f"{settings.ML_SERVICE_URL}/ml/{endpoint}", json=payload, params=params)
            else:
                r = await client.get(f"{settings.ML_SERVICE_URL}/ml/{endpoint}", params=params)
            r.raise_for_status()
            return r.content
    except Exception as e:
        print(f"[ML call failed] {endpoint}: {e}")
        return None


@router.post("/start", response_model=SessionStartResponse)
async def start_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = SessionModel(user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)

    # Build profile context from user's stored health data
    profile_context = _build_profile_context(current_user)

    # Fetch memory timeline
    memory_rows = db.query(UserHealthMemory).filter(
        UserHealthMemory.user_id == current_user.id
    ).order_by(UserHealthMemory.created_at.desc()).limit(10).all()
    # pass as strings to ML payload
    memory_payload = [{"condition":m.condition, "date":str(m.created_at)} for m in memory_rows]

    # Call the RAG pipeline with an initial greeting to get the first question
    ml_result = await call_ml("chat", {
        "session_id": str(session.id),
        "message": "Hello, I need help understanding what's going on with my health.",
        "profile_context": profile_context or None,
        "health_history": json.dumps(memory_payload) if memory_payload else None
    })

    first_question = ml_result.get("reply", "How are you feeling today? Please describe your symptoms in your own words.")
    highlights = ml_result.get("highlights", [])
    mental_state = ml_result.get("mental_state")

    return SessionStartResponse(
        session_id=session.id,
        first_question=first_question,
        question_category="general",
        highlights=highlights,
        mental_state=mental_state,
    )


@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(
    payload: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(
        SessionModel.id == payload.session_id,
        SessionModel.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Count existing answers
    answer_count = db.query(SessionAnswer).filter(
        SessionAnswer.session_id == payload.session_id
    ).count()

    # Store answer in DB
    meta = payload.behavioral_metadata.model_dump() if payload.behavioral_metadata else {}
    answer = SessionAnswer(
        session_id=payload.session_id,
        question_text=payload.question_text,
        question_category=payload.question_category,
        answer_text=payload.answer_text,
        behavioral_metadata=meta,
        sequence_number=answer_count,
    )
    db.add(answer)
    db.commit()

    # Build profile context from user's stored health data
    profile_context = _build_profile_context(current_user)

    # Fetch memory timeline
    memory_rows = db.query(UserHealthMemory).filter(
        UserHealthMemory.user_id == current_user.id
    ).order_by(UserHealthMemory.created_at.desc()).limit(10).all()
    # Format memory timeline
    memory_payload = [{"condition":m.condition, "date":str(m.created_at)} for m in memory_rows]

    # Call RAG pipeline — forward user's answer to the LLM
    ml_result = await call_ml("chat", {
        "session_id": str(payload.session_id),
        "message": payload.answer_text,
        "profile_context": profile_context or None,
        "health_history": json.dumps(memory_payload) if memory_payload else None
    })

    turn_count = ml_result.get("turn_count", answer_count + 1)
    is_final = ml_result.get("is_final", False)
    reply = ml_result.get("reply", "Could you tell me more about your symptoms?")
    final_data = ml_result.get("final_data")
    highlights = ml_result.get("highlights", [])
    mental_state = ml_result.get("mental_state")

    if is_final:
        session.status = "completed"
        session.completed_at = datetime.utcnow()

        # Save diagnosis data from LLM
        if final_data:
            session.risk_tier = final_data.get("risk_tier", "medium")
            session.risk_score = final_data.get("confidence_percent", 50) / 100.0
            session.top_conditions = [
                {"name": final_data.get("condition", "Unknown"), "confidence": final_data.get("confidence_percent", 50) / 100.0}
            ]
            
            session.patient_explanation = final_data.get("explanation_patient", "")
            session.doctor_explanation = final_data.get("explanation_doctor", "")
            session.reasoning_chain = final_data.get("reasoning", [])
            session.recommended_action = final_data.get("see_doctor_reason", "Consult a healthcare provider.")
            session.dos = final_data.get("dos", [])
            session.donts = final_data.get("donts", [])
            session.see_doctor = final_data.get("see_doctor", False)
            session.see_doctor_urgency = final_data.get("see_doctor_urgency")
            session.home_remedies = final_data.get("home_remedies", [])
            session.dietary_guidelines = final_data.get("dietary_guidelines")
            session.lifestyle_modifications = final_data.get("lifestyle_modifications", [])
            session.warning_signs = final_data.get("warning_signs", [])
            
            # 1. Save user_health_memory row
            all_answers = db.query(SessionAnswer).filter(SessionAnswer.session_id == payload.session_id).order_by(SessionAnswer.sequence_number).all()
            user_texts = [a.answer_text for a in all_answers]
            symptoms_summary = " ".join(user_texts)
            key_findings = {
                "dos": final_data.get("dos", []),
                "donts": final_data.get("donts", []),
                "warning_signs": final_data.get("warning_signs", [])
            }
            
            uhm = db.query(UserHealthMemory).filter(UserHealthMemory.session_id == str(session.id)).first()
            if not uhm:
                uhm = UserHealthMemory(
                    user_id=current_user.id,
                    session_id=str(session.id),
                    condition=final_data.get("condition"),
                    risk_tier=final_data.get("risk_tier"),
                    confidence_percent=final_data.get("confidence_percent"),
                    symptoms_summary=symptoms_summary,
                    key_findings=key_findings,
                    see_doctor=final_data.get("see_doctor"),
                    see_doctor_urgency=final_data.get("see_doctor_urgency")
                )
                db.add(uhm)
                db.flush() # get uhm.id without committing
                
                # 3. Call ML memory sync endpoint (async, fire-and-forget)
                import asyncio
                asyncio.create_task(call_ml("memory/sync", {"user_id": current_user.id, "user_health_memory_id": uhm.id}))
            
            # 2. Create training_examples row
            te = db.query(TrainingExample).filter(TrainingExample.session_id == str(session.id)).first()
            if not te:
                tc_messages = []
                
                # Inject system context for fine-tuning data to ensure the AI learns
                # from the user's habits, lifestyle, and previous disease history.
                system_context = "You are a clinical AI. The patient has the following profile:\n"
                system_context += profile_context if profile_context else "No profile data provided.\n"
                
                if memory_payload:
                    system_context += "\nPatient's previous history of diseases/conditions:\n"
                    system_context += json.dumps(memory_payload)
                    
                tc_messages.append({"role": "system", "content": system_context})
                
                for a in all_answers:
                    tc_messages.append({"role": "assistant", "content": a.question_text})
                    tc_messages.append({"role": "user", "content": a.answer_text})
                    
                import hashlib
                te = TrainingExample(
                    session_id=str(session.id),
                    user_id=current_user.id,
                    messages=tc_messages,
                    system_prompt_hash=hashlib.sha256(b"dynamic_prompt").hexdigest(), # mock hash for now, real one depends on prompt builder
                    final_output=final_data,
                )
                db.add(te)

        db.commit()

    total_questions = 8  # Approximate
    progress = min((turn_count / total_questions) * 100, 100 if is_final else 95)

    return AnswerResponse(
        next_question=None if is_final else reply,
        next_question_category="adaptive",
        interview_complete=is_final,
        current_depth=turn_count,
        progress_pct=progress,
        options=None,
        final_data=final_data,
        highlights=highlights,
        mental_state=mental_state,
    )


@router.get("/result/{session_id}", response_model=RiskOutput)
async def get_result(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    answers = db.query(SessionAnswer).filter(
        SessionAnswer.session_id == session_id
    ).order_by(SessionAnswer.sequence_number).all()

    # If we already have a generated report stored, use it directly!
    if session.patient_explanation:
        return RiskOutput(
            session_id=session_id,
            risk_tier=session.risk_tier or "medium",
            risk_score=session.risk_score or 0.5,
            top_conditions=session.top_conditions or [{"name": "Assessment Completed", "confidence": 0.5}],
            reasoning_chain=session.reasoning_chain or [],
            behavioral_flags=[],
            recommended_action=session.recommended_action or "Please consult a healthcare provider.",
            patient_explanation=session.patient_explanation,
            doctor_explanation=session.doctor_explanation or session.patient_explanation,
            trajectory_label=session.trajectory_label,
            trajectory_score=None,
            dos=session.dos or [],
            donts=session.donts or [],
            see_doctor=bool(session.see_doctor),
            see_doctor_urgency=session.see_doctor_urgency,
            home_remedies=session.home_remedies or [],
            dietary_guidelines=session.dietary_guidelines,
            lifestyle_modifications=session.lifestyle_modifications or [],
            warning_signs=session.warning_signs or [],
        )

    # Fallback for old sessions that didn't persist the full report
    if session.risk_tier and session.top_conditions:
        risk_tier = session.risk_tier
        risk_score = session.risk_score or 0.5
        top_conditions = session.top_conditions or []
    else:
        risk_tier = "medium"
        risk_score = 0.5
        top_conditions = [{"name": "Assessment Pending", "confidence": 0.5}]

    # Try to get the final assessment from the ML session if it's not cached
    try:
        ml_result = await call_ml("chat", {
            "session_id": str(session_id),
            "message": "Please provide your final assessment now in JSON format.",
        })
        final_data = ml_result.get("final_data")
    except Exception as e:
        print(f"Failed to regenerate legacy report for {session_id}: {e}")
        final_data = None

    if final_data:
        risk_tier = final_data.get("risk_tier", risk_tier)
        risk_score = final_data.get("confidence_percent", 50) / 100.0
        top_conditions = [{"name": final_data.get("condition", "Unknown"), "confidence": risk_score}]
        patient_exp = final_data.get("explanation_patient", "This is a past assessment. Detailed explanations were not saved at the time.")
        doctor_exp = final_data.get("explanation_doctor", "")
        reasoning = final_data.get("reasoning", [])
        recommended_action = final_data.get("see_doctor_reason", "Consult a healthcare provider.")
        dos = final_data.get("dos", [])
        donts = final_data.get("donts", [])
        see_doctor = final_data.get("see_doctor", False)
        see_doctor_urgency = final_data.get("see_doctor_urgency")
        home_remedies = final_data.get("home_remedies", [])
        dietary_guidelines = final_data.get("dietary_guidelines")
        lifestyle_modifications = final_data.get("lifestyle_modifications", [])
        warning_signs = final_data.get("warning_signs", [])

        # Save updated results back to DB so we don't have to fetch next time
        session.risk_tier = risk_tier
        session.risk_score = risk_score
        session.top_conditions = top_conditions
        session.patient_explanation = patient_exp
        session.doctor_explanation = doctor_exp
        session.reasoning_chain = reasoning
        session.recommended_action = recommended_action
        session.dos = dos
        session.donts = donts
        session.see_doctor = see_doctor
        session.see_doctor_urgency = see_doctor_urgency
        session.home_remedies = home_remedies
        session.dietary_guidelines = dietary_guidelines
        session.lifestyle_modifications = lifestyle_modifications
        session.warning_signs = warning_signs
        db.commit()
    else:
        if session.status == "completed":
            patient_exp = "This is a legacy assessment. Full detailed explanations were not stored locally, and the clinical engine is currently unreachable to regenerate them."
        else:
            patient_exp = "The AI analysis session is processing. If this persists, please start a new assessment."
        doctor_exp = "RAG pipeline final output not received."
        reasoning = []
        recommended_action = "Please consult a healthcare provider for a full evaluation."
        dos = []
        donts = []
        see_doctor = True
        see_doctor_urgency = None
        home_remedies = []
        dietary_guidelines = None
        lifestyle_modifications = []
        warning_signs = []

    return RiskOutput(
        session_id=session_id,
        risk_tier=risk_tier,
        risk_score=risk_score,
        top_conditions=top_conditions,
        reasoning_chain=reasoning,
        behavioral_flags=[],
        recommended_action=recommended_action,
        patient_explanation=patient_exp,
        doctor_explanation=doctor_exp,
        trajectory_label=None,
        trajectory_score=None,
        dos=dos,
        donts=donts,
        see_doctor=see_doctor,
        see_doctor_urgency=see_doctor_urgency,
        home_remedies=home_remedies,
        dietary_guidelines=dietary_guidelines,
        lifestyle_modifications=lifestyle_modifications,
        warning_signs=warning_signs,
    )


@router.get("/report/pdf/{session_id}")
async def download_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Proxy PDF download from the ML service."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id, SessionModel.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_data = {
        "full_name": current_user.full_name,
        "age": current_user.age,
        "sex": current_user.sex,
        "weight": current_user.weight,
        "allergies": current_user.allergies,
        "medical_conditions": current_user.medical_conditions,
        "habits": current_user.habits,
        "family_history": current_user.family_history
    }
    
    final_data = {
        "condition": session.top_conditions[0]["name"] if session.top_conditions else "Unknown",
        "confidence_percent": int((session.risk_score or 0.5) * 100),
        "risk_tier": session.risk_tier or "medium",
        "explanation_doctor": session.doctor_explanation,
        "warning_signs": session.warning_signs or [],
        "see_doctor_urgency": session.see_doctor_urgency or "routine",
        "see_doctor_reason": session.recommended_action or "General Physician",
        "reasoning": session.reasoning_chain or [],
        "dos": session.dos or [],
        "donts": session.donts or [],
        "home_remedies": session.home_remedies or [],
        "dietary_guidelines": session.dietary_guidelines,
        "lifestyle_modifications": session.lifestyle_modifications or [],
    }

    pdf_bytes = await call_ml_raw(
        "report/pdf", 
        payload={"session_id": str(session_id), "patient_data": user_data, "final_data": final_data}, 
        method="POST"
    )
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=pulse_report_{session_id[:8]}.pdf"},
    )


@router.get("/history", response_model=List[SessionHistoryItem])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id,
        SessionModel.status == "completed"
    ).order_by(SessionModel.created_at.desc()).all()

    result = []
    for s in sessions:
        if not s.top_conditions and not s.patient_explanation:
            continue
        top = s.top_conditions[0]["name"] if s.top_conditions else None
        result.append(SessionHistoryItem(
            session_id=s.id,
            created_at=s.created_at,
            risk_tier=s.risk_tier,
            top_condition=top,
            status=s.status,
        ))
    return result


@router.delete("/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"[DELETE] Attempting to delete session {session_id} for user {current_user.id}")
    
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id
    ).first()
    if not session:
        print(f"[DELETE] Session {session_id} not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        from ..models.feedback import SessionFeedback
        
        n1 = db.query(SessionAnswer).filter(SessionAnswer.session_id == session_id).delete(synchronize_session="fetch")
        print(f"[DELETE] Deleted {n1} answers")
        
        n2 = db.query(UserHealthMemory).filter(UserHealthMemory.session_id == session_id).delete(synchronize_session="fetch")
        print(f"[DELETE] Deleted {n2} health memories")
        
        n3 = db.query(TrainingExample).filter(TrainingExample.session_id == session_id).delete(synchronize_session="fetch")
        print(f"[DELETE] Deleted {n3} training examples")
        
        n4 = db.query(SessionFeedback).filter(SessionFeedback.session_id == session_id).delete(synchronize_session="fetch")
        print(f"[DELETE] Deleted {n4} feedback entries")
        
        n5 = db.query(SymptomVector).filter(SymptomVector.session_id == session_id).delete(synchronize_session="fetch")
        print(f"[DELETE] Deleted {n5} symptom vectors")
        
        db.delete(session)
        db.commit()
        print(f"[DELETE] Successfully deleted session {session_id}")
        return {"status": "deleted", "session_id": session_id}
    except Exception as e:
        db.rollback()
        print(f"[DELETE] ERROR deleting session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")


@router.post("/population/report")
def population_report(
    payload: PopulationReport,
    db: Session = Depends(get_db)
):
    record = PopulationAggregate(
        region=payload.region,
        city=payload.city,
        symptom_category=payload.symptom_category,
    )
    db.add(record)
    db.commit()
    return {"status": "ok"}


@router.get("/population/summary")
def population_summary(db: Session = Depends(get_db)):
    rows = db.query(PopulationAggregate).order_by(
        PopulationAggregate.date.desc()
    ).limit(200).all()
    return [
        {
            "city": r.city,
            "region": r.region,
            "symptom_category": r.symptom_category,
            "date": r.date.isoformat() if r.date else None,
        }
        for r in rows
    ]
