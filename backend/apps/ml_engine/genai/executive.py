"""Executive dashboard features."""
from apps.ml_engine.llm.client import generate_json, generate
from apps.ml_engine.text2sql.agent import ask as sql_ask


def producer_copilot(question: str) -> dict:
    """Answer executive questions by querying DB."""
    # First get data via SQL
    sql_result = sql_ask(question)
    if "error" in sql_result:
        return sql_result

    # Then summarize
    prompt = f"""Given this database result, provide an executive summary.
Question: {question}
Data: {sql_result.get('rows', [])}
Write a concise answer."""
    return {"answer": generate(prompt, system="You are a producer's assistant."),
            "data": sql_result}


def nl_analytics(question: str) -> dict:
    """Natural language analytics with explanation."""
    sql_result = sql_ask(question)
    if "error" in sql_result:
        return sql_result
    prompt = f"""Explain these analytics results in business terms.
Question: {question}
Data: {sql_result.get('rows', [])}"""
    return {"explanation": generate(prompt, system="You are a data analyst."),
            "data": sql_result}