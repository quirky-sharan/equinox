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


async def call_ml_raw(endpoint: str, params: dict = None, timeout: float = 30.0) -> bytes:
    """Call ML microservice and return raw bytes (for PDF)."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
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

    # Call the RAG pipeline with an initial greeting to get the first question
    ml_result = await call_ml("chat", {
        "session_id": str(session.id),
        "message": "Hello, I need help understanding what's going on with my health.",
        "profile_context": profile_context or None,
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

    # Call RAG pipeline — forward user's answer to the LLM
    ml_result = await call_ml("chat", {
        "session_id": str(payload.session_id),
        "message": payload.answer_text,
        "profile_context": profile_context or None,
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

    # If we already have stored results, use them
    if session.risk_tier and session.top_conditions:
        risk_tier = session.risk_tier
        risk_score = session.risk_score or 0.5
        top_conditions = session.top_conditions or []
    else:
        risk_tier = "medium"
        risk_score = 0.5
        top_conditions = [{"name": "Assessment Pending", "confidence": 0.5}]

    # Try to get the final assessment from the ML session
    ml_result = await call_ml("chat", {
        "session_id": str(session_id),
        "message": "Please provide your final assessment now in JSON format.",
    })

    final_data = ml_result.get("final_data")
    if final_data:
        risk_tier = final_data.get("risk_tier", risk_tier)
        risk_score = final_data.get("confidence_percent", 50) / 100.0
        top_conditions = [{"name": final_data.get("condition", "Unknown"), "confidence": risk_score}]
        patient_exp = final_data.get("explanation_patient", "")
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

        # Save updated results
        session.risk_tier = risk_tier
        session.risk_score = risk_score
        session.top_conditions = top_conditions
        db.commit()
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
):
    """Proxy PDF download from the ML service."""
    pdf_bytes = await call_ml_raw("report/pdf", {"session_id": str(session_id)})
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=meowmeow_report_{session_id[:8]}.pdf"},
    )


@router.get("/history", response_model=List[SessionHistoryItem])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id
    ).order_by(SessionModel.created_at.desc()).all()

    result = []
    for s in sessions:
        top = s.top_conditions[0]["name"] if s.top_conditions else None
        result.append(SessionHistoryItem(
            session_id=s.id,
            created_at=s.created_at,
            risk_tier=s.risk_tier,
            top_condition=top,
            status=s.status,
        ))
    return result


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
