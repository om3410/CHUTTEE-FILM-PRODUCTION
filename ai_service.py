"""
Chuttee AI Service
Multi-provider fallback chain across 8 FREE providers.
"""
import os
import time
import logging
import requests
import google.generativeai as genai
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ============================================================
# INITIALIZE CLIENTS
# ============================================================
_gemini_key = os.getenv('GEMINI_API_KEY')
if _gemini_key:
    genai.configure(api_key=_gemini_key)
    gemini_model = genai.GenerativeModel(
        os.getenv('DEFAULT_GEMINI_MODEL', 'gemini-3.7-flash')
    )
else:
    gemini_model = None

groq_client = (
    Groq(api_key=os.getenv('GROQ_API_KEY'))
    if os.getenv('GROQ_API_KEY') else None
)


# ============================================================
# PROVIDER FUNCTIONS
# ============================================================
def call_gemini(prompt: str) -> str:
    if not gemini_model:
        raise RuntimeError("Gemini not configured")
    return gemini_model.generate_content(prompt).text


def call_groq(prompt: str) -> str:
    if not groq_client:
        raise RuntimeError("Groq not configured")
    response = groq_client.chat.completions.create(
        model=os.getenv('DEFAULT_GROQ_MODEL', 'llama-3.3-70b-versatile'),
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def call_cerebras(prompt: str) -> str:
    r = requests.post(
        'https://api.cerebras.ai/v1/chat/completions',
        headers={
            'Authorization': f"Bearer {os.getenv('CEREBRAS_API_KEY')}",
            'Content-Type': 'application/json',
        },
        json={
            'model': os.getenv('DEFAULT_CEREBRAS_MODEL', 'llama-3.3-70b'),
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()['choices'][0]['message']['content']


def call_openrouter(prompt: str) -> str:
    r = requests.post(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={
            'Authorization': f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://chuttee.app',
            'X-Title': 'Chuttee Film Production',
        },
        json={
            'model': os.getenv('DEFAULT_OPENROUTER_MODEL', 'nvidia/nemotron-3.5-lightning:free'),
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()['choices'][0]['message']['content']


def call_mistral(prompt: str) -> str:
    r = requests.post(
        'https://api.mistral.ai/v1/chat/completions',
        headers={
            'Authorization': f"Bearer {os.getenv('MISTRAL_API_KEY')}",
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
    r = requests.post(
        'https://api.deepseek.com/chat/completions',
        headers={
            'Authorization': f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
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
    r = requests.post(
        'https://api.cohere.com/v2/chat',
        headers={
            'Authorization': f"Bearer {os.getenv('COHERE_API_KEY')}",
            'Content-Type': 'application/json',
        },
        json={
            'model': os.getenv('DEFAULT_COHERE_MODEL', 'command-r-plus-08-2024'),
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()['message']['content'][0]['text']


def call_huggingface(prompt: str) -> str:
    model = os.getenv('DEFAULT_HF_MODEL', 'meta-llama/Llama-3.3-70B-Instruct')
    r = requests.post(
        f"https://api-inference.huggingface.co/models/{model}",
        headers={
            'Authorization': f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}",
            'Content-Type': 'application/json',
        },
        json={'inputs': prompt},
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()
    if isinstance(data, list):
        return data[0].get('generated_text', '')
    return data.get('generated_text', '')


# ============================================================
# PROVIDER REGISTRY
# ============================================================
PROVIDERS = {
    'gemini': (call_gemini, 'GEMINI_API_KEY'),
    'groq': (call_groq, 'GROQ_API_KEY'),
    'cerebras': (call_cerebras, 'CEREBRAS_API_KEY'),
    'openrouter': (call_openrouter, 'OPENROUTER_API_KEY'),
    'mistral': (call_mistral, 'MISTRAL_API_KEY'),
    'deepseek': (call_deepseek, 'DEEPSEEK_API_KEY'),
    'cohere': (call_cohere, 'COHERE_API_KEY'),
    'huggingface': (call_huggingface, 'HUGGINGFACE_API_KEY'),
}


def ai_call(prompt: str, provider_order: str = None) -> dict:
    """Try each provider in order. Return first success."""
    order = (provider_order or os.getenv(
        'AI_PROVIDER_ORDER',
        'gemini,groq,cerebras,openrouter,mistral,deepseek,cohere,huggingface'
    )).split(',')

    last_error = None
    for i, name in enumerate(order):
        name = name.strip()
        fn, key_env = PROVIDERS.get(name, (None, None))
        if not fn or not os.getenv(key_env):
            continue

        try:
            logger.info(f"[AI] Trying {name}...")
            text = fn(prompt)
            logger.info(f"[AI] ✓ Success via {name}")
            return {'text': text, 'provider': name, 'attempts': i + 1}
        except Exception as e:
            logger.warning(f"[AI] ✗ {name} failed: {e}")
            last_error = e
            time.sleep(1)

    raise RuntimeError(f"All AI providers failed. Last error: {last_error}")


def providers_status() -> dict:
    return {name: bool(os.getenv(key_env)) for name, (_, key_env) in PROVIDERS.items()}