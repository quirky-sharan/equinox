"""
Knowledge Base Retriever — Searches ChromaDB for semantically similar guideline chunks.
"""
import os
import chromadb
from chromadb.utils import embedding_functions

CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
COLLECTION_NAME = "medical_guidelines"

# Lazy-loaded globals
_client = None
_collection = None


def _get_collection():
    """Lazy-load the ChromaDB collection."""
    global _client, _collection
    if _collection is None:
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="NeuML/pubmedbert-base-embeddings"
        )
        _client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = _client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=ef,
        )
    return _collection


def retrieve(query: str, n_results: int = 5) -> list[str]:
    """
    Search the medical knowledge base for the most relevant guideline chunks.

    Args:
        query: The user's symptom description or question.
        n_results: Number of top matching chunks to return.

    Returns:
        List of guideline text chunks, ranked by semantic similarity.
    """
    try:
        collection = _get_collection()
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
        )
        if results and results["documents"]:
            return results["documents"][0]  # First query's results
        return []
    except Exception as e:
        print(f"[Retriever Error] {e}")
        return []
