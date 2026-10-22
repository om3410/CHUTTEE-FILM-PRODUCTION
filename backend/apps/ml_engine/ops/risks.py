from datetime import date
from django.apps import apps as django_apps
from apps.production.models import FilmProject, Scene
from apps.ml_engine.models import AIRiskForecast, AIBudgetAnomaly
from apps.ml_engine.llm.gemini_client import generate


def scan_risks(project_id) -> dict:
    try:
        project = FilmProject.objects.get(pk=project_id)
    except FilmProject.DoesNotExist:
        return {"error": f"FilmProject {project_id} not found"}

    flags: list[str] = []

    # --- 1. Existing AI risk forecasts
    forecasts = AIRiskForecast.objects.filter(project=project).order_by(
        "-forecast_date"
    )[:20]
    for f in forecasts:
        prob = float(f.predicted_probability or 0)
        if prob >= 0.5:
            flags.append(
                f"[ML] {f.risk_type}: probability {prob:.2f}, "
                f"impact {f.predicted_impact} — {f.rationale or ''}"
            )

    # --- 2. Existing budget anomalies
    anomalies = AIBudgetAnomaly.objects.filter(project=project).order_by(
        "-detected_at"
    )[:20]
    for a in anomalies:
        if (a.severity or "").lower() in ("high", "critical"):
            flags.append(
                f"[Budget] {a.severity} anomaly in {a.category}: "
                f"₹{a.amount} — {a.explanation or ''}"
            )

    # --- 3. Simple deterministic checks (fallbacks if the ML tables are empty)
    if not forecasts and not anomalies:
        pending = Scene.objects.filter(
            project=project, status="pending"
        ).count()
        if pending > 20:
            flags.append(f"[Rule] {pending} scenes still pending")
        end_date = getattr(project, "end_date", None) or getattr(
            project, "deadline", None
        )
        if end_date and end_date < date.today() and pending > 0:
            flags.append(
                f"[Rule] Past end-date with {pending} pending scenes"
            )

    advice = ""
    if flags:
        advice = generate(
            "You are a film producer. In 3 bullet points, propose "
            "concrete mitigations for these risks:\n"
            + "\n".join(f"- {f}" for f in flags)
        )

    return {
        "project_id": str(project.pk),
        "project": str(project),
        "flags": flags,
        "advice": advice,
        "sources": {
            "risk_forecasts": len(forecasts),
            "budget_anomalies": len(anomalies),
        },
    }