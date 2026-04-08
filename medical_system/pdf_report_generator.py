# requirements.txt
# reportlab>=4.0.0

from io import BytesIO
import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle

def _check_allergy_conflict(patient_data: Dict[str, Any]) -> str:
    """Check for allergy conflicts in management."""
    allergies = patient_data.get('allergies', [])
    if not allergies:
        return None
        
    management = " ".join(patient_data.get('management_considerations', [])).lower()
    
    conflicts = []
    for alg in allergies:
        if alg.lower() in management:
            conflicts.append(alg)
            
    if conflicts:
        return f"CRITICAL CONFLICT: Management involves known allergen ({', '.join(conflicts).upper()})"
    return None

def _is_pmh_relevant(pmh: List[str], assessment: str, complaint: str, differentials: List[Dict]) -> List[str]:
    """
    Check if any previous medical history is clinically relevant to the new assessment.
    Returns the filtered list of relevant PMH.
    """
    if not pmh:
        return []
        
    # Naive keyword category mapping for clinical context matching
    cardio_kw = ['chest', 'heart', 'coronary', 'hypertension', 'afib', 'myocardial', 'dyspnea', 'blood', 'tachycardia']
    resp_kw = ['breath', 'asthma', 'copd', 'lung', 'cough', 'pneumonia', 'dyspnea', 'wheeze']
    neuro_kw = ['headache', 'dizzy', 'stroke', 'seizure', 'migraine', 'neuropathy', 'syncope']
    
    text_corpus = (assessment + " " + complaint + " " + " ".join([d.get('condition', '') for d in differentials])).lower()
    
    relevant_pmh = []
    for condition in pmh:
        cond_lower = condition.lower()
        # Direct word overlap
        if sum(word in text_corpus for word in cond_lower.split() if len(word) > 3) > 0:
            relevant_pmh.append(condition)
            continue
            
        # Category overlap finding
        for cat in [cardio_kw, resp_kw, neuro_kw]:
            if any(k in cond_lower for k in cat) and any(k in text_corpus for k in cat):
                relevant_pmh.append(condition)
                break
                
    return relevant_pmh

def calculate_risk_scores(patient_data: Dict[str, Any]) -> str:
    """Calculate specific algorithmic risk scores (HEART, CURB-65) off data."""
    score_blocks = []
    
    complaint = patient_data.get('chief_complaint', '').lower()
    age = patient_data.get('age', 0)
    
    # 1. HEART Score for Chest Pain
    if 'chest' in complaint or 'angina' in complaint:
        heart_score = 0
        if age >= 65: heart_score += 2
        elif age >= 45: heart_score += 1
        
        pmh = " ".join(patient_data.get('pmh', [])).lower()
        if 'hypertension' in pmh or 'diabetes' in pmh or 'obesity' in pmh:
            heart_score += 1
            
        score_blocks.append(f"HEART Score Estimate: {heart_score}/10 (0-3: Low risk, 4-6: Moderate risk, 7-10: High risk)")
        
    # 2. CURB-65 for Pneumonia/Dyspnea
    if 'breath' in complaint or 'cough' in complaint or 'dyspnea' in complaint:
        curb = 0
        if age >= 65: curb += 1
        vitals = patient_data.get('vitals', {})
        if vitals.get('RR', 0) >= 30: curb += 1
        
        bp = vitals.get('BP', '120/80')
        if '/' in bp:
            try:
                bp_sys, bp_dia = bp.split('/')
                if int(bp_sys) < 90 or int(bp_dia) <= 60: curb += 1
            except: pass
        
        score_blocks.append(f"CURB-65 Estimate: {curb}/5 (0-1: Low risk, 2: Moderate risk, 3+: Severe risk)")
        
    if not score_blocks:
        score_blocks.append("No specialized algorithmic criteria met based on chief complaint parameters.")
        
    return "<br/>".join(score_blocks)

def build_pdf_document(patient_data: Dict[str, Any], output_path: str = None) -> bytes:
    """Generate the single-page clinical PDF layout using ReportLab Platypus."""
    
    # Pre-process PMH relevance constraint
    pmh_relevant = _is_pmh_relevant(
        patient_data.get('pmh', []),
        patient_data.get('ai_assessment', ''),
        patient_data.get('chief_complaint', ''),
        patient_data.get('differentials', [])
    )
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer if not output_path else output_path,
        pagesize=A4,
        topMargin=1.2 * cm, bottomMargin=1.2 * cm,
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=14, textColor=HexColor("#1e293b"), fontName="Helvetica-Bold", spaceAfter=4)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=10, textColor=HexColor("#0f172a"), fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4, borderPadding=(0,0,2,0), borderColor=HexColor("#cbd5e1"), borderWidth=0.5)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9, leading=12, textColor=HexColor("#334155"))
    body_bold = ParagraphStyle("BodyBold", parent=body_style, fontName="Helvetica-Bold")
    alert_style = ParagraphStyle("Alert", parent=body_style, textColor=HexColor("#b91c1c"), fontName="Helvetica-Bold")
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"], fontSize=7, textColor=HexColor("#94a3b8"), alignment=TA_CENTER, spaceBefore=8)
    
    elements = []
    
    # Triage Color
    urgency = patient_data.get('priority', 'ROUTINE').upper()
    urg_colors = {"EMERGENT": "#ef4444", "URGENT": "#f59e0b", "SEMI-URGENT": "#eab308", "ROUTINE": "#10b981"}
    color = urg_colors.get(urgency, "#64748b")
    
    # --- HEADER ---
    elements.append(Paragraph("AI CLINICAL HANDOVER SUMMARY", title_style))
    head_t = Table([
        [Paragraph(f"<b>Patient:</b> {patient_data.get('name')}", body_style),
         Paragraph(f"<b>Age/Sex:</b> {patient_data.get('age')}/{patient_data.get('sex')}", body_style),
         Paragraph(f"<b>Date:</b> {datetime.date.today()}", body_style)],
        [Paragraph(f"<b>Triage:</b> <font color='{color}'>{urgency}</font>", body_bold), "", ""]
    ], colWidths=[6*cm, 6*cm, 6*cm])
    head_t.setStyle(TableStyle([('LINEBELOW', (0,1), (-1,1), 1, HexColor("#e2e8f0")), ('SPAN', (0,1), (2,1))]))
    elements.append(head_t)
    elements.append(Spacer(1, 10))

    # --- SECTION 1 ---
    elements.append(Paragraph("SECTION 1 — PATIENT SNAPSHOT", heading_style))
    allergies = ", ".join(patient_data.get('allergies', []))
    alg_p = Paragraph(f"<b>Allergies:</b> <font color='red'>{allergies}</font>" if allergies else "<b>Allergies:</b> None", body_style)
    meds = ", ".join(patient_data.get('medications', []))
    
    vitals = patient_data.get('vitals', {})
    bmi = vitals.get('BMI', 'N/A')
    
    snap_data = [[Paragraph(f"<b>Age/Sex:</b> {patient_data.get('age')}/{patient_data.get('sex')}", body_style), alg_p],
                 [Paragraph(f"<b>Medications:</b> {meds}", body_style), Paragraph(f"<b>BMI:</b> {bmi}", body_style)]]
                 
    if pmh_relevant:
        snap_data.append([Paragraph(f"<b>Relevant PMHx:</b> {', '.join(pmh_relevant)}", body_style), ""])
        
    t_snap = Table(snap_data, colWidths=[9*cm, 9*cm], style=TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    elements.append(t_snap)
    
    # --- SECTION 2 ---
    elements.append(Paragraph("SECTION 2 — PRESENTING COMPLAINT & SUMMARY", heading_style))
    elements.append(Paragraph(f"<b>CC:</b> {patient_data.get('chief_complaint')}", body_style))
    elements.append(Paragraph(f"<b>Onset/Duration:</b> {patient_data.get('duration')}", body_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>AI Assessment:</b> {patient_data.get('ai_assessment')}", body_style))
    
    elements.append(Spacer(1, 4))
    v_data = [[Paragraph("<b>BP</b>", body_style), Paragraph("<b>HR</b>", body_style), Paragraph("<b>RR</b>", body_style), Paragraph("<b>SpO2</b>", body_style), Paragraph("<b>Temp</b>", body_style)],
              [Paragraph(str(vitals.get('BP', '')), body_style), Paragraph(str(vitals.get('HR', '')), body_style), Paragraph(str(vitals.get('RR', '')), body_style), Paragraph(str(vitals.get('SpO2', '')), body_style), Paragraph(str(vitals.get('Temp', '')), body_style)]]
    
    t_vitals = Table(v_data, colWidths=[3.5*cm]*5)
    t_vitals.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), HexColor("#f1f5f9")), ('BOX', (0,0), (-1,-1), 0.5, HexColor("#cbd5e1")), ('INNERGRID', (0,0), (-1,-1), 0.5, HexColor("#cbd5e1"))]))
    elements.append(t_vitals)

    # --- SECTION 3 ---
    elements.append(Paragraph("SECTION 3 — RED FLAGS", heading_style))
    flags = patient_data.get('red_flags', {})
    flag_data = []
    for f, present in flags.items():
        if present:
            flag_data.append([Paragraph(f, body_style), Paragraph("<font color='red'><b>YES</b></font>", body_style)])
        else:
            flag_data.append([Paragraph(f, body_style), Paragraph("NO", body_style)])
    if flag_data:
        elements.append(Table(flag_data, colWidths=[12*cm, 4*cm]))
        
    # --- SECTION 4 ---
    elements.append(Paragraph("SECTION 4 — RISK STRATIFICATION", heading_style))
    elements.append(Paragraph(calculate_risk_scores(patient_data), body_style))
    conflict = _check_allergy_conflict(patient_data)
    if conflict:
        elements.append(Paragraph(conflict, alert_style))

    # --- SECTION 5 ---
    elements.append(Paragraph("SECTION 5 — DIFFERENTIAL DIAGNOSIS", heading_style))
    diffs = patient_data.get('differentials', [])
    for idx, d in enumerate(diffs, 1):
        elements.append(Paragraph(f"{idx}. <b>{d.get('condition')}</b> — {d.get('rationale')} <b>[{d.get('urgency')}]</b>", body_style))
        
    # --- SECTION 6 ---
    elements.append(Paragraph("SECTION 6 — SUGGESTED WORKUP", heading_style))
    workup = patient_data.get('workup', [])
    w_data = [[Paragraph("<b>Investigation</b>", body_style), Paragraph("<b>Rationale</b>", body_style), Paragraph("<b>Priority</b>", body_style)]]
    for w in workup:
        w_data.append([Paragraph(w.get('test',''), body_style), Paragraph(w.get('rationale',''), body_style), Paragraph(w.get('priority',''), body_style)])
    
    t_w = Table(w_data, colWidths=[4*cm, 10*cm, 4*cm])
    t_w.setStyle(TableStyle([('LINEBELOW', (0,0), (-1,0), 0.5, HexColor("#cbd5e1"))]))
    elements.append(t_w)
    
    # --- SECTION 7 ---
    elements.append(Paragraph("SECTION 7 — MANAGEMENT CONSIDERATIONS", heading_style))
    for m in patient_data.get('management_considerations', []):
        elements.append(Paragraph(f"• {m}", body_style))
        
    # FOOTER
    if 'rag_context' in patient_data:
        elements.append(Spacer(1, 8))
        elements.append(Paragraph(f"<i>Clinical context retrieved from nearest medical transcripts matching cluster via PubMedBERT.</i>", footer_style))
        
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#e2e8f0")))
    elements.append(Paragraph(
        f"AI-generated clinical aid v2.1. Final diagnosis and management remain the responsibility of the treating physician.<br/>{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        footer_style
    ))
    
    doc.build(elements)
    if not output_path:
        return buffer.getvalue()
    return None

if __name__ == "__main__":
    # Test Data 1: Chest pain context (PMH overlapping directly)
    test_data_relevant = {
        "name": "Jane Doe", "age": 68, "sex": "Female",
        "chief_complaint": "Acute central chest pain radiating to jaw", "duration": "Onset 1 hour ago while walking",
        "pmh": ["Type II Diabetes Mellitus", "Hypertension", "Osteoarthritis"],
        "allergies": ["Penicillin", "Aspirin"],
        "medications": ["Metformin", "Lisinopril"],
        "vitals": {"BP": "165/95", "HR": 105, "RR": 22, "SpO2": 96, "Temp": 37.1, "BMI": 28.5},
        "ai_assessment": "High suspicion for Acute Coronary Syndrome given age, risk factors, and classic radiation.",
        "red_flags": {"Hemodynamic instability": False, "Diaphoresis": True},
        "priority": "EMERGENT",
        "differentials": [{"condition": "Acute Myocardial Infarction", "rationale": "Classic presentation + risks", "urgency": "RULE OUT NOW"},
                          {"condition": "Aortic Dissection", "rationale": "Radiating pain, hypertension", "urgency": "CONSIDER"}],
        "workup": [{"test": "ECG", "rationale": "Immediate ischemia check", "priority": "STAT"}, {"test": "High-sensitivity Troponin", "rationale": "Rule out NSTEMI", "priority": "STAT"}],
        "management_considerations": ["Immediate cardiology consult", "Administer loading dose of Clopidogrel (Aspirin Allergy Warning)"]
    }
    
    # Test Data 2: Ankle sprain (PMH NOT overlapping, section should be hidden)
    test_data_irrelevant = {
        "name": "Jane Doe", "age": 68, "sex": "Female",
        "chief_complaint": "Twisted right ankle", "duration": "2 hours",
        "pmh": ["Type II Diabetes Mellitus", "Hypertension", "Osteoarthritis"],
        "allergies": [], "medications": ["Metformin", "Lisinopril"],
        "vitals": {"BP": "130/80", "HR": 80, "RR": 16, "SpO2": 99, "Temp": 36.8, "BMI": 28.5},
        "ai_assessment": "Likely simple inversion injury or lateral ligament sprain.",
        "red_flags": {"Inability to bear weight": False, "Bone tenderness": False},
        "priority": "ROUTINE",
        "differentials": [{"condition": "Ankle Sprain (Grade I/II)", "rationale": "Swelling + mechanism", "urgency": "CONSIDER"},
                          {"condition": "Ankle Fracture", "rationale": "Always consider if Ottawa rules positive", "urgency": "UNLIKELY BUT MONITOR"}],
        "workup": [{"test": "X-ray Ankle", "rationale": "If bony tenderness presents later", "priority": "ROUTINE"}],
        "management_considerations": ["RICE (Rest, Ice, Compression, Elevation)", "Acetaminophen for pain"]
    }
    
    # Generate test cases to demonstrate PMH dynamic filtering code path
    try:
        build_pdf_document(test_data_relevant, "e:/ieee_internal_hack/medical_system/sample_relevant_pmh.pdf")
        build_pdf_document(test_data_irrelevant, "e:/ieee_internal_hack/medical_system/sample_irrelevant_pmh.pdf")
        print("Generated Test PDFs successfully.")
    except Exception as e:
        print(f"Error generating PDF: {e}")
