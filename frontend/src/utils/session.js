/**
 * Client session management for zero-login, privacy-isolated document workspaces.
 * Uses sessionStorage so document workspaces are strictly scoped to the active
 * browser tab/window and automatically destroyed when the browser is closed.
 */

const SESSION_KEY = 'contextsense_session_id';

// Clean up any legacy persistent localStorage key to ensure complete privacy
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(SESSION_KEY);
  }
} catch {
  // Ignore in environments without localStorage
}

export function getSessionId() {
  if (typeof window === 'undefined') return null;

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${crypto.randomUUID()}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetSession() {
  if (typeof window === 'undefined') return null;

  const newSessionId = `sess_${crypto.randomUUID()}`;
  sessionStorage.setItem(SESSION_KEY, newSessionId);
  return newSessionId;
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

