"""Feature B14 — Casting recommendation against CastMember rows."""
import numpy as np
from apps.production.models import CastMember
from apps.ml_engine.rag.vector_store import embed


def _profile(cast):
    """
    Build a text profile from a CastMember regardless of exact field names.
    We try several common ones and skip the missing ones.
    """
    parts = [str(cast)]
    for field in (
        "name", "actor_name", "full_name", "character_name",
        "role", "role_name", "role_description",
        "gender", "age", "skills", "languages",
        "profile", "bio", "description", "experience",
    ):
        val = getattr(cast, field, None)
        if val:
            parts.append(f"{field}: {val}")
    return ". ".join(parts)


def recommend_cast(character_desc: str, limit: int = 10) -> list[dict]:
    """
    Returns ranked CastMember candidates by cosine similarity
    between the character description and each member's profile.
    """
    cast_members = list(CastMember.objects.all())
    if not cast_members:
        return []

    q = np.array(embed([character_desc])[0])
    profiles = [_profile(c) for c in cast_members]
    mat = np.array(embed(profiles))
    scores = mat @ q
    order = np.argsort(-scores)[:limit]

    return [
        {
            "cast_id": str(cast_members[i].pk),
            "name": str(cast_members[i]),
            "score": round(float(scores[i]), 3),
        }
        for i in order
    ]