"""
Meowmeow — ML API Service (RAG + Groq LLM)
FastAPI microservice exposing chat and report endpoints.
Runs on port 8001 — called by the main backend at port 8000.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

from .groq_client import process_message
from . import session_manager
from .report_generator import generate_report

# ─── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Meowmeow ML Service (RAG + Groq)",
    description="RAG-powered clinical AI using ChromaDB + Llama 3.3 70B via Groq",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    turn_count: int
    is_final: bool
    final_data: Optional[dict] = None


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Meowmeow ML Service (RAG + Groq)",
        "version": "2.0.0",
        "model": "llama-3.3-70b-versatile",
        "endpoints": ["/ml/chat", "/ml/report/pdf"],
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "ml-rag"}


@app.post("/ml/chat", response_model=ChatResponse)
def api_chat(req: ChatRequest):
    """
    Main chat endpoint — processes a user message through the full RAG pipeline.
    Returns the LLM's response and metadata about the conversation state.
    """
    try:
        result = process_message(req.session_id, req.message)
        return ChatResponse(
            reply=result["reply"],
            turn_count=result["turn_count"],
            is_final=result["is_final"],
            final_data=result.get("final_data"),
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@app.get("/ml/report/pdf")
def api_report_pdf(session_id: str):
    """
    Generate a PDF clinical summary report for a completed session.
    The final_data must have been stored from the last chat call.
    """
    try:
        # Get the conversation history and find the final assessment
        history = session_manager.get_history(session_id)
        if not history:
            raise HTTPException(status_code=404, detail="Session not found")

        # Find the last assistant message that contains the final JSON
        import json
        final_data = None
        for msg in reversed(history):
            if msg["role"] == "assistant":
                try:
                    json_start = msg["content"].find("{")
                    json_end = msg["content"].rfind("}") + 1
                    if json_start != -1 and json_end > json_start:
                        parsed = json.loads(msg["content"][json_start:json_end])
                        if parsed.get("is_final"):
                            final_data = parsed
                            break
                except (json.JSONDecodeError, ValueError):
                    continue

        if not final_data:
            raise HTTPException(status_code=400, detail="No final assessment found for this session")

        pdf_bytes = generate_report(
            condition=final_data.get("condition", "Unknown"),
            confidence=final_data.get("confidence_percent", 50),
            risk_tier=final_data.get("risk_tier", "medium"),
            explanation=final_data.get("explanation_patient", ""),
            dos=final_data.get("dos", []),
            donts=final_data.get("donts", []),
            see_doctor=final_data.get("see_doctor", False),
            see_doctor_reason=final_data.get("see_doctor_reason", ""),
            reasoning=final_data.get("reasoning", []),
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=meowmeow_report_{session_id[:8]}.pdf"},
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
