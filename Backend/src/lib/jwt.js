import crypto from 'crypto';

const DEFAULT_SECRET = process.env.JWT_SECRET || 'imessage-secret-key-2024';

/**
 * Base64URL string encoder
 */
function base64UrlEncode(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL string decoder
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Create a signed JWT using Node.js crypto HMAC-SHA256
 * @param {Object} payload - Data payload to encode
 * @param {string} [secret] - HMAC secret key
 * @param {number} [expiresInSeconds=604800] - Expiration duration in seconds (default 7 days)
 * @returns {string} Signed JWT token
 */
export function sign(payload, secret = DEFAULT_SECRET, expiresInSeconds = 7 * 24 * 3600) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + Number(expiresInSeconds);

  const fullPayload = {
    ...payload,
    iat,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signatureInput);
  const signature = base64UrlEncode(hmac.digest());

  return `${signatureInput}.${signature}`;
}

/**
 * Verify and decode a JWT using Node.js crypto HMAC-SHA256
 * @param {string} token - Signed JWT token
 * @param {string} [secret] - HMAC secret key
 * @returns {Object} Decoded payload
 */
export function verify(token, secret = DEFAULT_SECRET) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is missing or not a string');
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signatureInput);
  const expectedSignature = base64UrlEncode(hmac.digest());

  // Timing safe comparison to protect against timing attacks
  const sigBuf = Buffer.from(signature);
  const expSigBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
    throw new Error('Invalid token signature');
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw new Error('Malformed token payload');
  }

  // Expiration check
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token has expired');
  }

  return payload;
}

/**
 * Express middleware to authenticate requests via Authorization header
 */
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid',
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing',
      });
    }

    const decoded = verify(token, DEFAULT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed: Invalid or expired token',
    });
  }
}

/**
 * Optional Express middleware: extracts user if token exists, continues if not
 */
export function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string') {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();
      if (token) {
        req.user = verify(token, DEFAULT_SECRET);
      }
    }
  } catch {
    // Optional, ignore errors and continue as unauthenticated
  }
  return next();
}

export default {
  sign,
  verify,
  authMiddleware,
  optionalAuthMiddleware,
};
