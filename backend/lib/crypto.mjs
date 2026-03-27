import crypto from 'node:crypto';

const HEADER = { alg: 'HS256', typ: 'JWT' };

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signToken(payload, secret, expiresInSeconds = 60 * 60 * 12) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const headerEncoded = base64url(JSON.stringify(HEADER));
  const payloadEncoded = base64url(JSON.stringify(body));
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

export function verifyToken(token, secret) {
  const [headerEncoded, payloadEncoded, signature] = token.split('.');
  if (!headerEncoded || !payloadEncoded || !signature) {
    return { valid: false, reason: 'Malformed token' };
  }

  const data = `${headerEncoded}.${payloadEncoded}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { valid: false, reason: 'Invalid signature' };
  }

  try {
    const payload = JSON.parse(decodeBase64url(payloadEncoded));
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || now > payload.exp) {
      return { valid: false, reason: 'Token expired' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'Invalid payload' };
  }
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const hashed = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hashed, 'hex'), Buffer.from(hash, 'hex'));
}

export function randomId() {
  return crypto.randomUUID();
}
