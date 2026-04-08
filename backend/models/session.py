from sqlalchemy import Column, String, DateTime, Float, JSON, ForeignKey, Integer, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, default="active")  # active | completed | abandoned
    risk_tier = Column(String, nullable=True)  # low | medium | high | critical
    risk_score = Column(Float, nullable=True)
    top_conditions = Column(JSON, nullable=True)
    intensity_score = Column(Float, nullable=True)
    trajectory_label = Column(String, nullable=True)
    
    # Storage for full assessment results
    patient_explanation = Column(String, nullable=True)
    doctor_explanation = Column(String, nullable=True)
    reasoning_chain = Column(JSON, nullable=True)
    recommended_action = Column(String, nullable=True)
    dos = Column(JSON, nullable=True)
    donts = Column(JSON, nullable=True)
    see_doctor = Column(Boolean, nullable=True)
    see_doctor_urgency = Column(String, nullable=True)
    home_remedies = Column(JSON, nullable=True)
    dietary_guidelines = Column(JSON, nullable=True)
    lifestyle_modifications = Column(JSON, nullable=True)
    warning_signs = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="sessions")
    answers = relationship("SessionAnswer", back_populates="session")


class SessionAnswer(Base):
    __tablename__ = "session_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False, index=True)
    question_text = Column(String, nullable=False)
    question_category = Column(String, nullable=True)
    answer_text = Column(String, nullable=False)
    behavioral_metadata = Column(JSON, nullable=True)
    intensity_score = Column(Float, nullable=True)
    extracted_symptoms = Column(JSON, nullable=True)
    sequence_number = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="answers")


class SymptomVector(Base):
    __tablename__ = "symptom_vectors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    icd10_codes = Column(JSON, nullable=True)
    raw_symptoms = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PopulationAggregate(Base):
    __tablename__ = "population_aggregate"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    region = Column(String, nullable=True)
    city = Column(String, nullable=True)
    symptom_category = Column(String, nullable=False)
    report_count = Column(Integer, default=1)
    date = Column(DateTime(timezone=True), server_default=func.now())
