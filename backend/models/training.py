from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, JSON, Float
from sqlalchemy.sql import func
import uuid
from ..database import Base

class TrainingExample(Base):
    __tablename__ = "training_examples"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False, unique=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    messages = Column(JSON, nullable=False)
    system_prompt_hash = Column(String, nullable=True)
    final_output = Column(JSON, nullable=False)
    feedback_rating = Column(Integer, nullable=True)
    was_accurate = Column(Boolean, nullable=True)
    quality_score = Column(Float, nullable=True)
    approved_for_training = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
