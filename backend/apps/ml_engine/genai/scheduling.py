"""Scheduling intelligence features."""
from datetime import date
from apps.ml_engine.llm.client import generate_json, generate
from apps.production.models import Scene, ShootDay, CastMember, FilmProject


def reschedule_suggestions(actor_id: int, unavailable_date: str) -> dict:
    """Suggest alternatives when actor unavailable."""
    actor = CastMember.objects.get(pk=actor_id)
    scenes = list(Scene.objects.filter(scene_actors__cast_id=actor_id).values(
        "scene_number", "location", "time_of_day"
    )[:20])
    prompt = f"""Actor {actor.full_name} is unavailable on {unavailable_date}.
Scenes they are in: {scenes}
Suggest alternative scheduling options.
Return JSON: {{"options": [{{"type": "date_shift|crew_replacement|location_change",
"description": str, "impact": str}}]}}"""
    return generate_json(prompt, system="You are a scheduling coordinator. Return only JSON.")


def delay_predictor(project_id: int) -> dict:
    """Predict shooting delays."""
    scenes = Scene.objects.filter(project_id=project_id, status="Pending").count()
    shoot_days = ShootDay.objects.filter(project_id=project_id).count()
    prompt = f"""Predict delay risk.
Pending scenes: {scenes}, scheduled shoot days: {shoot_days}, today: {date.today()}
Return JSON: {{"risk_level": "low|medium|high", "predicted_delay_days": int,
"factors": [str], "mitigation": [str]}}"""
    return generate_json(prompt, system="You are a production risk analyst. Return only JSON.")


def daily_report(project_id: int) -> dict:
    """Generate daily production report."""
    project = FilmProject.objects.get(pk=project_id)
    completed = Scene.objects.filter(project=project, status="Completed").count()
    pending = Scene.objects.filter(project=project, status="Pending").count()
    prompt = f"""Generate a daily production report.
Project: {project.title}
Completed scenes: {completed}, Pending: {pending}
Write a brief executive summary."""
    return {"report": generate(prompt, system="You are a production manager.")}