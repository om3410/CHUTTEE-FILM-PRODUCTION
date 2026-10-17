"""Seed Chroma from the real production + AI tables."""
from django.apps import apps as django_apps

from .vector_store import add


def chunk(text, size=800, overlap=100):
    text = (text or "").strip()
    if not text:
        return []
    chunks, i = [], 0
    while i < len(text):
        chunks.append(text[i:i + size])
        i += size - overlap
    return chunks


def _safe_get(obj, *names, default=None):
    for n in names:
        v = getattr(obj, n, None)
        if v not in (None, "", []):
            return v
    return default


# -------------------------------------------------------------
# Ingest uploaded document into Chroma
# -------------------------------------------------------------
def ingest_knowledge_doc(doc):
    """
    `doc` is an AIKnowledgeDoc instance with raw_text populated.
    Writes chroma_ids back to the row.
    """
    chunks = chunk(doc.raw_text)
    if not chunks:
        return

    ids = [f"kd_{doc.id}_{i}" for i in range(len(chunks))]
    metas = [
        {
            "source": doc.title,
            "kind": doc.kind,
            "doc_id": str(doc.id),
            "project_id": str(doc.project_id) if doc.project_id else "",
        }
        for _ in chunks
    ]
    add(chunks, metas, ids)

    doc.chroma_ids = ids
    doc.save(update_fields=["chroma_ids"])


# -------------------------------------------------------------
# Ingest all production + AI tables into Chroma
# -------------------------------------------------------------
def seed_from_db() -> dict:
    docs, metas, ids = [], [], []

    FilmProject = django_apps.get_model("production", "FilmProject")
    Scene = django_apps.get_model("production", "Scene")
    CastMember = django_apps.get_model("production", "CastMember")

    # --- Projects
    for p in FilmProject.objects.all()[:2000]:
        text = (
            f"FilmProject: {p}. "
            f"Budget={_safe_get(p, 'budget', default=0)}. "
            f"Status={_safe_get(p, 'status', 'unknown')}. "
            f"Start={_safe_get(p, 'start_date')}. "
            f"End={_safe_get(p, 'end_date', 'deadline')}. "
            f"Synopsis={_safe_get(p, 'synopsis', 'description')}."
        )
        docs.append(text)
        metas.append({"kind": "project", "id": str(p.pk)})
        ids.append(f"filmproject_{p.pk}")

    # --- Cast members
    for c in CastMember.objects.all()[:2000]:
        fields = []
        for f in ("name", "actor_name", "character_name", "role",
                  "gender", "age", "skills", "languages",
                  "profile", "bio", "experience"):
            v = getattr(c, f, None)
            if v:
                fields.append(f"{f}={v}")
        text = f"CastMember: {c}. " + ". ".join(fields)
        docs.append(text)
        metas.append({"kind": "cast", "id": str(c.pk)})
        ids.append(f"cast_{c.pk}")

    # --- Scenes
    for s in Scene.objects.all()[:5000]:
        text = (
            f"Scene #{_safe_get(s, 'scene_number', 'scene_no')} "
            f"of {s.project} — "
            f"location={_safe_get(s, 'location')}, "
            f"time={_safe_get(s, 'time_of_day')}, "
            f"status={_safe_get(s, 'status')}. "
            f"{_safe_get(s, 'description', default='')}"
        )
        docs.append(text)
        metas.append({
            "kind": "scene",
            "id": str(s.pk),
            "project_id": str(s.project_id),
        })
        ids.append(f"scene_{s.pk}")

    # --- Existing AI cast recommendations
    try:
        AICastRecommendation = django_apps.get_model(
            "ml_engine", "AICastRecommendation"
        )
        for r in AICastRecommendation.objects.all()[:2000]:
            text = (
                f"AI casting recommendation — role: "
                f"{r.role_description}, cast: {r.recommended_cast}, "
                f"score: {r.match_score}, reason: {r.reason}"
            )
            docs.append(text)
            metas.append({"kind": "ai_cast", "id": str(r.pk)})
            ids.append(f"aicast_{r.pk}")
    except LookupError:
        pass

    # --- Existing AI risk forecasts
    try:
        AIRiskForecast = django_apps.get_model(
            "ml_engine", "AIRiskForecast"
        )
        for f in AIRiskForecast.objects.all()[:2000]:
            text = (
                f"AI risk — project={f.project}, type={f.risk_type}, "
                f"probability={f.predicted_probability}, "
                f"impact={f.predicted_impact}, rationale={f.rationale}, "
                f"action={f.preventive_action}"
            )
            docs.append(text)
            metas.append({"kind": "ai_risk", "id": str(f.pk)})
            ids.append(f"airisk_{f.pk}")
    except LookupError:
        pass

    # --- Existing AI budget anomalies
    try:
        AIBudgetAnomaly = django_apps.get_model(
            "ml_engine", "AIBudgetAnomaly"
        )
        for a in AIBudgetAnomaly.objects.all()[:2000]:
            text = (
                f"AI budget anomaly — project={a.project}, "
                f"category={a.category}, amount={a.amount}, "
                f"severity={a.severity}, explanation={a.explanation}"
            )
            docs.append(text)
            metas.append({"kind": "ai_budget", "id": str(a.pk)})
            ids.append(f"aibudget_{a.pk}")
    except LookupError:
        pass

    if docs:
        add(docs, metas, ids)
    return {"ingested": len(docs)}