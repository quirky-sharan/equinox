import json

cases_info = [
    ("case_001", "Migraine with Aura", "medium", 22, "F", "Splitting headache behind eyes...", 5),
    ("case_002", "GERD / Acid Reflux", "low", 45, "M", "Burning chest sensation...", 5),
    ("case_003", "Appendicitis", "critical", 19, "M", "Sharp right lower abdominal pain...", 5),
    ("case_004", "Panic Attack / Panic Disorder", "medium", 28, "F", "Heart racing, can't breathe...", 4),
    ("case_005", "Type 2 Diabetes (Early Onset)", "high", 52, "M", "Extremely thirsty...", 5),
    ("case_006", "UTI (Uncomplicated Cystitis)", "low", 24, "F", "Burning when urinating...", 5),
    ("case_007", "Kidney Stone (Ureterolithiasis)", "high", 38, "M", "Severe flank pain...", 5),
    ("case_008", "Asthma Exacerbation", "medium", 16, "F", "Tight chest, wheezing...", 4),
    ("case_009", "Iron Deficiency Anemia", "medium", 26, "F", "Extreme fatigue...", 5),
    ("case_010", "Hypertensive Urgency", "critical", 60, "M", "Worst headache ever...", 5),
    ("case_011", "Contact Dermatitis", "low", 29, "F", "Itchy red rash...", 5),
    ("case_012", "PCOS (Polycystic Ovary Syndrome)", "medium", 21, "F", "Periods every 45-60 days...", 5),
    ("case_013", "Generalized Anxiety Disorder", "medium", 33, "F", "Can't stop worrying...", 4),
    ("case_014", "Mechanical Lower Back Pain", "low", 40, "M", "Lower back pain...", 5),
    ("case_015", "Viral Gastroenteritis", "low", 27, "M", "Vomiting and diarrhea...", 4),
    ("case_016", "Allergic Reaction (Urticaria)", "medium", 20, "F", "Hives all over arms...", 4),
    ("case_017", "Hypothyroidism", "medium", 44, "F", "Gained 12kg in 6 months...", 5),
    ("case_018", "Cluster Headache", "high", 35, "M", "Excruciating one-sided headache...", 5),
    ("case_019", "Plantar Fasciitis", "low", 48, "M", "Heel pain every morning...", 5),
    ("case_020", "Benign Paroxysmal Positional Vertigo (BPPV)", "low", 55, "F", "Room spinning...", 5),
    ("case_021", "Strep Throat (GAS Pharyngitis)", "medium", 14, "M", "Severe sore throat...", 5),
    ("case_022", "Acute Sinusitis", "low", 36, "F", "Facial pressure...", 4),
    ("case_023", "Obstructive Sleep Apnea", "medium", 50, "M", "Partner says I stop breathing...", 5),
    ("case_024", "Vitamin D Deficiency", "low", 30, "F", "Bone aches, fatigue...", 5),
    ("case_025", "Irritable Bowel Syndrome (IBS)", "low", 29, "F", "Alternating constipation...", 5),
    ("case_026", "Gout (Acute Flare)", "medium", 55, "M", "Big toe red hot swollen...", 5),
    ("case_027", "Community-Acquired Pneumonia", "high", 62, "F", "Productive cough...", 5),
    ("case_028", "Deep Vein Thrombosis (DVT)", "critical", 42, "M", "Left calf swollen...", 5),
    ("case_029", "Major Depressive Disorder", "high", 27, "M", "Low mood every day...", 5),
    ("case_030", "Hyperthyroidism (Graves Disease)", "medium", 32, "F", "Heart racing...", 5),
    ("case_031", "Peptic Ulcer Disease", "medium", 47, "M", "Burning stomach pain...", 5),
    ("case_032", "Celiac Disease", "medium", 31, "F", "Bloating and diarrhea...", 5),
    ("case_033", "Herpes Zoster (Shingles)", "medium", 58, "M", "Burning pain...", 5),
    ("case_034", "Dengue Fever", "high", 25, "M", "High fever 5 days...", 5),
    ("case_035", "Restless Legs Syndrome", "low", 45, "F", "Crawling sensation in legs...", 4),
    ("case_036", "Benign Prostatic Hyperplasia (BPH)", "medium", 67, "M", "Weak urine stream...", 5),
    ("case_037", "Carpal Tunnel Syndrome", "low", 38, "F", "Numbness and tingling...", 5),
    ("case_038", "Heat Exhaustion", "high", 21, "M", "Dizzy, heavy sweating...", 5),
    ("case_039", "Stress Alopecia (Telogen Effluvium)", "low", 28, "F", "Alarming hair loss...", 5),
    ("case_040", "Osteoarthritis (Knee)", "medium", 65, "F", "Right knee pain...", 4),
    ("case_041", "Menstrual Migraine", "low", 19, "F", "Severe headache...", 5),
    ("case_042", "Eczema (Atopic Dermatitis) Flare", "low", 23, "M", "Intensely itchy patches...", 4),
    ("case_043", "Hypoglycemia (Diabetic)", "high", 48, "M", "Shaking, sweating...", 5),
    ("case_044", "Tendinopathy (Achilles)", "low", 36, "M", "Achilles heel pain...", 4),
    ("case_045", "Cervicogenic Headache", "low", 44, "M", "Headache starting in neck...", 5)
]

output_json = []

for cid, cond, risk, age, sex, comp, rating in cases_info:
    output_json.append({
        "id": cid,
        "condition": cond,
        "risk": risk,
        "demographic": {"age": age, "sex": sex},
        "chief_complaint": comp,
        "turns": [
            ["Hello", "How can I help you today?"],
            [comp, "How long has this been going on?"]
        ],
        "final_data": {
            "condition": cond,
            "confidence_percent": 85,
            "risk_tier": risk,
            "explanation_patient": "This appears to be " + cond,
            "explanation_doctor": "Clinical manifestation consistent with " + cond,
            "dos": ["Rest", "Drink fluids"],
            "donts": ["Avoid stress", "Avoid strenuous activity"],
            "home_remedies": ["Warm compress", "Rest"],
            "dietary_guidelines": {"eat": [], "drink": [], "avoid": []},
            "lifestyle_modifications": ["Regular sleep", "Moderate exercise"],
            "see_doctor": risk in ["high", "critical"],
            "see_doctor_urgency": "soon" if risk == "high" else ("emergency" if risk == "critical" else "routine"),
            "see_doctor_reason": "Further evaluation",
            "warning_signs": ["Worsening pain", "Fever"],
            "reasoning": ["Patient presented with " + comp]
        },
        "feedback": {
            "rating": rating,
            "was_accurate": True,
            "helpful_text": "Good assessment",
            "not_helpful_text": ""
        }
    })

with open("e:/ieee_internal_hack/sample_cases_seed.json", "w") as f:
    json.dump(output_json, f, indent=2)
