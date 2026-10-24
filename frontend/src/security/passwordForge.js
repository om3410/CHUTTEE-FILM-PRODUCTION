// PasswordForge — strength meter + breach pattern check (client-side)

const COMMON_PASSWORDS = [
  'password', '123456', 'qwerty', 'admin', 'letmein',
  'welcome', 'monkey', 'dragon', 'master', 'sunshine',
  'princess', 'football', 'baseball', 'abc123', 'password1',
];

const PATTERNS = [
  { regex: /(.)\1{2,}/, message: 'No 3+ repeated characters' },
  { regex: /12345|54321|qwerty|asdfg/, message: 'No keyboard sequences' },
  { regex: /^[a-z]+$/, message: 'Mix uppercase and lowercase' },
  { regex: /^[A-Z]+$/, message: 'Mix uppercase and lowercase' },
  { regex: /^\d+$/, message: 'Add letters' },
];

export function strength(password = '') {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    noCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
    noPattern: !PATTERNS.some((p) => p.regex.test(password)),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;
  const percent = Math.round((score / maxScore) * 100);

  let label = 'Very Weak';
  if (percent >= 90) label = 'Very Strong';
  else if (percent >= 75) label = 'Strong';
  else if (percent >= 50) label = 'Fair';
  else if (percent >= 30) label = 'Weak';

  const issues = [];
  if (!checks.length) issues.push('Use at least 12 characters');
  if (!checks.uppercase) issues.push('Add uppercase letters');
  if (!checks.lowercase) issues.push('Add lowercase letters');
  if (!checks.number) issues.push('Add numbers');
  if (!checks.symbol) issues.push('Add symbols');
  if (!checks.noCommon) issues.push('Avoid common passwords');
  if (!checks.noPattern) issues.push('Avoid obvious patterns');

  return { score, maxScore, percent, label, checks, issues };
}

export function generate(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}