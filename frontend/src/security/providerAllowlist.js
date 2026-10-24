// ProviderAllowlist — decide which LLM provider may see which data class
// Prevents sending sensitive data to unapproved providers

const ALLOWLIST = {
  // Data class → allowed providers
  public: ['all'],
  internal: ['gemini', 'groq', 'cerebras', 'mistral', 'deepseek'],
  confidential: ['gemini', 'mistral'],
  restricted: [], // never leaves the browser
};

export function isProviderAllowed(dataClass, provider) {
  const allowed = ALLOWLIST[dataClass] || [];
  return allowed.includes('all') || allowed.includes(provider);
}

export function getAllowlist() {
  return ALLOWLIST;
}

export function classifyData(text = '') {
  // Heuristic: if it contains PII → confidential
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/.test(text)) return 'confidential';
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) return 'restricted';
  if (/password|secret|token|api[_ ]?key/i.test(text)) return 'restricted';
  if (text.length > 500) return 'internal';
  return 'public';
}