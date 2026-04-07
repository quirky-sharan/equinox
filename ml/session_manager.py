"""
Session Manager — In-memory conversation history per session.
No database. Data vanishes when the server restarts. This IS the privacy guarantee.
"""
import uuid
from typing import Dict, List, Any


# In-memory session storage
_sessions: Dict[str, List[Dict[str, str]]] = {}


def create_session() -> str:
    """Create a new session and return its UUID."""
    session_id = str(uuid.uuid4())
    _sessions[session_id] = []
    return session_id


def add_message(session_id: str, role: str, content: str):
    """
    Add a message to the session history.
    role: 'user' or 'assistant'
    """
    if session_id not in _sessions:
        _sessions[session_id] = []
    _sessions[session_id].append({"role": role, "content": content})


def get_history(session_id: str) -> List[Dict[str, str]]:
    """Get the full conversation history for a session."""
    return _sessions.get(session_id, [])


def get_turn_count(session_id: str) -> int:
    """Get the number of user messages in a session."""
    history = _sessions.get(session_id, [])
    return sum(1 for msg in history if msg["role"] == "user")


def clear_session(session_id: str):
    """Delete a session's history."""
    _sessions.pop(session_id, None)


def get_combined_text(session_id: str) -> str:
    """Get all user messages concatenated as a single string."""
    history = _sessions.get(session_id, [])
    return " ".join(msg["content"] for msg in history if msg["role"] == "user")


def active_session_count() -> int:
    """Return the number of currently active sessions in memory."""
    return len(_sessions)
