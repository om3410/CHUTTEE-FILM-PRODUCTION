// Client-side audit trail (mirrors django-auditlog)
// In prod, these POST to /api/security/audit/

const KEY = 'chuttee-audit-log';
const MAX_ENTRIES = 500;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function save(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {}
}

export function log(entry) {
  const record = {
    id: crypto.randomUUID?.() || `log-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  const entries = load();
  entries.push(record);
  save(entries);
  window.dispatchEvent(new CustomEvent('chuttee:audit', { detail: record }));
  return record;
}

export function getAll() {
  return load().slice().reverse();
}

export function clear() {
  save([]);
  window.dispatchEvent(new CustomEvent('chuttee:audit', { detail: { type: 'clear' } }));
}

export function filterBy({ action, level, since }) {
  let entries = getAll();
  if (action) entries = entries.filter((e) => e.action?.includes(action));
  if (level) entries = entries.filter((e) => e.level === level);
  if (since) entries = entries.filter((e) => new Date(e.timestamp) >= new Date(since));
  return entries;
}