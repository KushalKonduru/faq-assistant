/**
 * Client session management for zero-login, privacy-isolated document workspaces.
 * Generates a cryptographically strong UUID v4 persisted in localStorage.
 */

const SESSION_KEY = 'contextsense_session_id';

export function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${crypto.randomUUID()}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetSession() {
  const newSessionId = `sess_${crypto.randomUUID()}`;
  localStorage.setItem(SESSION_KEY, newSessionId);
  return newSessionId;
}
