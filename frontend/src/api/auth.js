import api from './client';

const ACCESS_KEY = 'chuttee-token';
const REFRESH_KEY = 'chuttee-refresh';
const USER_KEY = 'chuttee-user';

/* ═══════════════════════════════════════════════════════
   SIGN IN
   ═══════════════════════════════════════════════════════ */

export async function authenticate(username, password) {
  // Backend JWT endpoint (accepts username OR email in the username field)
  const { data } = await api.post('/token/', { username, password });

  if (!data.access) {
    throw new Error('No access token returned from server.');
  }

  localStorage.setItem(ACCESS_KEY, data.access);
  if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);

  // Fetch user profile
  let user;
  try {
    const { data: me } = await api.get('/auth/api/me/');
    user = me;
  } catch {
    user = { username };
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return {
    token: data.access,
    refresh: data.refresh,
    user,
  };
}

/* ═══════════════════════════════════════════════════════
   REGISTER
   ═══════════════════════════════════════════════════════ */

/**
 * Register a new user (no auto-login).
 * Backend endpoint: POST /api/auth/api/register/
 */
export async function register(payload) {
  const { data } = await api.post('/auth/api/register/', payload);
  return data;
}

/**
 * Register a new user AND immediately authenticate them.
 * Backend endpoint: POST /api/auth/api/register/
 * Then POST /api/token/ (auto-login)
 *
 * This is what Register.jsx calls. It preserves the same
 * return shape as `authenticate()`: { token, user }.
 */
export async function registerAndAuthenticate(payload) {
  // Step 1: create account
  const registerResp = await api.post('/auth/api/register/', payload);
  const registerData = registerResp.data || {};

  // Step 2: derive credentials for login
  const loginUsername =
    registerData.username ||
    payload.username ||
    payload.email;

  const loginPassword = payload.password;

  if (!loginUsername || !loginPassword) {
    throw new Error(
      'Registration succeeded but auto-login failed: missing credentials.'
    );
  }

  // Step 3: obtain JWT
  const { data: tokenData } = await api.post('/token/', {
    username: loginUsername,
    password: loginPassword,
  });

  if (!tokenData.access) {
    throw new Error(
      'Account created but no access token returned from server.'
    );
  }

  localStorage.setItem(ACCESS_KEY, tokenData.access);
  if (tokenData.refresh) {
    localStorage.setItem(REFRESH_KEY, tokenData.refresh);
  }

  // Step 4: fetch user profile
  let user;
  try {
    const { data: me } = await api.get('/auth/api/me/');
    user = me;
  } catch {
    user = registerData.user || { username: loginUsername };
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return {
    token: tokenData.access,
    refresh: tokenData.refresh,
    user,
  };
}

/* ═══════════════════════════════════════════════════════
   SESSION
   ═══════════════════════════════════════════════════════ */

export async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new Error('No refresh token');

  const { data } = await api.post('/token/refresh/', { refresh });
  if (data.access) {
    localStorage.setItem(ACCESS_KEY, data.access);
  }
  return data.access;
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/api/me/');
  return data;
}

export function logout() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ═══════════════════════════════════════════════════════
   PROFILE
   ═══════════════════════════════════════════════════════ */

export async function updateProfile(payload) {
  const { data } = await api.patch('/auth/api/me/', payload);

  try {
    const stored = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    const merged = { ...stored, ...data };
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
  } catch {}

  return data;
}

/* ═══════════════════════════════════════════════════════
   PASSWORD RECOVERY (NEW — fixes AccountRecovery + ResetPassword)
   ═══════════════════════════════════════════════════════ */

/**
 * Request a password-reset email.
 * Backend endpoint: POST /api/auth/api/account-recovery/
 * Payload: { email }
 */
export async function requestAccountRecovery(email) {
  const { data } = await api.post('/auth/api/account-recovery/', { email });
  return data;
}

/**
 * Confirm a password reset with the token from the email.
 * Backend endpoint: POST /api/auth/api/password-reset/confirm/
 * Payload: { uid, token, password }
 */
export async function confirmPasswordReset(uid, token, password) {
  const { data } = await api.post('/auth/api/password-reset/confirm/', {
    uid,
    token,
    password,
  });
  return data;
}

/* ═══════════════════════════════════════════════════════
   ERROR HELPER
   ═══════════════════════════════════════════════════════ */

export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;

  const data = error.response?.data;
  if (!data) return error.message || fallback;

  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;

  if (typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const firstVal = data[firstKey];
    if (Array.isArray(firstVal)) return firstVal[0];
    if (typeof firstVal === 'string') return firstVal;
  }

  return fallback;
}