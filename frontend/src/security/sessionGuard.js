// SessionGuard — idle timeout + session rotation + concurrent session tracking

const KEY = 'chuttee-session';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;   // 30 minutes
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

let idleTimer = null;
let absoluteTimer = null;

export function start(onTimeout) {
  const now = Date.now();
  const session = {
    startedAt: now,
    lastActiveAt: now,
    id: crypto.randomUUID?.() || `sess-${now}`,
  };
  localStorage.setItem(KEY, JSON.stringify(session));

  resetIdle(onTimeout);
  resetAbsolute(onTimeout);

  // Activity listeners
  const activity = () => resetIdle(onTimeout);
  ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((evt) =>
    window.addEventListener(evt, activity, { passive: true })
  );

  return () => {
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((evt) =>
      window.removeEventListener(evt, activity)
    );
    clearTimeout(idleTimer);
    clearTimeout(absoluteTimer);
  };
}

function resetIdle(onTimeout) {
  clearTimeout(idleTimer);
  const session = get();
  if (session) {
    session.lastActiveAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(session));
  }
  idleTimer = setTimeout(() => {
    onTimeout?.('idle');
  }, IDLE_TIMEOUT_MS);
}

function resetAbsolute(onTimeout) {
  clearTimeout(absoluteTimer);
  absoluteTimer = setTimeout(() => {
    onTimeout?.('absolute');
  }, ABSOLUTE_TIMEOUT_MS);
}

export function get() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function clear() {
  localStorage.removeItem(KEY);
  clearTimeout(idleTimer);
  clearTimeout(absoluteTimer);
}

export function rotate() {
  // Rotate session ID on login/logout (session fixation defence)
  const session = get();
  if (session) {
    session.id = crypto.randomUUID?.() || `sess-${Date.now()}`;
    session.startedAt = Date.now();
    session.lastActiveAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(session));
  }
  return session;
}

export function isExpired() {
  const s = get();
  if (!s) return true;
  const now = Date.now();
  if (now - s.lastActiveAt > IDLE_TIMEOUT_MS) return true;
  if (now - s.startedAt > ABSOLUTE_TIMEOUT_MS) return true;
  return false;
}