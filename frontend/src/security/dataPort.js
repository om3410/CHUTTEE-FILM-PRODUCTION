// DataPort — export all user data (GDPR-style) + right to erasure

export function exportAll() {
  const data = {
    exportedAt: new Date().toISOString(),
    user: JSON.parse(localStorage.getItem('chuttee-user') || 'null'),
    authToken: localStorage.getItem('chuttee-token') ? '[REDACTED]' : null,
    theme: localStorage.getItem('chuttee-theme'),
    auditLog: JSON.parse(localStorage.getItem('chuttee-audit-log') || '[]'),
    threatLog: JSON.parse(localStorage.getItem('chuttee-threat-log') || '[]'),
    savedSearches: JSON.parse(localStorage.getItem('chuttee-saved-searches') || '[]'),
    session: JSON.parse(localStorage.getItem('chuttee-session') || 'null'),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chuttee-data-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return data;
}

export function eraseAll() {
  const keys = [
    'chuttee-token', 'chuttee-user', 'chuttee-theme', 'chuttee-ui',
    'chuttee-project', 'chuttee-audit-log', 'chuttee-threat-log',
    'chuttee-saved-searches', 'chuttee-session', 'chuttee-throttle',
    'chuttee-crypt-key',
  ];
  keys.forEach((k) => localStorage.removeItem(k));
  sessionStorage.clear();
}