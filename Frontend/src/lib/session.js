const TOKEN_KEY = 'imessage_jwt_token';
const USER_KEY = 'imessage_auth_user';

/**
 * Check if running in browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * Safely parse base64url string to JSON
 */
function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Store JWT token and user profile in localStorage
 * @param {string} token - Signed JWT token
 * @param {Object} user - User profile object
 */
export function saveSession(token, user) {
  if (!isBrowser) return;

  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, String(token).trim());
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    // Broadcast session update across components and tabs
    window.dispatchEvent(
      new CustomEvent('imessage_session_changed', {
        detail: { token, user, isAuthenticated: true },
      })
    );
  } catch (err) {
    console.error('[Session] Failed to save session:', err);
  }
}

/**
 * Retrieve current JWT token and user profile
 * @returns {{ token: string | null, user: Object | null }}
 */
export function getSession() {
  return {
    token: getToken(),
    user: getCurrentUser(),
  };
}

/**
 * Clear stored token and user, logging the user out
 */
export function clearSession() {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    window.dispatchEvent(
      new CustomEvent('imessage_session_changed', {
        detail: { token: null, user: null, isAuthenticated: false },
      })
    );
  } catch (err) {
    console.error('[Session] Failed to clear session:', err);
  }
}

/**
 * Get stored JWT token
 * @returns {string | null}
 */
export function getToken() {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Get stored user profile object
 * @returns {Object | null}
 */
export function getCurrentUser() {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[Session] Failed to parse user profile:', err);
    return null;
  }
}

/**
 * Check if a valid, unexpired session exists
 * @returns {boolean}
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload) {
    // If token exists but payload cannot be parsed, allow if token is present
    return true;
  }

  // Check expiration if exp claim is present
  if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
    clearSession();
    return false;
  }

  return true;
}

/**
 * Update partial fields in stored user profile
 * @param {Object} partialUser - New fields to merge
 * @returns {Object | null} Updated user
 */
export function updateCurrentUser(partialUser) {
  if (!isBrowser || !partialUser) return null;
  try {
    const current = getCurrentUser() || {};
    const updated = { ...current, ...partialUser };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));

    window.dispatchEvent(
      new CustomEvent('imessage_session_changed', {
        detail: { token: getToken(), user: updated, isAuthenticated: true },
      })
    );
    return updated;
  } catch (err) {
    console.error('[Session] Failed to update user profile:', err);
    return null;
  }
}

/**
 * Generate standard HTTP Authorization headers for fetch requests
 * @param {Object} [extraHeaders={}]
 * @returns {Object} Headers object
 */
export function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export default {
  saveSession,
  getSession,
  clearSession,
  isAuthenticated,
  getToken,
  getCurrentUser,
  updateCurrentUser,
  getAuthHeaders,
};
