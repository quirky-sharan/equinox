"""
# README
# Medical Text HDBSCAN RAG Engine + Clinical PDF Generator
#
# ## Setup Kaggle API
# 1. Sign in to Kaggle and create an API token (Account -> Create New API Token).
# 2. Place `kaggle.json` in `~/.kaggle/kaggle.json` (Linux/Mac) or `C:\\Users\\<USER>\\.kaggle\\kaggle.json` (Windows).
# 3. Alternatively, export environment variables: KAGGLE_USERNAME and KAGGLE_KEY.
#
# ## Installation
# pip install kaggle pandas reportlab sentence-transformers hdbscan umap-learn numpy matplotlib scikit-learn
#
# ## Expected Outputs
# 1. output/transcripts/         -> Raw Kaggle texts structured locally.
# 2. output/transcripts.db       -> Fast retrieval metadata + numpy blob index.
# 3. output/cluster_map.png      -> 2D Topological UMAP plot of semantic medical data.
# 4. output/clinical_report.pdf  -> A highly structured, programmatic medical handover doc.
#
# ## Running
# Execute `python main.py`. 
# It will natively execute System 2 (Data Download & SQLite extraction) -> 
# System 3 (Embedding & Database clustering) -> 
# System 1 (Clinical PDF creation using RAG search).
"""

import os
from data_pipeline import run_pipeline as extract_data
from rag_engine import build_embeddings, perform_clustering, retrieve_context
from pdf_report_generator import build_pdf_document

def run_integrated_pipeline():
    # Enforce relative working paths
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs('output', exist_ok=True)
    
    # 1. Run Data Extractor (System 2)
    print("\n[PHASE 1] Initializing Structural Extractor (System 2)...")
    temp_db_path = extract_data()

    # 2. Semantic Analysis & HDBSCAN (System 3)
    print("\n[PHASE 2] Semantic Engine and Topological HDBSCAN Cluster Mapping (System 3)...")
    try:
        build_embeddings(temp_db_path)
        perform_clustering(temp_db_path)
    except ImportError as e:
        print(f"\n⚠️ LIBRARY MISSING: {e}")
        print("Execution will continue, but RAG context will be skipped due to missing ML libs.")
        temp_db_path = None # Nullify DB since vectors didn't build
        
    # 3. Query Clinical Data
    test_query = "Acute central chest pain radiating to jaw with diaphoresis"
    rag_context = {}
    
    if temp_db_path:
        print(f"\n[PHASE 3] Live Clinical RAG Engine Retrieval. Query: '{test_query}'...")
        rag_context = retrieve_context(query=test_query, db_path=temp_db_path, top_k=3)
        
        print("\nRAG Transcripts Discovered + Booted via Semantic HDBSCAN Profile:")
        if "results" in rag_context:
            for r in rag_context["results"]:
                print(f"  - Source: {r['specialty']} (Match: {r['similarity_score']} -> Cluster Profile: {rag_context.get('matched_cluster')})")

    # 4. Inject Into Medical Handover PDF (System 1)
    print("\n[PHASE 4] Building Final Handover PDF via Injecting RAG Context Arrays (System 1)...")
    
    test_data = {
        "name": "Jane Doe", "age": 68, "sex": "Female",
        "chief_complaint": test_query, "duration": "Onset 1 hour ago while walking",
        "pmh": ["Type II Diabetes Mellitus", "Hypertension", "Osteoarthritis"], # Hyper and T2D overlap chest pain algos natively
        "allergies": ["Penicillin", "Aspirin"],
        "medications": ["Metformin", "Lisinopril"],
        "vitals": {"BP": "165/95", "HR": 105, "RR": 22, "SpO2": 96, "Temp": 37.1, "BMI": 28.5},
        "ai_assessment": "High suspicion for Acute Coronary Syndrome given age, risk factors, and classic radiation. RAG corroborates standard ischemia protocols.",
        "red_flags": {"Hemodynamic instability": False, "Diaphoresis": True},
        "priority": "EMERGENT",
        "differentials": [{"condition": "Acute Myocardial Infarction", "rationale": "Classic presentation + risks", "urgency": "RULE OUT NOW"},
                          {"condition": "Aortic Dissection", "rationale": "Radiating pain, hypertension", "urgency": "CONSIDER"}],
        "workup": [{"test": "ECG", "rationale": "Immediate ischemia check", "priority": "STAT"}],
        "management_considerations": ["Immediate cardiology consult", "Administer loading dose of Clopidogrel (Aspirin Allergy Warning)"],
        "rag_context": rag_context # Added so the PDF System includes the footprint footnote acknowledging RAG retrieval execution
    }
    
    try:
        # Build logic runs allergy/pmh and algorithmic score validations, and saves a crisp file
        build_pdf_document(test_data, "output/clinical_report.pdf")
        print("\n=== COMPLETE INTEGRATION SUCCESS ===")
        print("Generated Medical Handover: output/clinical_report.pdf")
    except Exception as e:
        print("\nFailed deploying PDF:", e)

if __name__ == "__main__":
    run_integrated_pipeline()
