/**
 * In-memory session store. Session id in cookie; token and identity stored server-side.
 */

const sessions = new Map();

/**
 * @param {{ access_token: string, login: string, scope?: string }} data
 * @returns {string} session id
 */
export function createSession(data) {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  sessions.set(id, {
    ...data,
    created_at: new Date().toISOString(),
  });
  return id;
}

/**
 * @param {string} id
 * @returns {{ access_token: string, login: string, scope?: string, created_at: string } | undefined}
 */
export function getSession(id) {
  return sessions.get(id);
}

/**
 * @param {string} id
 */
export function destroySession(id) {
  sessions.delete(id);
}

const oauthStates = new Map();

/** Store OAuth state by short id (id goes in cookie; state is sent to GitHub). */
export function setOAuthState(id, state) {
  oauthStates.set(id, state);
}

/** Retrieve and consume OAuth state. */
export function getAndRemoveOAuthState(id) {
  const state = oauthStates.get(id);
  if (state) oauthStates.delete(id);
  return state ?? null;
}
