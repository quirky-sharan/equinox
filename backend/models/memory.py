from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, JSON
from sqlalchemy.sql import func
import uuid
from ..database import Base

class UserHealthMemory(Base):
    __tablename__ = "user_health_memory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    condition = Column(String, nullable=True)
    risk_tier = Column(String, nullable=True)
    confidence_percent = Column(Integer, nullable=True)
    symptoms_summary = Column(Text, nullable=True)
    key_findings = Column(JSON, nullable=True)
    see_doctor = Column(Boolean, nullable=True)
    see_doctor_urgency = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
