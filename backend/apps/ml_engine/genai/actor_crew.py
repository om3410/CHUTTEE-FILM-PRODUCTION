"""Actor & crew intelligence features."""
from apps.ml_engine.llm.client import generate_json, generate
from apps.production.models import CastMember, CrewMember  # adjust import if needed


def talent_score(actor_id: int) -> dict:
    actor = CastMember.objects.get(pk=actor_id)
    prompt = f"""Score this actor on a 0-100 scale based on:
- experience_years: {actor.experience_years}
- role_type: {actor.role_type}
- skills: {actor.special_skills}
- availability: {actor.is_available}
Return JSON: {{"score": int, "strengths": [str], "weaknesses": [str], "recommendation": str}}"""
    return generate_json(prompt, system="You are a casting director. Return only JSON.")


def recommend_crew(project_description: str) -> dict:
    """Recommend crew based on project needs."""
    crew = list(CrewMember.objects.values(
        "id", "full_name", "role", "department", "experience_years", "skills"
    )[:50])
    prompt = f"""Match crew members to this project.
Project: {project_description}
Available crew: {crew}
Return JSON: {{"recommendations": [{{"crew_id": int, "name": str,
"role": str, "match_score": int, "reason": str}}]}}"""
    return generate_json(prompt, system="You are a line producer. Return only JSON.")


def interview_questions(role: str, count: int = 8) -> dict:
    """Generate interview questions for a role."""
    prompt = f"""Generate {count} interview questions for a {role} position in film production.
Return JSON: {{"questions": [{{"question": str, "what_to_look_for": str}}]}}"""
    return generate_json(prompt, system="You are an HR specialist. Return only JSON.")


def evaluate_interview(role: str, answers: dict) -> dict:
    """Evaluate candidate answers."""
    prompt = f"""Evaluate this candidate for a {role} role.
Answers: {answers}
Return JSON: {{"overall_score": int, "strengths": [str], "concerns": [str], "recommendation": str}}"""
    return generate_json(prompt, system="You are an HR evaluator. Return only JSON.")