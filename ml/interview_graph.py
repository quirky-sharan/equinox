"""
ClinicalMind — Adaptive Interview Graph
Clinical decision tree using networkx.  Chooses the next question dynamically
based on detected symptom categories from NLP analysis.
"""

import networkx as nx
from typing import Dict, Any, Optional, List

from .nlp_pipeline import get_primary_category, extract_symptoms


# ─── Build the Interview Graph ─────────────────────────────────────────────────
def _build_graph() -> nx.DiGraph:
    G = nx.DiGraph()

    # ── Root node ──────────────────────────────────────────────────────────────
    G.add_node("root", **{
        "question": "How would you describe how you have been feeling overall?",
        "category": "general",
        "depth": 0,
        "branch": "root",
    })

    # ── Branch: Fatigue ────────────────────────────────────────────────────────
    fatigue = [
        ("fatigue_1", "How long have you been feeling this level of tiredness — days, weeks, or months?", "onset"),
        ("fatigue_2", "Does the fatigue come and go, or is it constant throughout the day?", "pattern"),
        ("fatigue_3", "How is your sleep quality? Do you wake up feeling rested, or still exhausted?", "sleep"),
        ("fatigue_4", "Have you noticed any other changes — appetite, weight, mood, or concentration?", "associated"),
        ("fatigue_5", "On a scale of 1 to 10, how much is this fatigue affecting your ability to do daily tasks?", "severity"),
    ]
    prev = "root"
    for nid, question, cat in fatigue:
        G.add_node(nid, question=question, category=cat, depth=fatigue.index((nid, question, cat)) + 1, branch="fatigue")
        G.add_edge(prev, nid, condition="fatigue")
        prev = nid

    # ── Branch: Pain ───────────────────────────────────────────────────────────
    pain = [
        ("pain_1", "Where exactly do you feel the pain — can you point to a specific area?", "location"),
        ("pain_2", "How would you describe the pain — sharp, dull, throbbing, burning, or pressure?", "character"),
        ("pain_3", "When did this pain first start, and has it been getting better, worse, or staying the same?", "onset"),
        ("pain_4", "Is there anything that makes the pain better or worse — movement, eating, rest, medication?", "modifiers"),
        ("pain_5", "Does the pain spread or radiate to any other area of your body?", "radiation"),
    ]
    prev = "root"
    for nid, question, cat in pain:
        G.add_node(nid, question=question, category=cat, depth=pain.index((nid, question, cat)) + 1, branch="pain")
        G.add_edge(prev, nid, condition="pain")
        prev = nid

    # ── Branch: Respiratory ────────────────────────────────────────────────────
    respiratory = [
        ("resp_1", "Are you experiencing difficulty breathing, coughing, or any chest congestion?", "primary"),
        ("resp_2", "When did the breathing issues start — was it sudden or gradual?", "onset"),
        ("resp_3", "Do you produce any mucus or phlegm when you cough? If so, what color is it?", "sputum"),
        ("resp_4", "Does physical activity, lying down, or cold air make your breathing worse?", "triggers"),
        ("resp_5", "Do you have any fever, chills, or night sweats along with these symptoms?", "systemic"),
    ]
    prev = "root"
    for nid, question, cat in respiratory:
        G.add_node(nid, question=question, category=cat, depth=respiratory.index((nid, question, cat)) + 1, branch="respiratory")
        G.add_edge(prev, nid, condition="respiratory")
        prev = nid

    # ── Branch: Digestive ──────────────────────────────────────────────────────
    digestive = [
        ("dig_1", "What digestive symptoms are you experiencing — nausea, pain, bloating, changes in bowel habits?", "primary"),
        ("dig_2", "Is there any relationship between your symptoms and eating? Before, during, or after meals?", "timing"),
        ("dig_3", "Have you noticed any blood in your stool or vomit, or any dark/tarry stools?", "alarm"),
        ("dig_4", "How long have you had these symptoms, and have they changed over time?", "duration"),
        ("dig_5", "Have you had any recent changes in diet, travel, stress, or new medications?", "triggers"),
    ]
    prev = "root"
    for nid, question, cat in digestive:
        G.add_node(nid, question=question, category=cat, depth=digestive.index((nid, question, cat)) + 1, branch="digestive")
        G.add_edge(prev, nid, condition="digestive")
        prev = nid

    # ── Branch: Neurological ───────────────────────────────────────────────────
    neuro = [
        ("neuro_1", "Can you describe the neurological symptom more specifically — headache, dizziness, numbness, or something else?", "primary"),
        ("neuro_2", "When did this start, and was the onset sudden or gradual?", "onset"),
        ("neuro_3", "Is the symptom constant or does it come and go? Are there any patterns?", "pattern"),
        ("neuro_4", "Have you noticed any vision changes, weakness, speech difficulty, or coordination problems?", "red_flags"),
        ("neuro_5", "Have you had any recent head injuries, high stress, or changes in medication?", "context"),
    ]
    prev = "root"
    for nid, question, cat in neuro:
        G.add_node(nid, question=question, category=cat, depth=neuro.index((nid, question, cat)) + 1, branch="neurological")
        G.add_edge(prev, nid, condition="neurological")
        prev = nid

    # ── Branch: Mood ───────────────────────────────────────────────────────────
    mood = [
        ("mood_1", "How would you describe your emotional or mental state recently?", "primary"),
        ("mood_2", "How long have you been feeling this way — days, weeks, or months?", "duration"),
        ("mood_3", "How is this affecting your daily life — work, relationships, sleep, appetite?", "impact"),
        ("mood_4", "Have you experienced any physical symptoms alongside your mood changes — fatigue, headaches, stomach issues?", "somatic"),
        ("mood_5", "Is there anything specific that triggered these feelings, or did they develop without a clear cause?", "triggers"),
    ]
    prev = "root"
    for nid, question, cat in mood:
        G.add_node(nid, question=question, category=cat, depth=mood.index((nid, question, cat)) + 1, branch="mood")
        G.add_edge(prev, nid, condition="mood")
        prev = nid

    # ── Fallback branch (dermato / cardiovascular / urinary / general) ──────
    general_followup = [
        ("gen_1", "Where exactly in your body do you feel discomfort — can you point to a specific area?", "location"),
        ("gen_2", "When did this first start, and has it been constant or coming and going?", "onset"),
        ("gen_3", "On a scale from 1 to 10, how much is this affecting your daily life right now?", "severity"),
        ("gen_4", "Have you noticed anything that makes it better or worse?", "modifiers"),
        ("gen_5", "Have you experienced any other changes — sleep, appetite, mood, energy level?", "associated"),
    ]
    prev = "root"
    for nid, question, cat in general_followup:
        G.add_node(nid, question=question, category=cat, depth=general_followup.index((nid, question, cat)) + 1, branch="general")
        G.add_edge(prev, nid, condition="general")
        prev = nid

    return G


# Pre-build the graph (module-level singleton)
INTERVIEW_GRAPH = _build_graph()

# Branch mapping — which NLP categories route to which branch
CATEGORY_TO_BRANCH = {
    "fatigue": "fatigue",
    "pain": "pain",
    "respiratory": "respiratory",
    "digestive": "digestive",
    "neurological": "neurological",
    "mood": "mood",
    "dermatological": "general",
    "cardiovascular": "general",
    "urinary": "general",
    "general": "general",
}

# Total questions per interview session
TOTAL_QUESTIONS = 5


def get_first_question() -> Dict[str, Any]:
    """Return the root question."""
    root = INTERVIEW_GRAPH.nodes["root"]
    return {
        "question": root["question"],
        "category": root["category"],
        "depth": 0,
        "branch": root["branch"],
        "total_questions": TOTAL_QUESTIONS,
    }


def get_next_question(
    answer_text: str,
    current_category: str,
    depth: int,
    session_branch: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Determine the next question based on the user's answer.

    On depth=1 (first answer to root question), NLP detects the primary category
    and selects the branch. Subsequent questions follow that branch linearly.
    """
    G = INTERVIEW_GRAPH

    # Determine the branch from NLP on the first answer
    if depth <= 1 and not session_branch:
        detected = get_primary_category(answer_text)
        branch = CATEGORY_TO_BRANCH.get(detected, "general")
    else:
        branch = session_branch or "general"

    # Find all nodes in this branch, ordered by depth
    branch_nodes = sorted(
        [(nid, data) for nid, data in G.nodes(data=True) if data.get("branch") == branch and data.get("depth", 0) > 0],
        key=lambda x: x[1]["depth"]
    )

    # Select the node at the current depth
    if depth <= 0:
        depth = 1

    idx = depth - 1  # depth 1 → index 0
    if idx < len(branch_nodes):
        nid, data = branch_nodes[idx]
        return {
            "question": data["question"],
            "category": data["category"],
            "depth": depth,
            "branch": branch,
            "total_questions": TOTAL_QUESTIONS,
            "interview_complete": False,
        }
    else:
        # Interview complete
        return {
            "question": None,
            "category": None,
            "depth": depth,
            "branch": branch,
            "total_questions": TOTAL_QUESTIONS,
            "interview_complete": True,
        }


# ── Quick test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("First question:", get_first_question()["question"])
    print()

    # Simulate an interview
    answer1 = "I have been feeling really tired all the time"
    q2 = get_next_question(answer1, "general", 1)
    print(f"Answer: {answer1}")
    print(f"→ Branch: {q2['branch']}, Q{q2['depth']}: {q2['question']}")
    print()

    q3 = get_next_question("It has been going on for about 3 weeks", q2["category"], 2, q2["branch"])
    print(f"→ Q{q3['depth']}: {q3['question']}")

    q4 = get_next_question("It is constant, never goes away", q3["category"], 3, q3["branch"])
    print(f"→ Q{q4['depth']}: {q4['question']}")

    q5 = get_next_question("I lost some weight and I am not hungry", q4["category"], 4, q4["branch"])
    print(f"→ Q{q5['depth']}: {q5['question']}")

    q6 = get_next_question("About 7 out of 10", q5["category"], 5, q5["branch"])
    print(f"→ Q{q6['depth']}: complete={q6['interview_complete']}")
