"""
Image generation service with multi-provider fallback.

Supports (in order):
  1. Pollinations  — free, no API key required
  2. Stability AI  — requires STABILITY_API_KEY
  3. HuggingFace   — requires HUGGINGFACE_API_KEY
"""

import os
import base64
import urllib.parse
import requests
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


def _generate_pollinations(prompt: str, width: int = 1024, height: int = 768) -> bytes:
    """Free, no key required. Returns raw image bytes."""
    encoded = urllib.parse.quote(prompt)
    url = (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={width}&height={height}&nologo=true&seed={hash(prompt) & 0xFFFF}"
    )
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.content


def _generate_stability(prompt: str, width: int = 1024, height: int = 768) -> bytes:
    """Requires STABILITY_API_KEY env var."""
    api_key = os.environ.get("STABILITY_API_KEY")
    if not api_key:
        raise RuntimeError("STABILITY_API_KEY not set")

    response = requests.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "image/png",
        },
        json={
            "text_prompts": [{"text": prompt, "weight": 1}],
            "width": min(width, 1024),
            "height": min(height, 1024),
            "steps": 30,
            "cfg_scale": 7,
        },
        timeout=90,
    )
    response.raise_for_status()
    return response.content


def _generate_huggingface(prompt: str) -> bytes:
    """Requires HUGGINGFACE_API_KEY env var."""
    api_key = os.environ.get("HUGGINGFACE_API_KEY")
    if not api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY not set")

    response = requests.post(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"inputs": prompt},
        timeout=90,
    )
    response.raise_for_status()
    return response.content


def generate_image(prompt: str, width: int = 1024, height: int = 768) -> dict:
    """
    Try providers in order until one succeeds.

    Returns:
        {
            "success": True,
            "data": b"<image bytes>",
            "provider": "pollinations",
            "prompt": "...",
        }
    Raises RuntimeError if all providers fail.
    """
    providers = [
        ("pollinations", lambda: _generate_pollinations(prompt, width, height)),
        ("stability", lambda: _generate_stability(prompt, width, height)),
        ("huggingface", lambda: _generate_huggingface(prompt)),
    ]

    errors = []
    for name, fn in providers:
        try:
            data = fn()
            if data and len(data) > 1000:  # sanity check
                return {"success": True, "data": data, "provider": name, "prompt": prompt}
            errors.append(f"{name}: empty response")
        except Exception as exc:
            errors.append(f"{name}: {exc}")
            continue

    raise RuntimeError(f"All image providers failed: {'; '.join(errors)}")