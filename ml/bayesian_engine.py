"""
ClinicalMind — Bayesian Inference Engine
Takes normalized symptoms + intensity scores and calculates condition probabilities.
Uses a built-in symptom→condition knowledge base (no external CSV needed).
"""

import numpy as np
from typing import Dict, Any, List, Optional

from .nlp_pipeline import extract_symptoms
from .intensity_analyzer import analyze_intensity


# ─── Symptom–Condition Knowledge Base ──────────────────────────────────────────
# Each condition has: name, icd10, risk_weight, symptom_associations
# symptom_associations maps symptom ICD-10 codes to how strongly they suggest this condition (0-1)
CONDITIONS: List[Dict[str, Any]] = [
    {
        "name": "Common Cold (Acute Upper Respiratory Infection)",
        "icd10": "J06.9",
        "risk_weight": 0.2,
        "symptoms": {"R05.9": 0.7, "R09.81": 0.8, "R09.89": 0.7, "R07.0": 0.6, "R06.7": 0.5, "R51.9": 0.4, "R53.83": 0.3, "R50.9": 0.4},
    },
    {
        "name": "Influenza",
        "icd10": "J11.1",
        "risk_weight": 0.4,
        "symptoms": {"R50.9": 0.9, "R53.83": 0.8, "M79.10": 0.8, "R51.9": 0.7, "R05.9": 0.6, "R07.0": 0.5, "R68.83": 0.6, "R63.0": 0.4},
    },
    {
        "name": "Acute Bronchitis",
        "icd10": "J20.9",
        "risk_weight": 0.4,
        "symptoms": {"R05.9": 0.9, "R09.3": 0.7, "R07.89": 0.5, "R50.9": 0.4, "R53.83": 0.4, "R06.00": 0.4},
    },
    {
        "name": "Pneumonia",
        "icd10": "J18.9",
        "risk_weight": 0.8,
        "symptoms": {"R05.9": 0.8, "R50.9": 0.8, "R06.00": 0.8, "R07.89": 0.6, "R09.3": 0.7, "R53.83": 0.6, "R68.83": 0.5},
    },
    {
        "name": "Asthma Exacerbation",
        "icd10": "J45.901",
        "risk_weight": 0.6,
        "symptoms": {"R06.00": 0.95, "R06.2": 0.95, "R07.89": 0.85, "R05.9": 0.6, "G47.00": 0.5, "R53.83": 0.4, "R53.1": 0.4, "F41.9": 0.3, "R00.2": 0.3},
    },
    {
        "name": "COPD (Chronic Obstructive Pulmonary Disease)",
        "icd10": "J44.1",
        "risk_weight": 0.7,
        "symptoms": {"R06.00": 0.9, "R05.9": 0.8, "R06.2": 0.85, "R07.89": 0.7, "R53.83": 0.5, "R09.3": 0.6},
    },
    {
        "name": "Pulmonary Embolism",
        "icd10": "I26.99",
        "risk_weight": 1.0,
        "symptoms": {"R06.00": 0.9, "R07.89": 0.85, "R07.9": 0.8, "R00.2": 0.7, "R42": 0.5, "R53.1": 0.4, "R61": 0.4},
    },
    {
        "name": "Gastroesophageal Reflux Disease (GERD)",
        "icd10": "K21.0",
        "risk_weight": 0.3,
        "symptoms": {"R12": 0.9, "R07.9": 0.4, "R11.0": 0.4, "R05.9": 0.3, "R13.10": 0.3},
    },
    {
        "name": "Gastritis",
        "icd10": "K29.70",
        "risk_weight": 0.3,
        "symptoms": {"R10.9": 0.8, "R11.0": 0.7, "R14.0": 0.5, "R12": 0.5, "R63.0": 0.4},
    },
    {
        "name": "Irritable Bowel Syndrome",
        "icd10": "K58.9",
        "risk_weight": 0.3,
        "symptoms": {"R10.9": 0.8, "R14.0": 0.8, "R19.7": 0.6, "K59.00": 0.6, "R53.83": 0.3},
    },
    {
        "name": "Gastroenteritis",
        "icd10": "K52.9",
        "risk_weight": 0.4,
        "symptoms": {"R19.7": 0.9, "R11.10": 0.8, "R10.9": 0.7, "R11.0": 0.7, "R50.9": 0.5, "R53.83": 0.4},
    },
    {
        "name": "Tension Headache",
        "icd10": "G44.209",
        "risk_weight": 0.2,
        "symptoms": {"R51.9": 0.9, "M54.2": 0.5, "R53.83": 0.3, "Z73.3": 0.4},
    },
    {
        "name": "Migraine",
        "icd10": "G43.909",
        "risk_weight": 0.4,
        "symptoms": {"R51.9": 0.9, "R11.0": 0.6, "H53.9": 0.5, "R42": 0.4, "R53.83": 0.3},
    },
    {
        "name": "Generalized Anxiety Disorder",
        "icd10": "F41.1",
        "risk_weight": 0.4,
        "symptoms": {"F41.9": 0.9, "G47.00": 0.6, "R53.83": 0.5, "R00.2": 0.5, "R51.9": 0.3, "R10.9": 0.3, "M79.10": 0.3, "R41.840": 0.6},
    },
    {
        "name": "Major Depressive Disorder",
        "icd10": "F32.1",
        "risk_weight": 0.6,
        "symptoms": {"F32.9": 0.9, "G47.00": 0.7, "R53.83": 0.8, "R63.0": 0.5, "R63.5": 0.4, "R45.89": 0.6, "R41.840": 0.7},
    },
    {
        "name": "Iron Deficiency Anemia",
        "icd10": "D50.9",
        "risk_weight": 0.5,
        "symptoms": {"R53.83": 0.9, "R53.1": 0.7, "R42": 0.6, "R06.00": 0.4, "R51.9": 0.3, "R00.2": 0.4},
    },
    {
        "name": "Hypothyroidism",
        "icd10": "E03.9",
        "risk_weight": 0.5,
        "symptoms": {"R53.83": 0.8, "R63.5": 0.7, "K59.00": 0.5, "R53.1": 0.6, "F32.9": 0.4, "R41.840": 0.4, "R40.0": 0.5},
    },
    {
        "name": "Type 2 Diabetes (Uncontrolled)",
        "icd10": "E11.65",
        "risk_weight": 0.6,
        "symptoms": {"R53.83": 0.7, "R63.4": 0.6, "R35.0": 0.8, "R63.0": 0.3, "H53.9": 0.4, "R20.0": 0.5},
    },
    {
        "name": "Urinary Tract Infection",
        "icd10": "N39.0",
        "risk_weight": 0.4,
        "symptoms": {"R30.0": 0.9, "R35.0": 0.7, "R31.9": 0.5, "R50.9": 0.4, "R10.2": 0.5},
    },
    {
        "name": "Hypertension (Symptomatic)",
        "icd10": "I10",
        "risk_weight": 0.5,
        "symptoms": {"R51.9": 0.5, "R42": 0.5, "H53.9": 0.4, "R07.9": 0.3, "R06.00": 0.3, "I10": 0.9},
    },
    {
        "name": "Acute Coronary Syndrome",
        "icd10": "I24.9",
        "risk_weight": 1.0,
        "symptoms": {"R07.9": 0.9, "R06.00": 0.7, "R11.0": 0.4, "R61": 0.5, "R42": 0.4, "R53.1": 0.4, "F41.9": 0.3},
    },
    {
        "name": "Allergic Rhinitis",
        "icd10": "J30.9",
        "risk_weight": 0.2,
        "symptoms": {"R06.7": 0.8, "R09.89": 0.8, "R09.81": 0.7, "L29.9": 0.4, "R05.9": 0.3, "H57.10": 0.3},
    },
    {
        "name": "Contact Dermatitis",
        "icd10": "L25.9",
        "risk_weight": 0.2,
        "symptoms": {"R21": 0.9, "L29.9": 0.8, "R60.9": 0.4},
    },
    {
        "name": "Musculoskeletal Strain",
        "icd10": "M79.1",
        "risk_weight": 0.2,
        "symptoms": {"M79.10": 0.9, "M54.9": 0.6, "M25.50": 0.5, "M54.2": 0.4, "R53.83": 0.2},
    },
    {
        "name": "Chronic Fatigue Syndrome",
        "icd10": "R53.82",
        "risk_weight": 0.5,
        "symptoms": {"R53.83": 0.9, "R53.1": 0.7, "G47.00": 0.6, "M79.10": 0.6, "R41.840": 0.6, "R51.9": 0.4, "R41.3": 0.4},
    },
    {
        "name": "Fibromyalgia",
        "icd10": "M79.7",
        "risk_weight": 0.4,
        "symptoms": {"M79.10": 0.9, "R53.83": 0.8, "G47.00": 0.7, "R51.9": 0.5, "R41.840": 0.5, "F32.9": 0.4, "R10.9": 0.3},
    },
    {
        "name": "Vertigo (BPPV)",
        "icd10": "H81.10",
        "risk_weight": 0.3,
        "symptoms": {"R42": 0.9, "R11.0": 0.6, "R55": 0.3, "F41.9": 0.3},
    },
    {
        "name": "Appendicitis",
        "icd10": "K35.80",
        "risk_weight": 0.9,
        "symptoms": {"R10.9": 0.9, "R10.2": 0.7, "R50.9": 0.7, "R11.0": 0.6, "R11.10": 0.5, "R63.0": 0.5},
    },
    {
        "name": "Meningitis",
        "icd10": "G03.9",
        "risk_weight": 1.0,
        "symptoms": {"R51.9": 0.9, "M54.2": 0.8, "R50.9": 0.8, "R41.0": 0.6, "R11.10": 0.5, "H53.9": 0.4, "R56.9": 0.4},
    },
    {
        "name": "Stroke / TIA",
        "icd10": "I63.9",
        "risk_weight": 1.0,
        "symptoms": {"R53.1": 0.8, "R20.0": 0.8, "R47.89": 0.8, "H53.9": 0.7, "R42": 0.6, "R51.9": 0.5, "R41.0": 0.6},
    },
    {
        "name": "Panic Disorder",
        "icd10": "F41.0",
        "risk_weight": 0.4,
        "symptoms": {"F41.9": 0.9, "R00.2": 0.8, "R06.00": 0.7, "R07.9": 0.5, "R42": 0.5, "R25.1": 0.4, "R61": 0.4},
    },
    {
        "name": "Celiac Disease",
        "icd10": "K90.0",
        "risk_weight": 0.4,
        "symptoms": {"R19.7": 0.7, "R14.0": 0.7, "R10.9": 0.6, "R53.83": 0.6, "R63.4": 0.5, "R21": 0.3},
    },
]


def _compute_scores(
    symptom_icd10_codes: List[str],
    intensity_score: float = 0.5,
) -> List[Dict[str, Any]]:
    """
    Compute posterior-like probability scores for each condition
    given observed symptom ICD-10 codes and intensity.

    Scoring emphasizes:
    1. High-weight symptom matches (a 0.9 match matters more than a 0.3 match)
    2. Number of strong matches (>= 0.6 weight)
    3. Coverage of the condition's key symptoms
    """
    scored = []

    for condition in CONDITIONS:
        symptom_map = condition["symptoms"]
        matched_symptoms = []
        total_weight = 0.0
        strong_matches = 0  # symptoms with weight >= 0.6
        max_possible_weight = sum(symptom_map.values())

        for code in symptom_icd10_codes:
            if code in symptom_map:
                weight = symptom_map[code]
                total_weight += weight
                matched_symptoms.append(code)
                if weight >= 0.6:
                    strong_matches += 1

        if total_weight == 0:
            continue

        # Coverage: what fraction of the condition's symptoms were observed
        coverage = len(matched_symptoms) / max(len(symptom_map), 1)

        # Weighted match: how much of the condition's total weight was hit
        weighted_match = total_weight / max(max_possible_weight, 0.01)

        # Strong match bonus: heavily reward conditions where key symptoms match
        strong_ratio = strong_matches / max(len(matched_symptoms), 1)

        # Combined: weighted_match is most important, then strong_ratio, then coverage
        base_score = (weighted_match * 0.5 + strong_ratio * 0.3 + coverage * 0.2)

        # Intensity modifier — higher intensity boosts high-risk conditions
        intensity_modifier = 1.0 + (intensity_score - 0.5) * condition["risk_weight"] * 0.5

        final_score = min(base_score * intensity_modifier, 0.98)

        scored.append({
            "name": condition["name"],
            "icd10": condition["icd10"],
            "confidence": round(final_score, 3),
            "matched_symptoms": matched_symptoms,
            "risk_weight": condition["risk_weight"],
            "strong_matches": strong_matches,
        })

    scored.sort(key=lambda x: x["confidence"], reverse=True)
    return scored


def _determine_risk_tier(
    top_conditions: List[Dict[str, Any]],
    intensity_score: float,
    is_emergency: bool = False,
) -> str:
    """Determine overall risk tier."""
    if is_emergency:
        return "critical"

    if not top_conditions:
        return "low"

    top = top_conditions[0]
    risk_weight = top.get("risk_weight", 0.2)
    confidence = top.get("confidence", 0.0)

    composite = (risk_weight * 0.5 + confidence * 0.3 + intensity_score * 0.2)

    if composite >= 0.65 or risk_weight >= 0.9:
        return "critical"
    elif composite >= 0.45 or risk_weight >= 0.7:
        return "high"
    elif composite >= 0.30:
        return "medium"
    else:
        return "low"


def _build_reasoning(
    symptoms: List[Dict[str, Any]],
    top_conditions: List[Dict[str, Any]],
    intensity_level: str,
    behavioral_flags: List[str],
    is_emergency: bool = False,
) -> List[str]:
    """Build a human-readable reasoning chain."""
    chain = []

    if is_emergency:
        chain.append("CRITICAL: Emergency keywords detected in patient input. Immediate triage required.")

    # Symptom summary
    symptom_names = [s["normalized_term"] for s in symptoms[:6]]
    if symptom_names:
        chain.append(f"Identified symptoms: {', '.join(symptom_names)}")

    # Intensity note
    chain.append(f"Symptom intensity assessed as {intensity_level}")

    # Top condition reasoning
    if top_conditions:
        top = top_conditions[0]
        matched_count = len(top.get("matched_symptoms", []))
        chain.append(
            f"Primary assessment: {top['name']} (ICD-10: {top['icd10']}) — "
            f"{matched_count} symptom{'s' if matched_count != 1 else ''} matched "
            f"with {top['confidence']*100:.0f}% confidence"
        )

        if len(top_conditions) > 1:
            alts = [f"{c['name']} ({c['confidence']*100:.0f}%)" for c in top_conditions[1:3]]
            chain.append(f"Differential considerations: {', '.join(alts)}")

    # Behavioral note
    if behavioral_flags:
        chain.append(f"Behavioral analysis detected {len(behavioral_flags)} notable signal{'s' if len(behavioral_flags) != 1 else ''}")

    return chain


def _recommended_action(risk_tier: str, top_condition_name: str = "") -> str:
    """Generate recommended action based on risk tier."""
    actions = {
        "critical": "Seek immediate medical attention. Visit the emergency room or call emergency services now.",
        "high": "Contact your healthcare provider urgently. Consider visiting urgent care within the next 6 hours.",
        "medium": "Schedule an appointment with your primary care physician within the next few days. Monitor your symptoms closely.",
        "low": "Continue to monitor your symptoms. If they persist beyond 5-7 days or worsen, schedule a visit with your doctor.",
    }
    return actions.get(risk_tier, actions["low"])


def run_inference(
    text: str,
    answers: Optional[List[Dict[str, str]]] = None,
    behavioral_metadata: Optional[Dict[str, Any]] = None,
    audio_features: Optional[Dict[str, Any]] = None,
    session_history: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Full inference pipeline.

    Input:
        text: combined text from all answers
        answers: list of {question, answer} dicts
        behavioral_metadata: from frontend capture
    Output:
        Complete structured risk assessment
    """
    # 1. Symptom extraction
    nlp_result = extract_symptoms(text)
    symptoms = nlp_result["symptoms"]
    icd10_codes = [s["icd10_code"] for s in symptoms]

    # Also extract from individual answers if available
    if answers:
        for qa in answers:
            answer_nlp = extract_symptoms(qa.get("answer", ""))
            for s in answer_nlp["symptoms"]:
                if s["icd10_code"] not in icd10_codes:
                    icd10_codes.append(s["icd10_code"])
                    symptoms.append(s)

    # 2. Intensity analysis
    intensity = analyze_intensity(text, behavioral_metadata, audio_features)

    # 3. Bayesian inference
    condition_scores = _compute_scores(icd10_codes, intensity["intensity_score"])
    top_conditions = condition_scores[:5]

    # 3.5 Emergency check
    emergency_keywords = ["suicide", "kill myself", "chest pain", "can't breathe", "heart attack", "dying", "emergency"]
    is_emergency = any(kw in text.lower() for kw in emergency_keywords)

    # 4. Risk tier
    risk_tier = _determine_risk_tier(top_conditions, intensity["intensity_score"], is_emergency)

    # 5. Behavioral flags
    behavioral_flags = intensity.get("signals_detected", [])
    if is_emergency:
        behavioral_flags.append("EMERGENCY_KEYWORD_DETECTED")

    # 6. Reasoning chain
    reasoning = _build_reasoning(symptoms, top_conditions, intensity["intensity_level"], behavioral_flags, is_emergency)

    # 7. Recommended action
    top_name = top_conditions[0]["name"] if top_conditions else ""
    action = _recommended_action(risk_tier, top_name)

    # 8. Confidence score
    confidence = top_conditions[0]["confidence"] if top_conditions else 0.3

    return {
        "risk_tier": risk_tier,
        "confidence_score": round(confidence, 3),
        "top_conditions": [
            {"name": c["name"], "confidence": c["confidence"], "icd10": c["icd10"]}
            for c in top_conditions
        ],
        "reasoning_chain": reasoning,
        "behavioral_flags": behavioral_flags,
        "recommended_action": action,
        "intensity": intensity,
        "symptoms_extracted": symptoms[:10],
        "categories_detected": nlp_result["categories_detected"],
    }


# ── Quick test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    result = run_inference(
        "I feel really tired all the time and I have been getting headaches and dizziness. "
        "My muscles ache and I can't sleep well.",
        answers=[
            {"question": "How do you feel?", "answer": "I feel exhausted constantly"},
            {"question": "Any pain?", "answer": "yes headaches and body aches"},
        ]
    )
    print(f"Risk Tier: {result['risk_tier']}")
    print(f"Confidence: {result['confidence_score']}")
    print(f"Top conditions:")
    for c in result["top_conditions"]:
        print(f"  - {c['name']} ({c['icd10']}): {c['confidence']*100:.0f}%")
    print(f"\nReasoning:")
    for r in result["reasoning_chain"]:
        print(f"  {r}")
    print(f"\nAction: {result['recommended_action']}")
