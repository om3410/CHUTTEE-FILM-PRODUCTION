"""Memory-based assistant using Chroma if available."""
from apps.ml_engine.rag.vector_store import add, query
from apps.ml_engine.llm.client import generate


def remember(text: str, metadata: dict = None):
    """Store a memory."""
    add([text], [metadata or {}])


def recall(question: str, k: int = 5) -> dict:
    """Retrieve memories and answer."""
    hits = query(question, n=k)
    if not hits:
        return {"answer": "No memories yet.", "sources": []}
    context = "\n".join(h["text"] for h in hits)
    answer = generate(f"Context:\n{context}\n\nQuestion: {question}",system="Answer from context only.")
    return {"answer": answer, "sources": [h["metadata"] for h in hits]}