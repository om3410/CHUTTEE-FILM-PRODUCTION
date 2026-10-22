"""Multi-agent production system."""
from apps.ml_engine.llm.client import generate, generate_json


class Agent:
    def run(self, ctx: dict) -> dict:
        raise NotImplementedError


class ProducerAgent(Agent):
    def run(self, ctx):
        return {"plan": generate(f"Create a production plan for: {ctx['brief']}")}


class BudgetAgent(Agent):
    def run(self, ctx):
        return generate_json(f"""Estimate budget for: {ctx['brief']}
Return JSON: {{"line_items": [{{"category": str, "amount": int}}], "total": int}}""")


class CastingAgent(Agent):
    def run(self, ctx):
        return generate_json(f"""Suggest 3 cast members for: {ctx['brief']}
Return JSON: {{"cast": [{{"name": str, "role": str, "why": str}}]}}""")


class LegalAgent(Agent):
    def run(self, ctx):
        return {"contract_notes": generate(f"List key contract clauses for: {ctx['brief']}")}


class SchedulingAgent(Agent):
    def run(self, ctx):
        return generate_json(f"""Create a 20-day schedule for: {ctx['brief']}
Return JSON: {{"days": [{{"day": int, "scenes": [str]}}]}}""")


class MarketingAgent(Agent):
    def run(self, ctx):
        return {"marketing_plan": generate(f"Create a marketing plan for: {ctx['brief']}")}


AGENTS = [ProducerAgent(), BudgetAgent(), CastingAgent(), LegalAgent(),
          SchedulingAgent(), MarketingAgent()]


def produce(brief: str) -> dict:
    ctx = {"brief": brief, "facts": {}}
    trace = []
    for agent in AGENTS:
        try:
            out = agent.run(ctx)
            ctx["facts"].update(out)
            trace.append({"agent": agent.__class__.__name__, "status": "ok"})
        except Exception as e:
            trace.append({"agent": agent.__class__.__name__, "status": "error", "error": str(e)})
    return {"brief": brief, "result": ctx["facts"], "trace": trace}