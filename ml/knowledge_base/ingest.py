"""
Knowledge Base Ingestion — Loads structured medical JSON data into ChromaDB.
Uses sentence-transformers/all-MiniLM-L6-v2 for embedding.
Run this ONCE before starting the ML service.
"""
import os
import json
import glob
import pandas as pd
import hdbscan
import chromadb
from sentence_transformers import SentenceTransformer
from chromadb.utils import embedding_functions

KB_DIR = os.path.dirname(__file__)
CHROMA_DIR = os.path.join(os.path.dirname(KB_DIR), "chroma_db")
COLLECTION_NAME = "medical_guidelines"


def load_all_conditions() -> list[dict]:
    """Load and merge all medical_knowledge*.json files."""
    conditions = []
    pattern = os.path.join(KB_DIR, "medical_knowledge*.json")
    for filepath in sorted(glob.glob(pattern)):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            conditions.extend(data)
        print(f"   Loaded {os.path.basename(filepath)}: {len(data)} conditions")
    return conditions


def build_chunks(condition: dict) -> list[tuple[str, dict]]:
    """
    Build rich, searchable text chunks from a structured condition entry.
    Each chunk is a (text, metadata) tuple.
    Returns multiple chunks per condition for better retrieval.
    """
    cid = condition["id"]
    name = condition["condition"]
    base_meta = {"condition_id": cid, "condition_name": name, "icd10": condition.get("icd10", "")}
    chunks = []

    # Chunk 1: Overview + Symptoms + Causes
    overview = (
        f"CONDITION: {name}\n"
        f"ICD-10: {condition.get('icd10', 'N/A')}\n"
        f"Category: {condition.get('category', 'general')}\n\n"
        f"DESCRIPTION: {condition.get('description', '')}\n\n"
        f"SYMPTOMS: {', '.join(condition.get('symptoms', []))}\n\n"
        f"COMMON CAUSES: {'; '.join(condition.get('common_causes', []))}\n\n"
        f"RISK FACTORS: {'; '.join(condition.get('risk_factors', []))}\n\n"
        f"DIFFERENTIAL DIAGNOSIS: {', '.join(condition.get('differential_diagnosis', []))}"
    )
    chunks.append((overview, {**base_meta, "chunk_type": "overview"}))

    # Chunk 2: Clinical Interview Questions + Lifestyle Factors
    questions = condition.get("key_questions", [])
    lifestyle = condition.get("lifestyle_factors", [])
    questions_text = (
        f"CLINICAL INTERVIEW QUESTIONS FOR {name}:\n"
        + "\n".join(f"- {q}" for q in questions)
        + f"\n\nKEY LIFESTYLE FACTORS TO ASSESS: {', '.join(lifestyle)}"
    )
    chunks.append((questions_text, {**base_meta, "chunk_type": "questions"}))

    # Chunk 3: Do's (Recommended Actions)
    dos = condition.get("dos", [])
    dos_text = (
        f"RECOMMENDED ACTIONS (DO'S) FOR {name}:\n"
        + "\n".join(f"- {d}" for d in dos)
    )
    chunks.append((dos_text, {**base_meta, "chunk_type": "dos"}))

    # Chunk 4: Don'ts (Things to Avoid)
    donts = condition.get("donts", [])
    donts_text = (
        f"THINGS TO AVOID (DON'TS) FOR {name}:\n"
        + "\n".join(f"- {d}" for d in donts)
    )
    chunks.append((donts_text, {**base_meta, "chunk_type": "donts"}))

    # Chunk 5: Home Remedies + Dietary Guidelines
    remedies = condition.get("home_remedies", [])
    dietary = condition.get("dietary_guidelines", [])
    remedies_text = (
        f"HOME REMEDIES FOR {name}:\n"
        + "\n".join(f"- {r}" for r in remedies)
        + f"\n\nDIETARY GUIDELINES FOR {name}:\n"
        + "\n".join(f"- {d}" for d in dietary)
    )
    chunks.append((remedies_text, {**base_meta, "chunk_type": "remedies"}))

    # Chunk 6: Warning Signs (When to See a Doctor)
    warnings = condition.get("warning_signs", [])
    warnings_text = (
        f"WARNING SIGNS - WHEN TO SEE A DOCTOR FOR {name}:\n"
        + "\n".join(f"- {w}" for w in warnings)
    )
    chunks.append((warnings_text, {**base_meta, "chunk_type": "warnings"}))

    return chunks


def load_kaggle_transcripts() -> list[tuple[str, dict]]:
    """Load Kaggle medical transcriptions and build chunks."""
    filepath = os.path.join(KB_DIR, "mtsamples.csv")
    if not os.path.exists(filepath):
        print(f"[WARN] Kaggle transcripts not found at {filepath}")
        return []

    try:
        df = pd.read_csv(filepath)
        chunks = []
        for index, row in df.iterrows():
            if pd.isna(row.get('transcription')):
                continue

            specialty = str(row.get('medical_specialty', 'Unknown')).strip()
            sample_name = str(row.get('sample_name', 'Unknown')).strip()
            transcription = str(row['transcription'])

            text = f"CLINICAL TRANSCRIPT\nSPECIALTY: {specialty}\nSAMPLE: {sample_name}\n\nTRANSCRIPTION:\n{transcription}"
            meta = {
                "chunk_type": "kaggle_transcript",
                "specialty": specialty[:50],  # keep metadata short
            }
            chunks.append((text, meta))
        print(f"   Loaded {len(chunks)} Kaggle transcript chunks.")
        # Optional limit to keep ingestion time reasonable if the dataset is huge
        max_kaggle = 2000 
        if len(chunks) > max_kaggle:
            print(f"   [INFO] Truncating Kaggle transcripts to {max_kaggle} to save memory/time.")
            chunks = chunks[:max_kaggle]
        return chunks
    except Exception as e:
        print(f"[ERROR] Failed to load Kaggle transcripts: {e}")
        return []


def ingest():
    """Load all medical knowledge, build chunks, embed, and store in ChromaDB."""
    print("[*] Starting medical knowledge base ingestion...")

    # Load all conditions
    conditions = load_all_conditions()
    if not conditions:
        print("[ERROR] No medical knowledge files found!")
        return

    print(f"   Total conditions loaded: {len(conditions)}")

    # Initialize Model for Embedding & Clustering
    model_name = "NeuML/pubmedbert-base-embeddings"
    print(f"   Loading embedding model: {model_name} ...")
    model = SentenceTransformer(model_name)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=model_name
    )

    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # Clean rebuild
    try:
        client.delete_collection(COLLECTION_NAME)
        print("   Deleted existing collection.")
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )
    
    # Gather chunks
    all_chunks = []
    
    # Process JSON conditions
    for condition in conditions:
        chunks = build_chunks(condition)
        all_chunks.extend(chunks)
        
    all_chunks.extend(load_kaggle_transcripts())
    
    if not all_chunks:
        print("[ERROR] No chunks to ingest!")
        return

    texts = [text for text, meta in all_chunks]
    metadatas = [meta for text, meta in all_chunks]
    
    print(f"   Computing embeddings for {len(texts)} chunks...")
    embeddings_list = model.encode(texts, show_progress_bar=False).tolist()

    print("   Applying HDBSCAN clustering...")
    try:
        clusterer = hdbscan.HDBSCAN(min_cluster_size=3, min_samples=2)
        labels = clusterer.fit_predict(embeddings_list)
        for i, meta in enumerate(metadatas):
            meta["hdbscan_cluster"] = int(labels[i])
        print(f"   Successfully clustered into {len(set(labels)) - (1 if -1 in labels else 0)} unique clusters.")
    except Exception as e:
        print(f"   [WARN] HDBSCAN failed (maybe too few samples): {e}")

    # Insert in batches
    batch_size = 500
    total_chunks = len(texts)
    print(f"   Inserting {total_chunks} chunks into ChromaDB...")
    
    for i in range(0, total_chunks, batch_size):
        end = min(i + batch_size, total_chunks)
        batch_ids = [f"doc_{j}" for j in range(i, end)]
        collection.add(
            documents=texts[i:end],
            embeddings=embeddings_list[i:end],
            metadatas=metadatas[i:end],
            ids=batch_ids,
        )

    print(f"\n[DONE] Ingestion complete!")
    print(f"   Total chunks ingested: {total_chunks}")


if __name__ == "__main__":
    ingest()
