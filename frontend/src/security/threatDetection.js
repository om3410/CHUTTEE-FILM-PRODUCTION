// ThreatDetection — client-side anomaly detection for login patterns
// (SentinelAI's frontend counterpart)

const KEY = 'chuttee-threat-log';
const MAX_EVENTS = 100;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function save(events) {
  localStorage.setItem(KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function recordLogin(success, meta = {}) {
  const events = load();
  events.push({
    timestamp: Date.now(),
    success,
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...meta,
  });
  save(events);
  return analyze(events);
}

export function analyze(events = load()) {
  const now = Date.now();
  const last24h = events.filter((e) => now - e.timestamp < 24 * 60 * 60 * 1000);

  const failures = last24h.filter((e) => !e.success).length;
  const successes = last24h.filter((e) => e.success).length;

  const anomalies = [];

  if (failures >= 3) {
    anomalies.push({
      type: 'brute_force',
      severity: failures >= 5 ? 'High' : 'Medium',
      detail: `${failures} failed login attempts in 24h`,
    });
  }

  // Check for rapid success after multiple failures
  const last5 = events.slice(-5);
  const rapidFails = last5.filter((e) => !e.success).length;
  if (rapidFails >= 3 && last5[last5.length - 1]?.success) {
    anomalies.push({
      type: 'suspicious_success',
      severity: 'High',
      detail: 'Successful login after 3+ recent failures',
    });
  }

  // New user-agent heuristic
  const knownUA = new Set(events.slice(0, -1).map((e) => e.userAgent));
  if (knownUA.size > 0 && !knownUA.has(navigator.userAgent)) {
    anomalies.push({
      type: 'new_device',
      severity: 'Medium',
      detail: 'Login from a new browser/device',
    });
  }

  return {
    totalEvents: last24h.length,
    failures,
    successes,
    anomalies,
    riskScore: Math.min(100, anomalies.reduce((sum, a) => sum + (a.severity === 'High' ? 40 : 20), 0)),
  };
}

export function getEvents() {
  return load().reverse();
}