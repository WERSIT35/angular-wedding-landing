import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomId, signToken, verifyPassword, verifyToken } from './lib/crypto.mjs';
import { appendAuditLog, loadStore, saveStore } from './lib/store.mjs';
import { generateRecoveryCodes, generateTotpSecret, getOtpAuthUrl, verifyTotp } from './lib/totp.mjs';

const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
const CORS_ORIGINS = new Set([FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:3000']);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_DIR = path.resolve(__dirname, '../public/admin');
const AUTH_RATE_LIMIT = {
  windowMs: 60_000,
  maxAttempts: 8
};
const authAttempts = new Map();

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' http://localhost:4000; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
}

function sendJson(req, res, statusCode, payload) {
  const origin = req.headers.origin;
  const allowOrigin = origin && CORS_ORIGINS.has(origin) ? origin : '*';
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    Vary: 'Origin'
  });
  res.end(JSON.stringify(payload));
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function serveAdminAsset(req, res, pathname) {
  const target = pathname === '/admin' || pathname === '/admin/'
    ? path.join(ADMIN_DIR, 'index.html')
    : path.join(ADMIN_DIR, pathname.replace('/admin/', ''));
  const normalized = path.normalize(target);
  if (!normalized.startsWith(ADMIN_DIR) || !fs.existsSync(normalized)) {
    return false;
  }

  const ext = path.extname(normalized).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8'
  };

  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(normalized));
  return true;
}

function getAuthUser(req, store) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length);
  const tokenCheck = verifyToken(token, store.jwtSecret);
  if (!tokenCheck.valid) {
    return null;
  }

  const userId = tokenCheck.payload.sub;
  return store.users.find((user) => user.id === userId) || null;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt
  };
}

function withCors(req, res) {
  setSecurityHeaders(res);
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Vary', 'Origin');
}

function checkRateLimit(key) {
  const now = Date.now();
  const current = authAttempts.get(key) || [];
  const recent = current.filter((ts) => now - ts <= AUTH_RATE_LIMIT.windowMs);
  if (recent.length >= AUTH_RATE_LIMIT.maxAttempts) {
    authAttempts.set(key, recent);
    return false;
  }
  recent.push(now);
  authAttempts.set(key, recent);
  return true;
}

const server = http.createServer(async (req, res) => {
  withCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  try {
    if (url.pathname === '/admin') {
      res.writeHead(302, { Location: '/admin/' });
      res.end();
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/admin')) {
      if (serveAdminAsset(req, res, url.pathname)) {
        return;
      }
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(req, res, 200, { ok: true, service: 'elite-backend' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/public/content') {
      const store = loadStore();
      sendJson(req, res, 200, { content: store.content });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/auth/login') {
      const ipKey = req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(`login:${ipKey}`)) {
        sendJson(req, res, 429, { error: 'Too many attempts. Try again in a minute.' });
        return;
      }

      const store = loadStore();
      const body = await getRequestBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      const user = store.users.find((item) => item.email === email);
      if (!user) {
        sendJson(req, res, 401, { error: 'Invalid credentials' });
        return;
      }

      const passwordValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
      if (!passwordValid) {
        sendJson(req, res, 401, { error: 'Invalid credentials' });
        return;
      }

      if (user.mfaEnabled) {
        const tempToken = signToken({ sub: user.id, type: 'mfa-temp' }, store.jwtSecret, 300);
        sendJson(req, res, 200, { mfaRequired: true, tempToken });
        return;
      }

      const accessToken = signToken({ sub: user.id, role: 'admin' }, store.jwtSecret, 60 * 60 * 12);
      appendAuditLog({ action: 'login', userId: user.id, metadata: { mfa: false } });
      sendJson(req, res, 200, { accessToken, user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/auth/mfa/verify') {
      const ipKey = req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(`mfa:${ipKey}`)) {
        sendJson(req, res, 429, { error: 'Too many attempts. Try again in a minute.' });
        return;
      }

      const store = loadStore();
      const body = await getRequestBody(req);
      const tempToken = String(body.tempToken || '');
      const code = String(body.code || '').trim();

      const tokenCheck = verifyToken(tempToken, store.jwtSecret);
      if (!tokenCheck.valid || tokenCheck.payload.type !== 'mfa-temp') {
        sendJson(req, res, 401, { error: 'Invalid MFA session' });
        return;
      }

      const user = store.users.find((item) => item.id === tokenCheck.payload.sub);
      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        sendJson(req, res, 401, { error: 'MFA is not configured' });
        return;
      }

      let valid = verifyTotp(user.mfaSecret, code);
      if (!valid) {
        const idx = user.recoveryCodes.indexOf(code.toUpperCase());
        if (idx >= 0) {
          valid = true;
          user.recoveryCodes.splice(idx, 1);
          saveStore(store);
        }
      }

      if (!valid) {
        sendJson(req, res, 401, { error: 'Invalid code' });
        return;
      }

      const accessToken = signToken({ sub: user.id, role: 'admin' }, store.jwtSecret, 60 * 60 * 12);
      appendAuditLog({ action: 'login', userId: user.id, metadata: { mfa: true } });
      sendJson(req, res, 200, { accessToken, user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/auth/mfa/setup') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      const secret = generateTotpSecret();
      const recoveryCodes = generateRecoveryCodes();
      user.mfaSecret = secret;
      user.mfaEnabled = true;
      user.recoveryCodes = recoveryCodes;
      saveStore(store);

      appendAuditLog({ action: 'mfa_setup', userId: user.id, metadata: {} });

      sendJson(req, res, 200, {
        secret,
        recoveryCodes,
        otpauthUrl: getOtpAuthUrl({
          issuer: 'Elite Weddings Admin',
          accountName: user.email,
          secret
        })
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/content') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      sendJson(req, res, 200, { content: store.content });
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/api/admin/content') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      const body = await getRequestBody(req);
      if (typeof body.content !== 'object' || body.content === null) {
        sendJson(req, res, 400, { error: 'Invalid content payload' });
        return;
      }

      store.content = body.content;
      saveStore(store);

      appendAuditLog({
        action: 'content_update',
        userId: user.id,
        metadata: { contentKeys: Object.keys(body.content) }
      });

      sendJson(req, res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/audit') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      sendJson(req, res, 200, { logs: store.auditLogs.slice(-100).reverse() });
      return;
    }

    sendJson(req, res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(req, res, 500, { error: error instanceof Error ? error.message : 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`[backend] running on http://localhost:${PORT}`);
});
