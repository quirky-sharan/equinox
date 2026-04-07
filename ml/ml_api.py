"""
Pulse — ML API Service (RAG + Groq LLM)
FastAPI microservice exposing chat, TTS, report, and session endpoints.
Runs on port 8001 — called by the main backend at port 8000.
"""
import json
import traceback
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
import edge_tts

from .groq_client import process_message
from . import session_manager
from .report_generator import generate_report

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Pulse ML Service",
    description="RAG-powered clinical AI · ChromaDB + Llama 3.3 70B via Groq",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str
    profile_context: str | None = None

class ChatResponse(BaseModel):
    reply: str
    turn_count: int
    is_final: bool
    final_data: Optional[dict] = None
    highlights: Optional[list] = None
    mental_state: Optional[dict] = None

class SpeakRequest(BaseModel):
    text: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_final_data(session_id: str) -> dict:
    """
    Walk session history backwards to find the most recent final JSON assessment.
    Raises HTTPException if session is missing or no final assessment found.
    """
    history = session_manager.get_history(session_id)
    if not history:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    for msg in reversed(history):
        if msg["role"] != "assistant":
            continue
        content = msg["content"]
        start = content.find("{")
        if start == -1:
            continue
        # Scan for balanced braces
        depth, in_str, escape = 0, False, False
        for i, ch in enumerate(content[start:], start=start):
            if escape:
                escape = False; continue
            if ch == "\\" and in_str:
                escape = True; continue
            if ch == '"':
                in_str = not in_str; continue
            if in_str:
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    try:
                        parsed = json.loads(content[start : i + 1])
                        if parsed.get("is_final"):
                            return parsed
                    except json.JSONDecodeError:
                        break

    raise HTTPException(status_code=400, detail="No final assessment found for this session.")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Pulse ML Service",
        "version": "2.1.0",
        "model": "llama-3.3-70b-versatile",
        "endpoints": [
            "POST /ml/chat",
            "POST /ml/speak",
            "GET  /ml/report/pdf?session_id=...",
            "POST /session/new",
            "DELETE /session/{session_id}",
            "GET  /status",
        ],
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "ml-rag"}


@app.get("/status")
def status():
    """Lightweight ops endpoint — active session count + service info."""
    return {
        "status": "ok",
        "active_sessions": session_manager.active_session_count(),
        "model": "llama-3.3-70b-versatile",
    }


@app.post("/session/new")
def new_session():
    """Create a new session. Returns session_id for the client to store."""
    session_id = session_manager.create_session()
    return {"session_id": session_id}


@app.delete("/session/{session_id}")
def delete_session(session_id: str):
    """Explicitly clear a session (GDPR-style deletion)."""
    session_manager.clear_session(session_id)
    return {"deleted": session_id}


@app.post("/ml/chat", response_model=ChatResponse)
def api_chat(req: ChatRequest):
    """
    Main chat endpoint — full RAG pipeline.
    Returns LLM reply + conversation metadata.
    """
    try:
        result = process_message(req.session_id, req.message, profile_context=req.profile_context)
        return ChatResponse(
            reply=result["reply"],
            turn_count=result["turn_count"],
            is_final=result["is_final"],
            final_data=result.get("final_data"),
            highlights=result.get("highlights", []),
            mental_state=result.get("mental_state"),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {e}")


@app.post("/ml/speak")
async def api_speak(req: SpeakRequest):
    """
    TTS via Edge TTS — streams MP3 audio.
    Voice: en-US-AriaNeural at +20% rate.
    """
    try:
        communicate = edge_tts.Communicate(req.text, "en-US-AriaNeural", rate="+20%")

        async def audio_stream():
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]

        return StreamingResponse(audio_stream(), media_type="audio/mpeg")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Voice synthesis failed.")


@app.get("/ml/report/pdf")
def api_report_pdf(session_id: str = Query(..., description="Session ID to generate report for")):
    """
    Generate a PDF clinical summary for a completed session.
    Session must have a final assessment (is_final=true) stored.
    """
    try:
        final_data = _extract_final_data(session_id)

        pdf_bytes = generate_report(
            condition=final_data.get("condition", "Unknown"),
            confidence=final_data.get("confidence_percent", 50),
            risk_tier=final_data.get("risk_tier", "medium"),
            explanation_doctor=final_data.get("explanation_doctor", "No detailed clinical summary provided."),
            warning_signs=final_data.get("warning_signs", []),
            urgency=final_data.get("see_doctor_urgency", "routine"),
            specialist=final_data.get("see_doctor_reason", "General Physician"),
            reasoning=final_data.get("reasoning", []),
        )

        filename = f"pulse_report_{session_id[:8]}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")