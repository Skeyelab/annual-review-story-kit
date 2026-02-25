import { createHmac } from "crypto";

const COOKIE_NAME = "ar_session";

/**
 * @param {string} id
 * @param {string} secret
 * @returns {string}
 */
export function signSessionId(id, secret) {
  const sig = createHmac("sha256", secret).update(id).digest("hex");
  return `${id}.${sig}`;
}

/**
 * @param {string} value
 * @param {string} secret
 * @returns {string | null}
 */
export function verifySessionId(value, secret) {
  if (!value || typeof value !== "string") return null;
  const i = value.lastIndexOf(".");
  if (i <= 0) return null;
  const id = value.slice(0, i);
  const sig = value.slice(i + 1);
  const expected = createHmac("sha256", secret).update(id).digest("hex");
  return sig === expected ? id : null;
}

/**
 * @param {{ headers?: { cookie?: string } }} req
 * @param {string} secret
 * @returns {string | null}
 */
export function getSessionIdFromRequest(req, secret) {
  const cookie = req?.headers?.cookie;
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1].trim());
  return verifySessionId(value, secret);
}

/**
 * @param {{ setHeader: (k: string, v: string) => void }} res
 * @param {string} sessionId
 * @param {string} secret
 * @param {{ secure?: boolean, maxAge?: number }} opts
 */
export function setSessionCookie(res, sessionId, secret, opts = {}) {
  const value = signSessionId(sessionId, secret);
  const secure = opts.secure ?? false;
  const maxAge = opts.maxAge ?? 60 * 60 * 24 * 7; // 7 days
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

/**
 * @param {{ setHeader: (k: string, v: string) => void }} res
 */
export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

const STATE_COOKIE = "ar_oauth_state";

/**
 * @param {{ setHeader: (k: string, v: string) => void }} res
 * @param {string} state
 */
export function setStateCookie(res, state) {
  res.setHeader(
    "Set-Cookie",
    `${STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );
}

/**
 * @param {{ headers?: { cookie?: string } }} req
 * @returns {string | null}
 */
export function getStateFromRequest(req) {
  const cookie = req?.headers?.cookie;
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${STATE_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1].trim()) : null;
}
