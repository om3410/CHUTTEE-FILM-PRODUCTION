// PromptShield — detect prompt injection attempts
// Real injection patterns that bypass most AI systems

const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(previous|above|all)\s+(instructions|prompts)/i,
  /forget\s+(previous|above|all)\s+(instructions|prompts)/i,
  /you\s+are\s+now\s+(?:a|an|the)/i,
  /pretend\s+(?:to\s+be|you\s+are)/i,
  /roleplay\s+as/i,
  /system\s*:\s*/i,
  /\[system\]/i,
  /<\|system\|>/i,
  /<\|im_start\|>/i,
  /###\s*instruction/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /\bnew\s+instructions?\b/i,
  /override\s+(safety|security|rules)/i,
  /reveal\s+(?:your|the)\s+(?:prompt|instructions|system)/i,
  /print\s+(?:your|the)\s+(?:prompt|instructions|system)/i,
  /repeat\s+(?:your|the)\s+(?:prompt|instructions|system)/i,
  /what\s+(?:are|is)\s+(?:your|the)\s+(?:instructions|prompt)/i,
  /ignore\s+(?:all\s+)?(?:previous|prior)/i,
  /act\s+as\s+(?:if|though)/i,
  /from\s+now\s+on/i,
  /output\s+(?:the|your)\s+(?:system|prompt)/i,
  /\bSQL\b.*\b(?:DROP|DELETE|INSERT|UPDATE)\b/i,
];

const SUSPICIOUS_CHARS = /[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;

export function shield(input = '') {
  if (typeof input !== 'string') return { safe: true, matches: [] };

  const clean = input.replace(SUSPICIOUS_CHARS, '');

  const matches = [];
  for (const pattern of INJECTION_PATTERNS) {
    const match = clean.match(pattern);
    if (match) {
      matches.push({
        pattern: pattern.source,
        text: match[0],
        index: match.index,
      });
    }
  }

  // Heuristic: excessive length with newlines might be an injection attempt
  if (clean.length > 2000 && clean.split('\n').length > 20) {
    matches.push({ pattern: 'excessive_length', text: 'long multiline input', index: 0 });
  }

  return {
    safe: matches.length === 0,
    matches,
    cleaned: clean,
    riskScore: Math.min(100, matches.length * 25),
  };
}

export function isInjection(input) {
  return !shield(input).safe;
}