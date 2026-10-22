"""Multimedia GenAI features."""
from apps.ml_engine.llm.client import generate, generate_json


def trailer_narration(text: str) -> dict:
    """Generate trailer voiceover."""
    prompt = f"""Write a 90-second trailer voiceover for this screenplay.
Include 3-5 key beats and a strong closing tagline.
Return plain narration text only.

{text[:12000]}"""
    return {"narration": generate(prompt), "duration_seconds": 90}


def poster_content(text: str, genre: str = "") -> dict:
    """Generate marketing content."""
    prompt = f"""Generate marketing content for a film.
Genre: {genre or 'unspecified'}
Return JSON: {{"taglines": [3 options], "short_description": str,
"long_description": str, "instagram_captions": [3 options],
"hashtags": [str], "target_audience": str}}

Content:
{text[:8000]}"""
    return generate_json(prompt, system="You are a film marketing expert. Return only JSON.")


def storyboard_prompts(text: str) -> dict:
    """Generate text descriptions for storyboard images."""
    prompt = f"""For each scene, write a detailed storyboard image prompt.
Return JSON: {{"storyboards": [{{"scene_number": int, "prompt": str,
"camera_angle": str, "lighting": str}}]}}

Screenplay:
{text[:10000]}"""
    return generate_json(prompt, system="You are a storyboard artist. Return only JSON.")