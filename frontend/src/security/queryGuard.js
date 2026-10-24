// QueryGuard — AST-style validation for text2sql
// Only SELECT statements against allowlisted tables

const ALLOWED_TABLES = [
  'film_projects', 'scenes', 'crew_members', 'cast_members',
  'transactions', 'shoot_days', 'equipment', 'activity_logs',
];

const FORBIDDEN_KEYWORDS = [
  'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE',
  'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'MERGE',
  'REPLACE', 'CALL', 'COPY', 'VACUUM', 'ANALYZE', 'REINDEX',
];

export function validate(sql = '') {
  const upper = sql.toUpperCase();

  // 1. Must start with SELECT
  if (!/^\s*SELECT\b/.test(upper)) {
    return { safe: false, reason: 'Query must start with SELECT' };
  }

  // 2. No forbidden keywords
  for (const kw of FORBIDDEN_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`, 'i');
    if (re.test(upper)) {
      return { safe: false, reason: `Forbidden keyword: ${kw}` };
    }
  }

  // 3. No multi-statement (; followed by anything)
  if (/;\s*\S/.test(upper)) {
    return { safe: false, reason: 'Multiple statements are not allowed' };
  }

  // 4. No comments that could hide injection
  if (/--|\/\*/.test(sql)) {
    return { safe: false, reason: 'SQL comments are not allowed' };
  }

  // 5. Extract table names after FROM / JOIN
  const tables = [];
  const tableRe = /\b(?:FROM|JOIN)\s+([a-z_][a-z0-9_]*)/gi;
  let m;
  while ((m = tableRe.exec(sql)) !== null) {
    tables.push(m[1].toLowerCase());
  }

  for (const t of tables) {
    if (!ALLOWED_TABLES.includes(t)) {
      return { safe: false, reason: `Table not allowlisted: ${t}` };
    }
  }

  return { safe: true, tables, reason: null };
}

export function scopeToUser(sql, userId) {
  // Inject WHERE owner_id = :userId if no WHERE exists
  // In real prod this must be server-side
  if (!/\bWHERE\b/i.test(sql)) {
    return sql.replace(/(\bFROM\s+\w+)/i, `$1 WHERE owner_id = '${userId}'`);
  }
  return sql;
}

export function limitRows(sql, max = 100) {
  if (/\bLIMIT\b/i.test(sql)) return sql;
  return `${sql} LIMIT ${max}`;
}