"""Script intelligence GenAI features."""
from apps.ml_engine.llm.client import generate, generate_json
from apps.ml_engine.nlp.script_analyzer import ScriptAnalyzer


def scene_breakdown(text: str) -> dict:
    """Extract scene-by-scene breakdown with cast, props, duration."""
    prompt = f"""You are a script supervisor. Break down this screenplay into scenes.
Return JSON: {{"scenes": [{{"scene_number": int, "location": str, "time_of_day": str,
"cast": [str], "props": [str], "estimated_duration_minutes": int}}], "total_scenes": int}}

Screenplay:
{text[:12000]}"""
    return generate_json(prompt, system="You are a film script supervisor. Return only JSON.")


def enhance_dialogue(text: str, style: str = "emotional") -> dict:
    """Rewrite dialogue in a chosen style."""
    prompt = f"""Rewrite this dialogue to be more {style}.
Keep character names, scene structure and meaning intact.
Return only the rewritten dialogue, no commentary.

{text[:8000]}"""
    return {"original": text, "rewritten": generate(prompt), "style": style}


def character_consistency(text: str) -> dict:
    """Check character behavior consistency."""
    prompt = f"""Analyze this screenplay for character consistency.
Flag where a character's behavior, voice, or motives shift without justification.
Return JSON: {{"characters": [{{"name": str, "traits": [str],
"issues": [{{"scene_hint": str, "problem": str, "suggestion": str}}]}}],
"overall_consistency_score": int, "summary": str}}

Screenplay:
{text[:12000]}"""
    return generate_json(prompt, system="You are a script consultant. Return only JSON.")


def plot_holes(text: str) -> dict:
    """Detect plot holes and timeline issues."""
    prompt = f"""Detect plot holes, logic gaps, and timeline inconsistencies.
Return JSON: {{"plot_holes": [{{"severity": "low|medium|high", "type": str,
"description": str, "scene_hint": str, "suggestion": str}}],
"score": int, "summary": str}}

Screenplay:
{text[:12000]}"""
    return generate_json(prompt, system="You are a story editor. Return only JSON.")