"""
Groq Client — Calls Groq API with Llama 3.3 70B.
Orchestrates the full RAG pipeline: retrieve → build prompt → call LLM.
"""
import os
import json
from dotenv import load_dotenv
from groq import Groq

from .knowledge_base.retriever import retrieve
from .prompt_builder import build_prompt
from . import session_manager

# Load env
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", ".env"))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables. Add it to your .env file.")
        _client = Groq(api_key=api_key)
    return _client


def call_groq(system_prompt: str, messages: list) -> str:
    """
    Send the system prompt + conversation history to Groq and return the reply.
    """
    try:
        client = _get_client()
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=full_messages,
            temperature=0.7,
            max_tokens=4096,
            top_p=0.9,
        )
        return response.choices[0].message.content
    except Exception as e:
        import traceback
        with open("groq_error.log", "a") as f:
            f.write(f"[Groq API Error] {e}\n{traceback.format_exc()}\n")
        print(f"[Groq API Error] {e}")
        return "I'm sorry, I'm having trouble connecting right now. Could you please try again in a moment?"


def process_message(session_id: str, user_message: str) -> dict:
    """
    Full RAG pipeline entry point.

    1. Store the user message in session history
    2. Retrieve relevant medical guideline chunks from ChromaDB
    3. Build the system prompt with retrieved context
    4. Call Groq with full conversation history
    5. Store the assistant reply in session history
    6. Return the reply + metadata

    Returns:
        {
            "reply": str,
            "turn_count": int,
            "is_final": bool,
            "final_data": dict | None  (parsed JSON if is_final)
        }
    """
    # 1. Store user message
    session_manager.add_message(session_id, "user", user_message)

    # 2. Retrieve relevant guideline chunks
    combined_text = session_manager.get_combined_text(session_id)
    chunks = retrieve(combined_text, n_results=8)

    # 3. Build system prompt with RAG context
    system_prompt = build_prompt(chunks)

    # 4. Get conversation history and call Groq
    history = session_manager.get_history(session_id)
    reply = call_groq(system_prompt, history)

    # 5. Store assistant reply
    session_manager.add_message(session_id, "assistant", reply)

    # 6. Parse response — check if it's the final JSON assessment
    turn_count = session_manager.get_turn_count(session_id)
    is_final = False
    final_data = None

    try:
        # Try to extract JSON from the reply
        json_start = reply.find("{")
        json_end = reply.rfind("}") + 1
        if json_start != -1 and json_end > json_start:
            potential_json = reply[json_start:json_end]
            parsed = json.loads(potential_json)
            if parsed.get("is_final") == True:
                is_final = True
                final_data = parsed
    except (json.JSONDecodeError, ValueError):
        pass

    return {
        "reply": reply,
        "turn_count": turn_count,
        "is_final": is_final,
        "final_data": final_data,
    }
