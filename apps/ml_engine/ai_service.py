"""
Chuttee AI Service
==================
Multi-provider fallback chain across 8 FREE providers:
  Gemini → Groq → Cerebras → OpenRouter → Mistral → DeepSeek → Cohere → Hugging Face

Location: backend/apps/ml_engine/ai_service.py
Import:   from .ai_service import ai_call, providers_status

Every provider is free-tier. If one fails or rate-limits, the next is tried.
No paid API keys required — ₹0 total cost.
"""
import os
import time
import logging
import importlib
import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ============================================================
# INITIALIZE CLIENTS (SAFE — won't crash if key is missing)
# ============================================================

# ---------- Google Gemini (new google-genai SDK) ----------
_gemini_key = os.getenv('GEMINI_API_KEY')
gemini_client = None
if _gemini_key:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=_gemini_key)
    except Exception as e:
        logger.warning(f"[AI] Gemini init failed: {e}")
        gemini_client = None

# ---------- Groq ----------
_groq_key = os.getenv('GROQ_API_KEY')
groq_client = None
if _groq_key:
    try:
        from groq import Groq
        groq_client = Groq(api_key=_groq_key)
    except Exception as e:
        logger.warning(f"[AI] Groq init failed: {e}")
        groq_client = None


# ============================================================
# PROVIDER FUNCTIONS
# ============================================================

def call_gemini(prompt: str) -> str:
    """Call Google Gemini free tier (google-genai SDK)."""
    if not gemini_client:
        raise RuntimeError("Gemini not configured (missing SDK or key)")
    response = gemini_client.models.generate_content(
        model=os.getenv('DEFAULT_GEMINI_MODEL', 'gemini-1.5-flash'),
        contents=prompt,
    )
    return response.text


def call_groq(prompt: str) -> str:
    """Call Groq free tier (Llama 3.3 70B)."""
    if not groq_client:
        raise RuntimeError("Groq not configured (missing SDK or key)")
    response = groq_client.chat.completions.create(
        model=os.getenv('DEFAULT_GROQ_MODEL', 'llama-3.3-70b-versatile'),
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def call_cerebras(prompt: str) -> str:
    """Call Cerebras free tier (Llama 3.1 70B)."""
    key = os.getenv('CEREBRAS_API_KEY')
    if not key:
        raise RuntimeError("Cerebras not configured")

    r = requests.post(
        'https://api.cerebras.ai/v1/chat/completions',
        headers={
            'Authorization': f"Bearer {key}",
            'Content-Type': 'application/json',
        },
        json={
            'model': os.getenv('DEFAULT_CEREBRAS_MODEL', 'llama3.1-70b'),
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()['choices'][0]['message']['content']


def call_openrouter(prompt: str) -> str:
    """Call OpenRouter free tier (25+ models)."""
    key = os.getenv('OPENROUTER_API_KEY')
    if not key:
        raise RuntimeError("OpenRouter not configured")

    r = requests.post(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={
            'Authorization': f"Bearer {key}",
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://chuttee.app',
            'X-Title': 'Chuttee Film Production',
        },
        json={
            'model': os.getenv(
                'DEFAULT_OPENROUTER_MODEL',
                'meta-llama/llama-3.1-8b-instruct:free'
            ),
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()['choices'][0]['message']['content']


def call_mistral(prompt: str) -> str:
    """Call Mistral AI free tier ($10/month credit)."""
    key = os.getenv('MISTRAL_API_KEY')
    if not key:
        raise RuntimeError("Mistral not configured")

    r = requests.post(
        'https://api.mistral.ai/v1/chat/completions',
        headers={
            'Authorization': f"Bearer {key}",
            'Content-Type': 'application/json',
        },
        json={
            'model': os.getenv('DEFAULT_MISTRAL_MODEL', 'mistral-large-latest'),
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()['choices'][0]['message']['content']


def call_deepseek(prompt: str) -> str:
    """Call DeepSeek free tier (reasoning + code)."""
    key = os.getenv('DEEPSEEK_API_KEY')
    if not key:
        raise RuntimeError("DeepSeek not configured")

    r = requests.post(
        'https://api.deepseek.com/chat/completions',
        headers={
            'Authorization': f"Bearer {key}",
            'Content-Type': 'application/json',
        },
        json={
            'model': os.getenv('DEFAULT_DEEPSEEK_MODEL', 'deepseek-chat'),
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()['choices'][0]['message']['content']


def call_cohere(prompt: str) -> str:
    """Call Cohere free tier (embeddings, rerank, chat)."""
    key = os.getenv('COHERE_API_KEY')
    if not key:
        raise RuntimeError("Cohere not configured")

    r = requests.post(
        'https://api.cohere.com/v2/chat',
        headers={
            'Authorization': f"Bearer {key}",
            'Content-Type': 'application/json',
        },
        json={
            'model': os.getenv(
                'DEFAULT_COHERE_MODEL',
                'command-r-plus-08-2024'
            ),
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    # Cohere v2 returns content as a list of parts; concatenate safely.
    content = r.json()['message']['content']
    if isinstance(content, list):
        return ''.join(part.get('text', '') for part in content)
    return content


def call_huggingface(prompt: str) -> str:
    """Call Hugging Face Inference API free tier (router endpoint)."""
    key = os.getenv('HUGGINGFACE_API_KEY')
    if not key:
        raise RuntimeError("Hugging Face not configured")

    model = os.getenv(
        'DEFAULT_HF_MODEL',
        'meta-llama/Llama-3.3-70B-Instruct'
    )
    r = requests.post(
        'https://router.huggingface.co/v1/chat/completions',
        headers={
            'Authorization': f"Bearer {key}",
            'Content-Type': 'application/json',
        },
        json={
            'model': model,
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()
    return data['choices'][0]['message']['content']


# ============================================================
# PROVIDER REGISTRY
# ============================================================
PROVIDERS = {
    'gemini':     (call_gemini,     'GEMINI_API_KEY',     'google.genai'),
    'groq':       (call_groq,       'GROQ_API_KEY',       'groq'),
    'cerebras':   (call_cerebras,   'CEREBRAS_API_KEY',   'requests'),
    'openrouter': (call_openrouter, 'OPENROUTER_API_KEY', 'requests'),
    'mistral':    (call_mistral,    'MISTRAL_API_KEY',    'requests'),
    'deepseek':   (call_deepseek,   'DEEPSEEK_API_KEY',   'requests'),
    'cohere':     (call_cohere,     'COHERE_API_KEY',     'requests'),
    'huggingface':(call_huggingface,'HUGGINGFACE_API_KEY','requests'),
}


# ============================================================
# UNIFIED AI CALL WITH FALLBACK CHAIN
# ============================================================

def ai_call(prompt: str, provider_order: str = None) -> dict:
    """
    Try each provider in order. Return first successful response.

    Args:
        prompt: The prompt to send to the AI.
        provider_order: Optional comma-separated provider list.
                       Defaults to AI_PROVIDER_ORDER from .env.

    Returns:
        {
            "text": "AI response text",
            "provider": "gemini",
            "attempts": 1
        }

    Raises:
        RuntimeError: If all providers fail.
    """
    order = (
        provider_order
        or os.getenv(
            'AI_PROVIDER_ORDER',
            'gemini,groq,cerebras,openrouter,mistral,deepseek,cohere,huggingface'
        )
    ).split(',')

    last_error = None

    for i, name in enumerate(order):
        name = name.strip()
        if not name:
            continue

        entry = PROVIDERS.get(name)
        if not entry:
            logger.debug(f"[AI] Unknown provider: {name}")
            continue
        fn, key_env = entry[0], entry[1]

        if not os.getenv(key_env):
            logger.debug(f"[AI] Skipping {name} — {key_env} not set")
            continue

        try:
            logger.info(f"[AI] Trying {name}...")
            text = fn(prompt)
            logger.info(f"[AI] ✓ Success via {name}")
            return {
                'text': text,
                'provider': name,
                'attempts': i + 1,
            }
        except Exception as e:
            logger.warning(f"[AI] ✗ {name} failed: {e}")
            last_error = e
            time.sleep(1)
            continue

    raise RuntimeError(
        f"All AI providers failed. "
        f"Tried: {[n.strip() for n in order if n.strip()]}. "
        f"Last error: {last_error}"
    )


# ============================================================
# PROVIDER STATUS
# ============================================================

def providers_status() -> dict:
    """
    Check which providers are fully ready (key set AND SDK installed).

    Returns:
        {
            "gemini": True,
            "groq": True,
            "cerebras": False,
            ...
        }
    """
    status = {}
    for name, entry in PROVIDERS.items():
        key_env = entry[1]
        module = entry[2]

        has_key = bool(os.getenv(key_env))
        try:
            importlib.import_module(module)
            has_sdk = True
        except ImportError:
            has_sdk = False

        status[name] = has_key and has_sdk

    return status