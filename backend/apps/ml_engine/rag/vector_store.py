"""ChromaDB + sentence-transformers for RAG."""
import os
from functools import lru_cache

from django.conf import settings

# Graceful fallback if heavy AI packages aren't installed (e.g., Render free tier)
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    HAS_RAG = True
except ImportError:
    HAS_RAG = False
    chromadb = None
    SentenceTransformer = None


def _require_rag():
    if not HAS_RAG:
        raise RuntimeError(
            "RAG is unavailable: chromadb / sentence-transformers not installed "
            "on this server. All other AI features work normally."
        )


@lru_cache(maxsize=1)
def _client():
    _require_rag()
    path = getattr(settings, "CHROMA_PATH", str(settings.BASE_DIR / "chroma_db"))
    os.makedirs(path, exist_ok=True)
    return chromadb.PersistentClient(path=path)


@lru_cache(maxsize=1)
def _embedder():
    _require_rag()
    return SentenceTransformer("all-MiniLM-L6-v2")


def _collection(name="film_knowledge"):
    return _client().get_or_create_collection(name)


def embed(texts):
    return _embedder().encode(texts, normalize_embeddings=True).tolist()


def add(docs, metadatas=None, ids=None, collection="film_knowledge"):
    coll = _collection(collection)
    ids = ids or [f"doc_{i}" for i in range(len(docs))]
    metadatas = metadatas or [{}] * len(docs)
    coll.add(documents=docs, embeddings=embed(docs), metadatas=metadatas, ids=ids)
    return ids


def query(q, n=5, collection="film_knowledge"):
    coll = _collection(collection)
    res = coll.query(query_embeddings=embed([q]), n_results=n)
    out = []
    for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
        out.append({"text": doc, "metadata": meta, "distance": dist})
    return out


def delete(ids, collection="film_knowledge"):
    _collection(collection).delete(ids=ids)