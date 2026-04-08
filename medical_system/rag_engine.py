# requirements.txt
# sentence-transformers>=3.0.0
# hdbscan>=0.8.0
# umap-learn>=0.5.0
# numpy>=1.21.0
# matplotlib>=3.5.0
# scikit-learn>=1.0.2

import os
import sqlite3
import numpy as np
from typing import Dict, Any, List
import matplotlib.pyplot as plt

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

try:
    import hdbscan
    import umap
except ImportError:
    hdbscan = None
    umap = None
    
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter

# Global Model Cache
_embedder = None
MODEL_NAME = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"

def _get_embedder():
    global _embedder
    if _embedder is None:
        if SentenceTransformer is None:
            raise ImportError("Please install sentence-transformers to use PubMedBERT embedding functions.")
        print(f"Loading Semantic Embedder: {MODEL_NAME} ...")
        _embedder = SentenceTransformer(MODEL_NAME)
    return _embedder

def build_embeddings(db_path: str = "output/transcripts.db", batch_size: int = 32):
    """
    Extracts text from DB, batches through PubMedBERT, and binds embedding vectors 
    securely alongside transcripts inside SQLite using blob arrays.
    """
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Enable adding BLOB column for binary numpy vector storage
    try:
        c.execute('ALTER TABLE transcripts ADD COLUMN embedding BLOB')
    except sqlite3.OperationalError:
        pass # Column already exists
        
    c.execute('SELECT id, text FROM transcripts WHERE embedding IS NULL')
    records = c.fetchall()
    
    if not records:
        print("All transcripts are already embedded.")
        conn.close()
        return

    print(f"Generating vectors for {len(records)} clinical documents (Batch size: {batch_size})...")
    
    embedder = _get_embedder()
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        ids = [row[0] for row in batch]
        texts = [row[1] for row in batch]
        
        # PubMedBERT limits to 512 tokens. Automatically handled by SentenceTransformers truncation.
        embeddings = embedder.encode(texts, batch_size=batch_size, show_progress_bar=False)
        
        update_data = []
        for doc_id, emb in zip(ids, embeddings):
            # Store dense floats as byte blobs to keep SQLite dependency purely standard
            update_data.append((emb.astype(np.float32).tobytes(), doc_id))
            
        c.executemany('UPDATE transcripts SET embedding = ? WHERE id = ?', update_data)
        conn.commit()
        
        if i % (batch_size * 5) == 0 and i > 0:
            print(f" ... embedded {i}/{len(records)} documents")
            
    conn.close()
    print("Embedding generation pipeline complete.")

def perform_clustering(db_path: str = "output/transcripts.db"):
    """
    Cluster embeddings using HDBSCAN and project onto 2D UMAP for visualization.
    Generates and maps cluster semantic profiles natively.
    """
    if hdbscan is None or umap is None:
        raise ImportError("Please install hdbscan and umap-learn for clustering visualization logic.")
        
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # 1. Fetch Matrix
    c.execute("SELECT id, specialty, keywords, embedding FROM transcripts WHERE embedding IS NOT NULL")
    data = c.fetchall()
    
    if not data:
        print("No embeddings found to cluster. Run build_embeddings() first.")
        return
        
    ids = [d[0] for d in data]
    specialties = [d[1] for d in data]
    keywords_list = [d[2] for d in data]
    
    matrix = np.array([np.frombuffer(d[3], dtype=np.float32) for d in data])
    
    print(f"Executing UMAP reduction on matrix structurally scaled at {matrix.shape}...")
    reducer = umap.UMAP(n_neighbors=15, n_components=2, metric='cosine', random_state=42)
    umap_2d = reducer.fit_transform(matrix)
    
    print("Applying HDBSCAN topological clustering...")
    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=10,
        min_samples=5,
        metric='euclidean',
        cluster_selection_method='eom'
    )
    cluster_labels = clusterer.fit_predict(umap_2d)
    
    # 2. Map and store topologies back to DB
    try:
        c.execute('ALTER TABLE transcripts ADD COLUMN cluster_id INTEGER')
    except sqlite3.OperationalError:
        pass
        
    update_d = []
    cluster_texts = {}
    
    for uid, lbl, spec, kw in zip(ids, cluster_labels, specialties, keywords_list):
        update_d.append((int(lbl), uid))
        if lbl not in cluster_texts:
            cluster_texts[lbl] = {'specs': [], 'words': []}
        cluster_texts[lbl]['specs'].append(spec)
        cluster_texts[lbl]['words'].extend([k.strip() for k in kw.split(',') if k.strip()])
        
    c.executemany('UPDATE transcripts SET cluster_id = ? WHERE id = ?', update_d)
    
    # 3. Create cluster profile topology store
    c.execute('DROP TABLE IF EXISTS cluster_profiles')
    c.execute('''CREATE TABLE cluster_profiles (
                    cluster_id INTEGER PRIMARY KEY,
                    size INTEGER,
                    top_specialties TEXT,
                    top_keywords TEXT,
                    centroid BLOB
                 )''')
                 
    profile_data = []
    print("\n--- Identified Clinical Subsets ---")
    for lbl in np.unique(cluster_labels):
        if lbl == -1: 
            continue # Noise is unclustered
            
        cls_idx = np.where(cluster_labels == lbl)[0]
        centroid = np.mean(matrix[cls_idx], axis=0)
        size = len(cls_idx)
        
        # Most common
        top_specs = [s for s, c in Counter(cluster_texts[lbl]['specs']).most_common(3)]
        top_words = [w for w, c in Counter(cluster_texts[lbl]['words']).most_common(10)]
        
        print(f"Cluster {lbl} (n={size}) -> Focus: {', '.join(top_specs)}")
        
        profile_data.append((
            int(lbl), size, ", ".join(top_specs), ", ".join(top_words), 
            centroid.astype(np.float32).tobytes()
        ))
        
    c.executemany('''
        INSERT INTO cluster_profiles (cluster_id, size, top_specialties, top_keywords, centroid)
        VALUES (?, ?, ?, ?, ?)
    ''', profile_data)
    
    conn.commit()
    conn.close()
    
    # 4. Save visualization artifact
    plt.figure(figsize=(10, 8))
    scatter = plt.scatter(umap_2d[:, 0], umap_2d[:, 1], c=cluster_labels, cmap='Spectral', s=10, alpha=0.7)
    plt.colorbar(scatter, label='HDBSCAN Semantic Cluster ID (-1 denotes noise)')
    plt.title('Medical Transcriptions Semantic Map (PubMedBERT + UMAP)')
    
    os.makedirs('output', exist_ok=True)
    plt.savefig('output/cluster_map.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Saved matrix visualization map to: output/cluster_map.png")


def retrieve_context(query: str, db_path: str = "output/transcripts.db", top_k: int = 5) -> dict:
    """
    RAG Execution function.
    Finds nearest clinical transcripts and contextualizes findings structurally via matched HDBSCAN profiles.
    """
    embedder = _get_embedder()
    q_emb = embedder.encode([query])[0]
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Scan raw texts
    c.execute("SELECT id, specialty, sample_name, cluster_id, text, embedding FROM transcripts WHERE embedding IS NOT NULL")
    docs = c.fetchall()
    
    if not docs:
        conn.close()
        return {"query": query, "error": "Database unstructured or empty."}
        
    doc_embs = np.array([np.frombuffer(d[5], dtype=np.float32) for d in docs])
    sims = cosine_similarity([q_emb], doc_embs)[0]
    
    # Top K
    top_indices = np.argsort(sims)[::-1][:top_k * 2] # Grab double to re-rank later
    
    # Identify which cluster the query overall leans toward nearest
    c.execute("SELECT cluster_id, top_specialties, top_keywords, centroid FROM cluster_profiles")
    profiles = c.fetchall()
    
    matched_cluster = -1
    matched_profile = {"specialties": [], "keywords": []}
    
    if profiles:
        prof_ids = [p[0] for p in profiles]
        prof_specs = [p[1].split(", ") for p in profiles]
        prof_words = [p[2].split(", ") for p in profiles]
        prof_embs = np.array([np.frombuffer(p[3], dtype=np.float32) for p in profiles])
        
        prof_sims = cosine_similarity([q_emb], prof_embs)[0]
        best_prof_idx = np.argmax(prof_sims)
        
        matched_cluster = prof_ids[best_prof_idx]
        matched_profile = {"specialties": prof_specs[best_prof_idx], "keywords": prof_words[best_prof_idx]}
        
    # Re-rank based on cluster alignment boost
    results = []
    for rank, idx in enumerate(top_indices):
        doc_id = docs[idx][0]
        spec = docs[idx][1]
        name = docs[idx][2]
        c_id = docs[idx][3]
        text = docs[idx][4]
        sim = sims[idx]
        
        # Semantic boost mechanism if it perfectly aligns with identified overarching cluster pathology
        final_sim = sim + (0.15 if c_id == matched_cluster else 0)
        
        results.append({
            "id": doc_id,
            "specialty": spec,
            "sample_name": name,
            "similarity_score": round(float(final_sim), 4),
            "cluster_id": c_id,
            "excerpt": text[:300] + "..."
        })
        
    results = sorted(results, key=lambda x: x["similarity_score"], reverse=True)[:top_k]
    for n, r in enumerate(results, 1):
        r["rank"] = n
        
    conn.close()
    
    return {
        "query": query,
        "matched_cluster": matched_cluster,
        "cluster_profile": matched_profile,
        "results": results
    }

if __name__ == "__main__":
    # Test script hooks locally
    pass
