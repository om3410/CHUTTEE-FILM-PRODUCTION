# CHUTTEE FILM PRODUCTION

AI-powered film production platform - Django 5 + React + PostgreSQL with
an 8-provider LLM fallback chain (Gemini, Groq, Cerebras, OpenRouter,
Mistral, DeepSeek, Cohere, HuggingFace). All free-tier, no paid keys.

## Live AI Features

| Feature | Endpoint | Status |
|---|---|---|
| Script structure analysis | POST /api/ml/script/analyze/ | done |
| Screenplay summarization | POST /api/ml/script/summarize/ | done |
| Mood and genre classification | POST /api/ml/script/mood/ | done |
| Natural language to SQL | POST /api/ml/query/sql/ | done |

## Live Demo Output

### Natural language to SQL against the real database

Request: POST /api/ml/query/sql/
Body: { "question": "Show the first 3 film projects with their title and total_budget" }

Response:
{
  "sql": "SELECT title, total_budget FROM film_projects LIMIT 3",
  "explanation": "Retrieves the title and total budget for the first 3 film projects.",
  "columns": ["title", "total_budget"],
  "rows": [{ "title": "Chuttee", "total_budget": 500000.0 }],
  "row_count": 1
}

### Genre/mood classification

Request: POST /api/ml/script/mood/
Body: { "text": "screenplay content" }

Response:
{
  "genres": [
    {"name": "Romance", "percent": 50},
    {"name": "Drama", "percent": 30},
    {"name": "Coming-of-Age", "percent": 20}
  ],
  "dominant": "Romance",
  "reasoning": "Classic Bollywood character archetypes and romantic-vs-academic conflict."
}

### Screenplay summarization

Request: POST /api/ml/script/summarize/
Body: { "text": "screenplay content", "style": "short" }

Response:
{
  "summary": "Set in a college canteen, Rahul approaches Priya wanting to share something crucial...",
  "style": "short"
}

### Script structure analysis

Request: POST /api/ml/script/analyze/  (multipart: file=@script.txt)

Response:
{
  "total_scenes": 2,
  "characters": {"RAHUL": 3, "PRIYA": 2},
  "locations": ["COLLEGE CANTEEN", "MUMBAI STREET"],
  "speaking_percentage": {"RAHUL": 52.2, "PRIYA": 47.8},
  "dialogue_count": 5
}

## Architecture

React frontend -> Django 5 + DRF + Daphne (ASGI) -> PostgreSQL

apps/ml_engine:
- ai_service.py : 8-provider LLM fallback chain
- llm/client.py : generate() and generate_json()
- nlp/script_analyzer.py : screenplay parser
- text2sql/agent.py : NL to SQL (schema-aware, SELECT-only)
- rag/ : Chroma-backed document Q&A (next)

## Quick start

cd backend
pip install -r requirements.txt
cp config/.env.example config/.env
python manage.py migrate
python manage.py runserver

Enable AI by setting any one of: GEMINI_API_KEY, GROQ_API_KEY,
CEREBRAS_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY, DEEPSEEK_API_KEY,
COHERE_API_KEY, HUGGINGFACE_API_KEY.

Swagger docs at http://localhost:8000/swagger/
