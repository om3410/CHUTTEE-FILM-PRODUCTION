"""Finance intelligence features."""
from apps.ml_engine.llm.client import generate_json, generate
from apps.production.models import BudgetTransaction, FilmProject


def cost_reduction_advisor(project_id: int) -> dict:
    """Suggest cost reductions."""
    project = FilmProject.objects.get(pk=project_id)
    txns = list(BudgetTransaction.objects.filter(project=project).values(
        "category", "amount", "transaction_date"
    )[:100])
    prompt = f"""Suggest cost reductions for this film project.
Project: {project.title}, budget: {project.total_budget}
Transactions: {txns}
Return JSON: {{"suggestions": [{{"area": str, "potential_saving": str, "action": str}}],
"estimated_total_saving": str}}"""
    return generate_json(prompt, system="You are a film finance advisor. Return only JSON.")


def budget_overrun_analysis(project_id: int) -> dict:
    """Analyze overrun risk."""
    project = FilmProject.objects.get(pk=project_id)
    txns = list(BudgetTransaction.objects.filter(project=project).values(
        "amount", "transaction_date"
    )[:200])
    prompt = f"""Analyze budget overrun risk.
Project budget: {project.total_budget}
Transactions: {txns}
Return JSON: {{"current_spend": float, "projected_overrun_percent": float,
"warning": str, "recommendations": [str]}}"""
    return generate_json(prompt, system="You are a financial analyst. Return only JSON.")


def parse_invoice(text: str) -> dict:
    """Extract structured data from invoice text."""
    prompt = f"""Extract invoice data.
Return JSON: {{"vendor": str, "invoice_number": str, "amount": float,
"date": str, "line_items": [{{"description": str, "amount": float}}]}}

Invoice text:
{text[:8000]}"""
    return generate_json(prompt, system="You are an accounting assistant. Return only JSON.")