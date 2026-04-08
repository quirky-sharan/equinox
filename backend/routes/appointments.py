from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

from ..config import settings

router = APIRouter(prefix="/appointments", tags=["appointments"])

VAPI_BASE = "https://api.vapi.ai"


class CallRequest(BaseModel):
    doctor_name: str
    doctor_specialty: str
    doctor_phone: str          # e164 format e.g. "+917990588077"
    doctor_hospital: str
    doctor_available: str
    patient_name: Optional[str] = "the patient"


def _build_vapi_payload(req: CallRequest) -> dict:
    """Build a complete Vapi outbound call payload with a transient appointment-booking assistant."""

    system_prompt = f"""You are an AI medical receptionist calling on behalf of a patient to book an appointment.

Doctor Information:
- Name: {req.doctor_name}
- Specialty: {req.doctor_specialty}
- Hospital: {req.doctor_hospital}
- Available Hours: {req.doctor_available}

Your job:
1. Greet the doctor's receptionist or the doctor professionally.
2. Explain you are calling to book an appointment for {req.patient_name}.
3. Ask for an available appointment slot.
4. Confirm the date and time clearly.
5. Thank them and end the call politely.

If no one answers or the line is busy, leave a brief voicemail.
Keep the call under 2 minutes.
Be polite, professional, and concise."""

    first_message = (
        f"Hello, I'm calling on behalf of {req.patient_name} to schedule an appointment "
        f"with {req.doctor_name}, {req.doctor_specialty} at {req.doctor_hospital}. "
        f"Could you please help me find an available slot?"
    )

    return {
        "type": "outboundPhoneCall",
        "phoneNumberId": settings.VAPI_PHONE_NUMBER_ID,
        "customer": {
            "number": req.doctor_phone,
        },
        "assistant": {
            "name": "Equinox Appointment Agent",
            "firstMessage": first_message,
            "firstMessageMode": "assistant-speaks-first",
            "model": {
                "provider": "groq",
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt}
                ],
                "temperature": 0.7,
                "maxTokens": 500,
            },
            "voice": {
                "provider": "azure",
                "voiceId": "emma",
            },
            "endCallMessage": "Thank you for your time. Goodbye!",
            "endCallPhrases": [
                "goodbye", "bye", "have a good day", "thank you, goodbye",
                "we're all set", "that's all we needed"
            ],
            "maxDurationSeconds": 180,
            # Structured output: extract appointment details from the call transcript
            "analysisPlan": {
                "structuredDataPlan": {
                    "enabled": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "confirmed": {
                                "type": "boolean",
                                "description": "True if an appointment was successfully booked"
                            },
                            "appointment_date": {
                                "type": "string",
                                "description": "The date of the appointment (e.g. 'April 15, 2026' or '15/04/2026')"
                            },
                            "appointment_time": {
                                "type": "string",
                                "description": "The time of the appointment (e.g. '10:30 AM')"
                            },
                            "notes": {
                                "type": "string",
                                "description": "Any additional instructions or notes from the receptionist"
                            }
                        },
                        "required": ["confirmed"]
                    },
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a data extractor. Given the call transcript, extract the appointment "
                                "details. Set confirmed=true only if a specific date and time were agreed upon."
                            )
                        }
                    ]
                },
                "summaryPlan": {
                    "enabled": True,
                    "messages": [
                        {
                            "role": "system",
                            "content": "Summarize this appointment-booking call in 1-2 sentences."
                        }
                    ]
                }
            },
        }
    }


@router.post("/call")
async def initiate_call(req: CallRequest):
    """Trigger a Vapi outbound call to a doctor's phone to book an appointment."""
    if not settings.VAPI_API_KEY:
        raise HTTPException(status_code=500, detail="VAPI_API_KEY is not configured")
    if not settings.VAPI_PHONE_NUMBER_ID:
        raise HTTPException(status_code=500, detail="VAPI_PHONE_NUMBER_ID is not configured")

    payload = _build_vapi_payload(req)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{VAPI_BASE}/call",
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.VAPI_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code not in (200, 201):
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"Vapi error: {resp.text}"
                )
            data = resp.json()
            return {
                "call_id": data.get("id"),
                "status": data.get("status", "queued"),
                "doctor_name": req.doctor_name,
                "doctor_phone": req.doctor_phone,
            }
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Could not reach Vapi: {str(e)}")


@router.get("/call/{call_id}")
async def poll_call(call_id: str):
    """Poll a Vapi call for status and structured output (appointment result)."""
    if not settings.VAPI_API_KEY:
        raise HTTPException(status_code=500, detail="VAPI_API_KEY is not configured")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{VAPI_BASE}/call/{call_id}",
                headers={"Authorization": f"Bearer {settings.VAPI_API_KEY}"},
            )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Call not found")
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)

            data = resp.json()
            analysis = data.get("analysis", {})
            artifact = data.get("artifact", {})

            return {
                "call_id": call_id,
                "status": data.get("status"),
                "ended_reason": data.get("endedReason"),
                "structured_data": analysis.get("structuredData"),
                "summary": analysis.get("summary"),
                "transcript": artifact.get("transcript"),
                "duration_seconds": (
                    # endedAt - startedAt if both present
                    None
                ),
            }
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Could not reach Vapi: {str(e)}")
