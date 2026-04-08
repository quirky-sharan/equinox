import json
from datetime import datetime

def format_memory(memory_json_str: str | None) -> str:
    """Takes the stringified JSON from the backend endpoint and formats it into the prompt."""
    if not memory_json_str:
        return "## PATIENT HEALTH HISTORY (from previous sessions)\n[No historical sessions recorded for this user.]"
        
    try:
        memories = json.loads(memory_json_str)
        if not memories:
            return "## PATIENT HEALTH HISTORY (from previous sessions)\n[No historical sessions recorded for this user.]"
            
        lines = ["## PATIENT HEALTH HISTORY (from previous sessions — treat as verified context)"]
        for m in memories:
            lines.append(f"""
Session {m.get('date', 'Unknown date')}: {m.get('condition', 'Unknown Condition')}
""")
        return "\n".join(lines)
    except Exception as e:
        print(f"Failed to parse memory json for injection: {e}")
        return "## PATIENT HEALTH HISTORY (from previous sessions)\n[Error parsing history.]"
