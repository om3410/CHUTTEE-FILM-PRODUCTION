"""Text-to-SQL - Feature B11. Targets the real Chuttee schema."""
from django.db import connection, DatabaseError

from apps.ml_engine.llm.client import generate_json

SYSTEM = """You are a PostgreSQL expert working on a film production database.
Convert the user question into a single SELECT query.
Return JSON: {"sql": "...", "explanation": "..."}

Rules:
- Only SELECT. Never INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE.
- Use the EXACT table and column names from the provided schema.
- UUID values must be quoted with single quotes.
- For TEXT[] columns use: value = ANY(column_name).
- For JSONB columns use -> or ->> operators.
- Add LIMIT 100 if the user doesn't specify a count.
- If the question can't be answered with the given schema, return
  {"sql": "", "explanation": "..."}.
- Do not wrap the SQL in markdown fences."""


SKIP_TABLES = {
    "django_migrations", "django_content_type", "django_admin_log",
    "django_session", "auth_user", "auth_group", "auth_permission",
    "auth_user_groups", "auth_user_user_permissions",
    "auth_group_permissions", "authtoken_token",
}


def _schema_text():
    """Portable schema dump (SQLite + PostgreSQL)."""
    tables = connection.introspection.table_names()
    lines = []
    with connection.cursor() as cur:
        for t in sorted(tables):
            if t in SKIP_TABLES or t.startswith(("django_", "auth_", "authtoken_")):
                continue
            try:
                cols = connection.introspection.get_table_description(cur, t)
            except Exception:
                continue
            col_str = ", ".join(c.name for c in cols)
            lines.append(f"{t}({col_str})")
    return "\n".join(lines)


def ask(question):
    schema = _schema_text()
    try:
        result = generate_json(
            f"Schema:\n{schema}\n\nQuestion: {question}",
            system=SYSTEM,
        )
    except Exception as e:
        return {"error": f"LLM failed: {e}"}

    sql = (result.get("sql") or "").strip().rstrip(";")
    if not sql.lower().startswith("select"):
        return {
            "error": "Only SELECT allowed",
            "explanation": result.get("explanation", ""),
        }

    try:
        with connection.cursor() as cur:
            cur.execute(sql)
            cols = [c[0] for c in cur.description]
            rows = cur.fetchall()
    except DatabaseError as e:
        return {"error": str(e), "sql": sql}

    return {
        "sql": sql,
        "explanation": result.get("explanation", ""),
        "columns": cols,
        "rows": [dict(zip(cols, r)) for r in rows[:200]],
        "row_count": len(rows),
    }
