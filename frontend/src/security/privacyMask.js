// PrivacyMask — redact PII before sending to external LLM
// Real regex patterns for common PII types

const PATTERNS = [
  {
    type: 'email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replace: '[EMAIL_REDACTED]',
  },
  {
    type: 'phone',
    regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replace: '[PHONE_REDACTED]',
  },
  {
    type: 'ssn',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replace: '[SSN_REDACTED]',
  },
  {
    type: 'credit_card',
    regex: /\b(?:\d[ -]*?){13,16}\b/g,
    replace: '[CARD_REDACTED]',
  },
  {
    type: 'pan',
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    replace: '[PAN_REDACTED]',
  },
  {
    type: 'aadhaar',
    regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    replace: '[AADHAAR_REDACTED]',
  },
  {
    type: 'ip',
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replace: '[IP_REDACTED]',
  },
  {
    type: 'url_with_token',
    regex: /(https?:\/\/[^\s]+[?&](?:token|key|secret|password)=[^\s&]+)/gi,
    replace: '[URL_WITH_TOKEN_REDACTED]',
  },
];

export function mask(text = '') {
  if (typeof text !== 'string') return { text, redacted: [] };

  let result = text;
  const redacted = [];

  for (const { type, regex, replace } of PATTERNS) {
    const matches = result.match(regex);
    if (matches) {
      matches.forEach((m) => redacted.push({ type, value: m }));
      result = result.replace(regex, replace);
    }
  }

  return { text: result, redacted };
}

export function hasPII(text = '') {
  return mask(text).redacted.length > 0;
}

export function summarizeRedactions(redacted = []) {
  const counts = {};
  redacted.forEach((r) => {
    counts[r.type] = (counts[r.type] || 0) + 1;
  });
  return counts;
}