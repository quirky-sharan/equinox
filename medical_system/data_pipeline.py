# requirements.txt
# kaggle>=1.5.0
# pandas>=1.5.0

import os
import subprocess
import json
import sqlite3
import pandas as pd
from typing import Dict, Any, List

def download_data(temp_dir: str = "temp_data") -> str:
    """Download mtsamples from kaggle and unzip it."""
    os.makedirs(temp_dir, exist_ok=True)
    
    csv_path = os.path.join(temp_dir, "mtsamples.csv")
    if not os.path.exists(csv_path):
        print("Downloading Kaggle dataset: tboyle10/medicaltranscriptions...")
        subprocess.run(
            ["kaggle", "datasets", "download", "-d", "tboyle10/medicaltranscriptions", "-p", temp_dir, "--unzip"], 
            check=True
        )
        print("Download and unzip complete.")
    else:
        print("Kaggle Dataset already downloaded.")
        
    return csv_path

def extract_to_text(csv_path: str, output_dir: str = "output/transcripts") -> List[Dict[str, Any]]:
    """Parse CSV, clean text, and save individual TXT files."""
    os.makedirs(output_dir, exist_ok=True)
    df = pd.read_csv(csv_path)
    
    # Drop rows without meaningful transcription
    df = df.dropna(subset=['transcription'])
    
    records = []
    
    print(f"Extracting {len(df)} transcription records into structured format...")
    for idx, row in df.iterrows():
        # Parse fields securely against NaNs
        uid = int(row.get('Unnamed: 0', idx))
        specialty = str(row['medical_specialty']).strip()
        sample_name = str(row['sample_name']).strip()
        keywords = str(row['keywords']).strip()
        transcript = str(row['transcription']).strip()
        
        # Clean transcript structure
        transcript = " ".join(transcript.split())
        
        if not transcript or transcript == "nan":
            continue
            
        file_name = f"{specialty.replace(' ', '_').replace('/', '_')}_{uid}.txt"
        file_path = os.path.join(output_dir, file_name)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(transcript)
            
        records.append({
            "id": uid,
            "specialty": specialty,
            "sample_name": sample_name,
            "keywords": [k.strip() for k in keywords.split(',')] if keywords != "nan" and keywords else [],
            "text": transcript,
            "char_count": len(transcript),
            "word_count": len(transcript.split()),
            "source": "mtsamples_kaggle"
        })
        
    return records

def build_json(records: List[Dict[str, Any]], output_json: str = "output/medical_transcripts.json"):
    """Compile records into a single structured JSON block and display stats."""
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
        
    print("\n=== Transcript Pipeline Summary ===")
    print(f"Total Records Extracted & Written: {len(records)}")
    
    # Optional dependency: use Pandas to just aggregate and report stats quickly
    df = pd.DataFrame(records)
    print(f"Average Word Count: {df['word_count'].mean():.1f} words per transcript")
    print("\nTop 5 Domain Specialties Indexed:")
    print(df['specialty'].value_counts().head(5).to_string())
    print("===================================\n")

def load_to_database(records: List[Dict[str, Any]], db_path: str = "output/transcripts.db"):
    """Load extracted records into an optimized SQLite db to back the RAG embeddings later."""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS transcripts (
            id INTEGER PRIMARY KEY,
            specialty TEXT,
            sample_name TEXT,
            keywords TEXT,
            text TEXT,
            word_count INTEGER
        )
    ''')
    
    # Clear existing data for safety in repeated execution paths
    c.execute('DELETE FROM transcripts')
    
    insert_data = [
        (r['id'], r['specialty'], r['sample_name'], ", ".join(r['keywords']), r['text'], r['word_count'])
        for r in records
    ]
    
    c.executemany('''
        INSERT INTO transcripts (id, specialty, sample_name, keywords, text, word_count)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', insert_data)
    
    conn.commit()
    
    # DB State Validation Output
    c.execute('SELECT specialty, COUNT(*) FROM transcripts GROUP BY specialty ORDER BY COUNT(*) DESC LIMIT 5')
    print("--- Database Loaded Successfully ---")
    print("Verification Query (Highest representations in SQLite DB):")
    for row in c.fetchall():
        print(f" [{row[0]}]: {row[1]} indexed texts")
        
    conn.close()

def run_pipeline() -> str:
    """Orchestrator to run entire Extraction pipeline and return path to SQLite DB."""
    # Note: Requires OS environment variables KAGGLE_USERNAME and KAGGLE_KEY for raw headless downloads
    # if ~/.kaggle/kaggle.json is not configured locally.
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    csv_path = download_data()
    records = extract_to_text(csv_path)
    build_json(records)
    db_path = "output/transcripts.db"
    load_to_database(records, db_path)
    return db_path

if __name__ == "__main__":
    run_pipeline()
