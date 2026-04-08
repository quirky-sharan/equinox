from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey
from sqlalchemy.sql import func
import uuid
from ..database import Base

class SessionFeedback(Base):
    __tablename__ = "session_feedback"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False, unique=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    was_accurate = Column(Boolean, nullable=True)
    helpful_text = Column(Text, nullable=True)
    not_helpful_text = Column(Text, nullable=True)
    actual_diagnosis = Column(String, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
