// ThrottleWall — client-side rate limiting for AI endpoints
// Mirrors DRF throttling; prevents abuse

const KEY = 'chuttee-throttle';
const DEFAULT_LIMITS = {
  'ai:chat': { window: 60_000, max: 20 },      // 20 per minute
  'ai:run': { window: 60_000, max: 10 },       // 10 per minute
  'ai:search': { window: 60_000, max: 30 },    // 30 per minute
  'auth:login': { window: 300_000, max: 5 },   // 5 per 5 min
};

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function check(action, limits = DEFAULT_LIMITS) {
  const limit = limits[action] || { window: 60_000, max: 30 };
  const now = Date.now();
  const store = load();
  const entry = store[action] || { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < limit.window);

  if (entry.timestamps.length >= limit.max) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((limit.window - (now - oldest)) / 1000);
    return {
      allowed: false,
      retryAfter,
      remaining: 0,
      limit: limit.max,
      window: limit.window,
    };
  }

  entry.timestamps.push(now);
  store[action] = entry;
  save(store);

  return {
    allowed: true,
    retryAfter: 0,
    remaining: limit.max - entry.timestamps.length,
    limit: limit.max,
    window: limit.window,
  };
}

export function reset(action) {
  const store = load();
  if (action) delete store[action];
  else Object.keys(store).forEach((k) => delete store[k]);
  save(store);
}