"""
Groq Client — Calls Groq API with Llama 3.3 70B.
Orchestrates the full RAG pipeline: retrieve → build prompt → call LLM.
"""
import os
import re
import json
import time
import traceback
from dataclasses import dataclass
from dotenv import load_dotenv
from groq import Groq

from .knowledge_base.retriever import retrieve
from .prompt_builder import build_prompt
from . import session_manager

# ── Load env ──────────────────────────────────────────────────────────────────
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", ".env"))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))


# ── Config ────────────────────────────────────────────────────────────────────
@dataclass
class GroqConfig:
    model: str               = "llama-3.3-70b-versatile"
    temperature: float       = 0.07      
    top_p: float             = 0.9
    max_tokens_chat: int     = 512    # keep conversational turns tight
    max_tokens_final: int    = 2048   # final JSON needs room
    frequency_penalty: float = 0.1
    presence_penalty: float  = 0.1
    seed: int                = 42
    retries: int             = 3
    max_history_turns: int   = 10     # trim beyond this many user+assistant pairs
    final_turn_threshold: int = 5     # trigger final-assessment mode after N user turns

CONFIG = GroqConfig()


# ── Groq client singleton ─────────────────────────────────────────────────────
_client: Groq | None = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set. Add it to your .env file.")
        _client = Groq(api_key=api_key)
    return _client


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_n_results(text: str) -> int:
    """Scale RAG chunk count by query length to balance context vs noise."""
    word_count = len(text.split())
    if word_count < 20:
        return 4
    elif word_count < 60:
        return 6
    return 8


def _trim_history(history: list) -> list:
    """Keep only the last N turn-pairs to stay within context window."""
    max_items = CONFIG.max_history_turns * 2
    return history[-max_items:] if len(history) > max_items else history


def _extract_json(text: str) -> dict | None:
    """
    Robustly extract the outermost JSON object from LLM output.

    Strategy: find the first '{' and scan forward tracking brace depth
    to find the matching '}'. This handles nested objects correctly,
    unlike regex approaches which can't match balanced braces.
    """
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape_next = False

    for i, ch in enumerate(text[start:], start=start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start : i + 1])
                except json.JSONDecodeError:
                    return None

    return None


def _log_error(error: Exception) -> None:
    """Append error + traceback to groq_error.log."""
    with open("groq_error.log", "a") as f:
        f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {error}\n{traceback.format_exc()}\n")


def _log_audit(session_id: str, turn: int, chunks_used: int, is_final: bool) -> None:
    """Structured audit log — healthcare traceability."""
    entry = {
        "session_id":  session_id,
        "turn":        turn,
        "chunks_used": chunks_used,
        "is_final":    is_final,
        "model":       CONFIG.model,
        "timestamp":   time.time(),
    }
    with open("audit.log", "a") as f:
        f.write(json.dumps(entry) + "\n")


# ── Core LLM call ─────────────────────────────────────────────────────────────

def call_groq(system_prompt: str, messages: list, is_final_turn: bool = False) -> str:
    """
    Send system prompt + conversation history to Groq.
    Retries with exponential backoff on failure.
    """
    client = _get_client()
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    max_tok = CONFIG.max_tokens_final if is_final_turn else CONFIG.max_tokens_chat

    for attempt in range(CONFIG.retries):
        try:
            response = client.chat.completions.create(
                model=CONFIG.model,
                messages=full_messages,
                temperature=CONFIG.temperature,
                max_tokens=max_tok,
                top_p=CONFIG.top_p,
                frequency_penalty=CONFIG.frequency_penalty,
                presence_penalty=CONFIG.presence_penalty,
                seed=CONFIG.seed,
            )
            return response.choices[0].message.content

        except Exception as e:
            wait = 2 ** attempt
            if attempt < CONFIG.retries - 1:
                print(f"[Groq] Attempt {attempt + 1} failed — retrying in {wait}s...")
                time.sleep(wait)
            else:
                _log_error(e)
                return (
                    "I'm having trouble connecting right now. "
                    "Please try again in a moment."
                )


# ── RAG pipeline entry point ──────────────────────────────────────────────────

def process_message(session_id: str, user_message: str, profile_context: str | None = None, health_history: str | None = None) -> dict:
    """
    Full RAG pipeline:
      1. Store user message
      2. Retrieve guideline chunks (count scales with query length)
      3. Build system prompt with RAG context + user profile + health history
      4. Trim history to context window limit
      5. Detect final-turn heuristic
      6. Call Groq with retry + backoff
      7. Store assistant reply
      8. Extract structured JSON (answer + highlights) from every response
      9. Audit log

    Returns:
        {"reply": str, "turn_count": int, "is_final": bool, "final_data": dict | None, "highlights": list}
    """
    session_manager.add_message(session_id, "user", user_message)

    combined_text = session_manager.get_combined_text(session_id)
    n_results = _get_n_results(combined_text)
    chunks = retrieve(combined_text, n_results=n_results)

    system_prompt = build_prompt(chunks, profile_context=profile_context, health_history=health_history)

    raw_history = session_manager.get_history(session_id)
    history = _trim_history(raw_history)

    turn_count = session_manager.get_turn_count(session_id)
    is_final_turn = turn_count >= CONFIG.final_turn_threshold

    raw_reply = call_groq(system_prompt, history, is_final_turn=is_final_turn)
    session_manager.add_message(session_id, "assistant", raw_reply)

    # Parse structured JSON from every response
    is_final = False
    final_data = None
    highlights = []
    mental_state = None
    reply_text = raw_reply  # fallback: return raw text if JSON parsing fails

    parsed = _extract_json(raw_reply)
    if parsed:
        # Extract the conversational answer text
        if "answer" in parsed:
            reply_text = parsed["answer"]
        # Extract personalized highlights
        highlights = parsed.get("highlights", [])
        # Extract mental state / emotional tone
        mental_state = parsed.get("mental_state", None)
        # Check for final assessment
        if parsed.get("is_final") is True:
            is_final = True
            final_data = parsed

    _log_audit(session_id=session_id, turn=turn_count, chunks_used=n_results, is_final=is_final)

    return {
        "reply":        reply_text,
        "turn_count":   turn_count,
        "is_final":     is_final,
        "final_data":   final_data,
        "highlights":   highlights,
        "mental_state": mental_state,
    }