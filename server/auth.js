import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Admin authentication for the Results CMS.
 *
 * Deliberately independent of the main site's user login: this is a private
 * ops panel gated by a single shared password (ADMIN_PASSWORD). A successful
 * login returns a stateless HMAC-signed session token — no server-side session
 * store, so it survives restarts and scales trivially.
 *
 * Token format: base64url(`<expiryMs>.<hmac>`), where hmac = HMAC-SHA256(secret,
 * expiryMs). We only need to prove "the server minted this and it hasn't
 * expired", so the payload is just the expiry.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    throw new Error('ADMIN_SESSION_SECRET is not set — refusing to sign tokens.');
  }
  return s;
}

function sign(expiryMs) {
  return createHmac('sha256', secret()).update(String(expiryMs)).digest('hex');
}

/** Mint a session token valid for TOKEN_TTL_MS. */
export function issueToken() {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const raw = `${expiry}.${sign(expiry)}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

/** Verify a token: correct signature and not expired. */
export function verifyToken(token) {
  if (!token) return false;
  let raw;
  try {
    raw = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return false;
  }
  const dot = raw.indexOf('.');
  if (dot === -1) return false;
  const expiry = Number(raw.slice(0, dot));
  const mac = raw.slice(dot + 1);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;
  const expected = sign(expiry);
  if (mac.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Constant-time password check against ADMIN_PASSWORD. */
export function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(candidate ?? ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Express middleware: require a valid admin bearer token. */
export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) {
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Admin login required' } });
  }
  next();
}
