"""
PDF Report Generator — Creates a clinical summary PDF aimed at healthcare professionals using ReportLab Platypus.
"""
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def compute_risk_score(final_data: Dict[str, Any], patient_data: Dict[str, Any]) -> str:
    """
    Computes a programmatic risk score. Since symptoms vary, we will implement a basic 
    Red Flag / SIRS-like heuristic.
    """
    score = 0
    reasons = []
    
    red_flags = final_data.get("red_flags", {})
    if any(red_flags.values()):
        return "CRITICAL - High Risk Red Flags Present"
        
    age = patient_data.get("age")
    try:
        age_num = int(age) if age else 0
        if age_num > 65:
            score += 1
            reasons.append("Age > 65")
    except:
        pass
        
    vitals = final_data.get("vitals_estimated", "").lower()
    if "fever" in vitals or "temp" in vitals:
        score += 1
        reasons.append("Abnormal Vitals Reported")
        
    if final_data.get("risk_tier") in ["high", "critical"]:
        score += 2
        reasons.append("AI Risk Tier Elevated")
        
    s = "Low Probability"
    if score >= 3:
        s = "High Probability"
    elif score >= 1:
        s = "Moderate Probability"
        
    reason_str = ", ".join(reasons) if reasons else "No acute modifiers"
    return f"Severity Index: {score}/4 — {s} ({reason_str})"

def check_allergy_conflict(patient_data: Dict[str, Any], final_data: Dict[str, Any]) -> Optional[str]:
    """Flag if any suggested medication conflicts with known allergies."""
    allergies = patient_data.get("allergies", "")
    if not allergies:
        return None
        
    allergies_lower = allergies.lower()
    if allergies_lower == "none":
        return None
        
    # Basic keyword check
    meds_str = str(final_data.get("dos", [])) + str(final_data.get("home_remedies", []))
    meds_str = meds_str.lower()
    
    allergy_list = [a.strip() for a in allergies_lower.split(",")]
    conflicts = [a for a in allergy_list if a in meds_str and len(a) > 3]
    
    if conflicts:
        return f"CRITICAL: Suggested management may conflict with known allergy ({', '.join(conflicts).upper()})"
    return None

def generate_report(session_id: str, final_data: Dict[str, Any], patient_data: Dict[str, Any] = None) -> bytes:
    """
    Generate a single-page doctor-centric clinical handover PDF.
    """
    if patient_data is None:
        patient_data = {}
        
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=16, textColor=HexColor("#1e293b"), spaceAfter=4, fontName="Helvetica-Bold")
    
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=10,
        textColor=HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=4,
        fontName="Helvetica-Bold",
        borderPadding=(0, 0, 2, 0),
        borderColor=HexColor("#cbd5e1"),
        borderWidth=0.5,
    )
    
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9, leading=12, textColor=HexColor("#334155"))
    body_bold = ParagraphStyle("BodyBold", parent=body_style, fontName="Helvetica-Bold")
    
    alert_style = ParagraphStyle("AlertStyle", parent=body_style, textColor=HexColor("#b91c1c"), fontName="Helvetica-Bold")
    
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"], fontSize=7, textColor=HexColor("#94a3b8"), alignment=TA_CENTER, spaceBefore=10)

    elements = []

    # 1. HEADER BLOCK
    urgency = final_data.get("see_doctor_urgency", "routine").upper()
    urgency_color = "#10b981" # Green
    if urgency in ["EMERGENCY", "CRITICAL"]:
        urgency_color = "#ef4444"
    elif urgency in ["URGENT", "SOON"]:
        urgency_color = "#f59e0b"
        
    header_table = Table([
        [Paragraph(f"<b>Patient:</b> {patient_data.get('full_name', 'Unknown')}", body_style), 
         Paragraph(f"<b>Age/Sex:</b> {patient_data.get('age', 'N/A')} / {patient_data.get('sex', 'N/A')}", body_style),
         Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", body_style),
         Paragraph(f"<b>Report ID:</b> {session_id[:8]}", body_style)],
        [Paragraph(f"<b>Triage Priority:</b> <font color='{urgency_color}'>{urgency}</font>", body_bold), "", "", ""]
    ], colWidths=[4.5*cm, 4*cm, 4.5*cm, 4*cm])
    
    header_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 1), (-1, 1), 1, HexColor("#e2e8f0")),
        ('SPAN', (0, 1), (3, 1)),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    
    elements.append(Paragraph("CLINICAL HANDOVER SUMMARY", title_style))
    elements.append(header_table)
    elements.append(Spacer(1, 10))

    # 2. PATIENT SNAPSHOT
    elements.append(Paragraph("SECTION 1 — PATIENT SNAPSHOT", section_heading))
    allergies = patient_data.get('allergies', 'None recorded')
    alg_p = Paragraph(f"<b>Allergies:</b> <font color='red'>{allergies}</font>" if allergies and str(allergies).lower() != 'none' else f"<b>Allergies:</b> {allergies}", body_style)
    
    meds = patient_data.get('medical_conditions', 'None reported')
    
    snap_data = [
        [Paragraph(f"<b>Weight/Height:</b> {patient_data.get('weight', 'N/A')} / {patient_data.get('height', 'N/A')}", body_style), alg_p],
        [Paragraph(f"<b>PMHx:</b> {meds}", body_style), Paragraph(f"<b>Habits:</b> {patient_data.get('habits', 'N/A')}", body_style)]
    ]
    elements.append(Table(snap_data, colWidths=[8.5*cm, 8.5*cm], style=TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')])))

    # 3. PRESENTING COMPLAINT & VITALS
    elements.append(Paragraph("SECTION 2 — PRESENTING COMPLAINT & CLINICAL SUMMARY", section_heading))
    elements.append(Paragraph(f"<b>Chief Complaint:</b> {final_data.get('chief_complaint', final_data.get('condition', 'Undifferentiated'))}", body_style))
    elements.append(Paragraph(f"<b>Onset & Duration:</b> {final_data.get('symptom_duration', 'Not specified')}", body_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(final_data.get("explanation_doctor", "No summary generated."), body_style))
    elements.append(Spacer(1, 4))
    
    vitals = final_data.get("vitals_estimated", "None reported")
    vitals_table = Table([[Paragraph("<b>Vitals Reported by Patient:</b>", body_style), Paragraph(vitals, body_style)]], colWidths=[5*cm, 12*cm])
    vitals_table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), HexColor("#f8fafc")), ('BOX', (0,0), (-1,-1), 0.5, HexColor("#cbd5e1")), ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4)]))
    elements.append(vitals_table)

    # 4. RED FLAGS
    elements.append(Paragraph("SECTION 3 — RED FLAGS", section_heading))
    red_flags = final_data.get("red_flags", {})
    if red_flags:
        rf_data = []
        for flag, present in red_flags.items():
            status = "<font color='red'><b>YES</b></font>" if present else "NO"
            rf_data.append([Paragraph(flag, body_style), Paragraph(status, body_style)])
        elements.append(Table(rf_data, colWidths=[12*cm, 5*cm], style=TableStyle([('LINEBELOW', (0,0), (-1,-1), 0.25, HexColor("#f1f5f9"))])))
    else:
        elements.append(Paragraph("No explicit red flags noted.", body_style))

    # 5. RISK STRATIFICATION
    elements.append(Paragraph("SECTION 4 — RISK STRATIFICATION", section_heading))
    elements.append(Paragraph(compute_risk_score(final_data, patient_data), body_style))
    
    conflict = check_allergy_conflict(patient_data, final_data)
    if conflict:
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(conflict, alert_style))

    # 6. DIFFERENTIAL DIAGNOSIS
    elements.append(Paragraph("SECTION 5 — DIFFERENTIAL DIAGNOSIS", section_heading))
    differentials = final_data.get("differential_diagnosis", [])
    if differentials:
        diff_data = [[Paragraph("<b>Diagnosis</b>", body_style), Paragraph("<b>Clinical Rationale</b>", body_style), Paragraph("<b>Urgency</b>", body_style)]]
        for idx, d in enumerate(differentials, 1):
            diff_data.append([
                Paragraph(f"{idx}. {d.get('condition')}", body_style),
                Paragraph(d.get('rationale', ''), body_style),
                Paragraph(f"<b>[{d.get('urgency', 'CONSIDER')}]</b>", body_style)
            ])
        t = Table(diff_data, colWidths=[4*cm, 9*cm, 4*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), HexColor("#f1f5f9")),
            ('LINEBELOW', (0,0), (-1,0), 1, HexColor("#cbd5e1")),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4)
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph(f"Primary Hypothesis: {final_data.get('condition', 'Unknown')}", body_style))

    # 7. SUGGESTED WORKUP
    elements.append(Paragraph("SECTION 6 — SUGGESTED WORKUP", section_heading))
    investigations = final_data.get("suggested_investigations", [])
    if investigations:
        inv_data = [[Paragraph("<b>Test/Investigation</b>", body_style), Paragraph("<b>Rationale</b>", body_style), Paragraph("<b>Priority</b>", body_style)]]
        for inv in investigations:
            inv_data.append([
                Paragraph(inv.get('test', ''), body_style),
                Paragraph(inv.get('rationale', ''), body_style),
                Paragraph(inv.get('priority', ''), body_style)
            ])
        t2 = Table(inv_data, colWidths=[4*cm, 9*cm, 4*cm])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), HexColor("#f1f5f9")),
            ('LINEBELOW', (0,0), (-1,0), 1, HexColor("#cbd5e1")),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4)
        ]))
        elements.append(t2)
    else:
        elements.append(Paragraph("Clinical correlation required before investigations.", body_style))

    # 8. MANAGEMENT CONSIDERATIONS
    elements.append(Paragraph("SECTION 7 — MANAGEMENT CONSIDERATIONS", section_heading))
    dos = final_data.get("dos", [])
    if dos:
        for d in dos[:3]: # Cap at 3 for brevity
            elements.append(Paragraph(f"• {d}", body_style))
    elements.append(Paragraph(f"<b>Referral:</b> {final_data.get('see_doctor_reason', 'General assessment')}", body_style))

    # FOOTER
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#e2e8f0")))
    elements.append(Paragraph(
        "⚕️ This report contains preliminary AI-generated findings based on a patient interview. "
        "It is designed to aggregate clinical probabilities and assist decision-making but is NOT a substitute "
        "for professional medical judgment or direct evaluation.",
        footer_style,
    ))

    doc.build(elements)
    return buffer.getvalue()
