"""Document intelligence features — contract analysis, legal Q&A."""
from apps.ml_engine.llm.client import generate_json, generate
from apps.ml_engine.rag.retriever import answer as rag_answer


def contract_risk(contract_text: str) -> dict:
    """Analyze contract risks."""
    if contract_text is None:
        contract_text = ""
    if not isinstance(contract_text, str):
        contract_text = str(contract_text)
    prompt = f"""Analyze this contract for risks.
Return JSON: {{"missing_clauses": [str], "payment_risks": [str],
"unusual_conditions": [str], "risk_score": int, "recommendations": [str]}}

Contract:
{contract_text[:12000]}"""
    return generate_json(prompt, system="You are a legal analyst. Return only JSON.")


def legal_qa(question: str) -> dict:
    """Answer legal questions from ingested contracts using RAG."""
    if question is None:
        question = ""
    if not isinstance(question, str):
        question = str(question)
    question = question.strip()
    if not question:
        return {"answer": "No question provided.", "sources": []}
    return rag_answer(question)


def meeting_minutes(transcript: str) -> dict:
    """Convert meeting transcript to minutes."""
    if transcript is None:
        transcript = ""
    if not isinstance(transcript, str):
        transcript = str(transcript)
    prompt = f"""Generate meeting minutes.
Return JSON: {{"summary": str, "decisions": [str], "tasks": [{{"task": str,
"owner": str, "deadline": str}}]}}

Transcript:
{transcript[:12000]}"""
    return generate_json(prompt, system="You are a meeting secretary. Return only JSON.")