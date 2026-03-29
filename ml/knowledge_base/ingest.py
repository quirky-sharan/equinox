"""
Knowledge Base Ingestion — Loads structured medical JSON data into ChromaDB.
Uses sentence-transformers/all-MiniLM-L6-v2 for embedding.
Run this ONCE before starting the ML service.
"""
import os
import json
import glob
import chromadb
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


def ingest():
    """Load all medical knowledge, build chunks, embed, and store in ChromaDB."""
    print("[*] Starting medical knowledge base ingestion...")

    # Load all conditions
    conditions = load_all_conditions()
    if not conditions:
        print("[ERROR] No medical knowledge files found!")
        return

    print(f"   Total conditions loaded: {len(conditions)}")

    # Initialize ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

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

    # Process all conditions
    total_chunks = 0
    for condition in conditions:
        chunks = build_chunks(condition)
        for i, (text, meta) in enumerate(chunks):
            chunk_id = f"{condition['id']}_{meta['chunk_type']}_{i}"
            collection.add(
                documents=[text],
                ids=[chunk_id],
                metadatas=[meta],
            )
        total_chunks += len(chunks)
        print(f"   [OK] {condition['condition']}: {len(chunks)} chunks")

    print(f"\n[DONE] Ingestion complete!")
    print(f"   {len(conditions)} conditions -> {total_chunks} searchable chunks")
    print(f"   Database: {CHROMA_DIR}")


if __name__ == "__main__":
    ingest()
