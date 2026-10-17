from apps.production.models import FilmProject, Scene
from apps.ml_engine.llm.gemini_client import generate_json


def _scene_row(s):
    return {
        "scene_id": str(s.pk),
        "scene_no": getattr(s, "scene_number", getattr(s, "scene_no", None)),
        "location": getattr(s, "location", None),
        "time_of_day": getattr(s, "time_of_day", None),
        "duration": str(getattr(s, "duration_minutes", "") or ""),
    }


def optimize_schedule(project_id) -> dict:
    try:
        project = FilmProject.objects.get(pk=project_id)
    except FilmProject.DoesNotExist:
        return {"error": f"FilmProject {project_id} not found"}

    scenes = [_scene_row(s) for s in Scene.objects.filter(project=project)[:300]]

    if not scenes:
        return {"error": "No scenes found for this project",
                "project": str(project)}

    prompt = (
        f"Film: {project}\n"
        f"Scenes: {scenes}\n\n"
        "Propose a shooting order that minimizes location changes and "
        "keeps night scenes together.\n"
        'Return JSON: {"order": [{"scene_id": str, "day": int, '
        '"reason": str}]}'
    )
    return generate_json(prompt)