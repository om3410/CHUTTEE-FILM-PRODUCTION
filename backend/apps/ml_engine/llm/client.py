"""Thin wrapper over ai_service.ai_call() for structured + text generation.

Reuses the existing 8-provider fallback chain from
apps.ml_engine.ai_service — no new API keys or SDKs needed.
"""
import json
import re

from apps.ml_engine.ai_service import ai_call


def generate(prompt, system=None):
    """Free-text generation via the multi-provider fallback chain."""
    if system:
        prompt = f"{system}\n\n{prompt}"
    result = ai_call(prompt)
    return result["text"]


def generate_json(prompt, system=None):
    """Structured JSON generation. Strips markdown fences if present."""
    sys = (system or "") + (
        "\nReturn ONLY valid JSON. No markdown fences, no explanation, no prose."
    )
    text = generate(prompt, system=sys).strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if m:
            return json.loads(m.group(0))
        raise
