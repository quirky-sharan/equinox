from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import user, session, memory, feedback, training  # noqa: F401 - ensure models are registered
from .routes.auth import router as auth_router
from .routes.session import router as session_router
from .routes.memory import router as memory_router
from .routes.feedback import router as feedback_router
from .routes.admin import router as admin_router
from .config import settings

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pulse API",
    description="Intelligent Symptom Analysis & Risk Assessment Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for seamless Vercel deployment and preview branches
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(session_router, prefix="/api")
app.include_router(memory_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.get("/")
def root():
    return {"status": "Pulse API running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
