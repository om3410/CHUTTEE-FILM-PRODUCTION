"""RAG retriever â€” retrieve + answer."""
from .vector_store import query
from apps.ml_engine.llm.client import generate

SYSTEM = (
    "You are a film production assistant. Answer using ONLY the "
    "provided context. If the answer isn't in the context, say you "
    "don't know. Cite source numbers like [1], [2]."
)


def answer(question, k=5):
    if question is None:
        question = ""
    if not isinstance(question, str):
        question = str(question)
    question = question.strip()
    if not question:
        return {"answer": "No question provided.", "sources": []}
    hits = query(question, n=k)
    if not hits:
        return {"answer": "No knowledge documents have been ingested yet.", "sources": []}
    context = "\n\n".join(
        f"[{i+1}] ({h['metadata'].get('kind', 'doc')}: "
        f"{h['metadata'].get('source') or h['metadata'].get('title', '')})\n{h['text']}"
        for i, h in enumerate(hits)
    )
    text = generate(f"Context:\n{context}\n\nQuestion: {question}", system=SYSTEM)
    return {"answer": text, "sources": [h["metadata"] for h in hits]}