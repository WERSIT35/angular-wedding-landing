import http from 'node:http';
import { hashPassword, randomId, signToken, verifyPassword, verifyToken } from './lib/crypto.mjs';
import { appendAuditLog, loadStore, saveStore } from './lib/store.mjs';
import { generateRecoveryCodes, generateTotpSecret, getOtpAuthUrl, verifyTotp } from './lib/totp.mjs';

const PORT = Number(process.env.PORT || 4000);
const INQUIRY_TARGET_EMAIL = 'Eliteweddingsandeventsco1@gmail.com';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
const CORS_ORIGINS = new Set([FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:3000']);
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

function normalizeEmail(input) {
  return String(input || '').trim().toLowerCase();
}

function normalizeText(input) {
  return String(input || '').trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildInquiryBody(inquiry, labels) {
  const notProvided = 'Not provided';
  const safe = (value) => {
    const normalized = normalizeText(value);
    return normalized.length > 0 ? normalized : notProvided;
  };

  return [
    'Website RSVP - Elite Weddings & Events Co.',
    '',
    `${labels.name}: ${safe(inquiry.name)}`,
    `${labels.email}: ${safe(inquiry.email)}`,
    `${labels.phone}: ${safe(inquiry.phone)}`,
    `${labels.weddingType}: ${safe(inquiry.weddingType)}`,
    `${labels.date}: ${safe(inquiry.date)}`,
    `${labels.guests}: ${safe(inquiry.guests)}`,
    `${labels.location}: ${safe(inquiry.location)}`,
    `${labels.budget}: ${safe(inquiry.budget)}`,
    `${labels.plusOne}: ${safe(inquiry.plusOne)}`,
    `${labels.dietary}: ${safe(inquiry.dietary)}`,
    `${labels.message}:`,
    safe(inquiry.message)
  ].join('\n');
}

function buildInquiryHtml(inquiry, labels, channel) {
  const notProvided = 'Not provided';
  const safe = (value) => {
    const normalized = normalizeText(value);
    return escapeHtml(normalized.length > 0 ? normalized : notProvided);
  };

  const submittedAt = escapeHtml(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Tbilisi' }));
  const safeChannel = escapeHtml(channel === 'whatsapp' ? 'WhatsApp' : 'Email');
  const replyEmail = encodeURIComponent(normalizeText(inquiry.email));
  const replySubject = encodeURIComponent('Re: Your Elite Weddings inquiry');
  const whatsappDigits = normalizeText(inquiry.phone).replace(/[^\d+]/g, '');
  const whatsappUrl = whatsappDigits.length > 0 ? `https://wa.me/${encodeURIComponent(whatsappDigits)}` : '';

  const rows = [
    [labels.name, inquiry.name],
    [labels.email, inquiry.email],
    [labels.phone, inquiry.phone],
    [labels.weddingType, inquiry.weddingType],
    [labels.date, inquiry.date],
    [labels.guests, inquiry.guests],
    [labels.location, inquiry.location],
    [labels.budget, inquiry.budget],
    [labels.plusOne, inquiry.plusOne],
    [labels.dietary, inquiry.dietary]
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:11px 13px;border-bottom:1px solid #efe2d1;color:#5f5147;font-size:13px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:11px 13px;border-bottom:1px solid #efe2d1;color:#1d1815;font-size:14px;vertical-align:top;font-weight:600;">${safe(value)}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
      @media only screen and (max-width: 640px) {
        .email-card { border-radius: 14px !important; }
        .email-pad { padding-left: 16px !important; padding-right: 16px !important; }
        .email-title { font-size: 28px !important; }
        .email-actions td { display: block !important; width: 100% !important; padding-bottom: 10px !important; }
      }
    </style>
  </head>
  <body style="margin:0;background:#f8f3ee;font-family:'Montserrat',Arial,sans-serif;color:#1d1815;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 10px;background:radial-gradient(circle at 0% 0%,rgba(232,207,174,0.36),transparent 35%),linear-gradient(180deg,#fbf7f2 0%,#f5ede5 100%);">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-card" style="max-width:720px;background:#fffdfb;border-radius:20px;border:1px solid #ead7d6;overflow:hidden;box-shadow:0 14px 34px rgba(29,24,21,0.11);">
            <tr>
              <td class="email-pad" style="padding:24px 26px;background:linear-gradient(135deg,#f2ddbf 0%,#e8cfae 56%,#b48b5a 100%);color:#1d1815;border-bottom:1px solid rgba(29,24,21,0.08);">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;opacity:0.78;">Elite Weddings & Events Co.</div>
                <h1 class="email-title" style="margin:10px 0 0 0;font-family:'Playfair Display','Times New Roman',serif;font-size:34px;line-height:1.1;font-weight:600;">New RSVP Inquiry</h1>
                <p style="margin:10px 0 0 0;font-size:13px;opacity:0.84;">A new lead was submitted from your website intake slider.</p>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:18px 26px 8px 26px;">
                <p style="margin:0 0 8px 0;font-size:14px;color:#5f5147;">
                  Submitted via <strong>${safeChannel}</strong> on <strong>${submittedAt}</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:0 26px 8px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #efe2d1;border-radius:14px;overflow:hidden;background:#ffffff;">
                  ${rows}
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:8px 26px 14px 26px;">
                <div style="padding:14px 16px;background:linear-gradient(180deg,#fffdfb,#f9f4ee);border:1px solid #efe2d1;border-radius:14px;">
                  <div style="font-size:11px;color:#5f5147;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px;font-weight:700;">${escapeHtml(labels.message)}</div>
                  <div style="white-space:pre-wrap;font-size:14px;line-height:1.65;color:#1d1815;">${safe(inquiry.message)}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:4px 26px 24px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-actions">
                  <tr>
                    <td style="padding-right:8px;">
                      <a href="mailto:${replyEmail}?subject=${replySubject}" style="display:block;text-align:center;padding:12px 14px;border-radius:999px;background:#1d1815;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.03em;">Reply by Email</a>
                    </td>
                    <td style="padding-left:8px;">
                      <a href="${whatsappUrl}" style="display:block;text-align:center;padding:12px 14px;border-radius:999px;background:linear-gradient(135deg,#f2ddbf,#e8cfae);color:#1d1815;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.03em;border:1px solid rgba(180,139,90,0.45);">Open WhatsApp</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding:0 26px 20px 26px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#7a6a5d;">This message was generated by your website inquiry flow.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function deliverInquiry(payload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const webhookUrl = process.env.INQUIRY_WEBHOOK_URL;

  if (resendApiKey) {
    const from = process.env.INQUIRY_FROM_EMAIL || 'onboarding@resend.dev';
    const to = payload.targetEmail;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject: payload.subject,
        text: payload.body,
        html: payload.html
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => 'unknown');
      throw new Error(`Email delivery failed: ${detail}`);
    }

    return { provider: 'resend' };
  }

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Webhook delivery failed.');
    }

    return { provider: 'webhook' };
  }

  console.log('[inquiry] delivery provider not configured; payload recorded only');
  console.log(`[inquiry] ${payload.subject}`);
  console.log(payload.body);
  return { provider: 'log-only' };
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      sendJson(req, res, 404, { error: 'Not found' });
      return;
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

    if (req.method === 'POST' && url.pathname === '/api/public/inquiry') {
      const ipKey = req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(`inquiry:${ipKey}`)) {
        sendJson(req, res, 429, { error: 'Too many attempts. Try again in a minute.' });
        return;
      }

      const body = await getRequestBody(req);
      const inquiry = body.inquiry && typeof body.inquiry === 'object' ? body.inquiry : null;
      const labels = body.labels && typeof body.labels === 'object' ? body.labels : null;
      const channel = normalizeText(body.channel).toLowerCase();
      const targetEmail = INQUIRY_TARGET_EMAIL;
      const targetWhatsApp = normalizeText(body.targetWhatsApp || '995595930899');

      if (!inquiry || !labels) {
        sendJson(req, res, 400, { error: 'Invalid inquiry payload.' });
        return;
      }

      if (!targetEmail.includes('@')) {
        sendJson(req, res, 400, { error: 'Invalid target email.' });
        return;
      }

      const requiredFields = ['name', 'email', 'phone', 'weddingType', 'date', 'guests', 'location', 'budget'];
      const missingField = requiredFields.find((field) => normalizeText(inquiry[field]).length === 0);
      if (missingField) {
        sendJson(req, res, 400, { error: `Missing required field: ${missingField}` });
        return;
      }

      const normalizedChannel = channel === 'whatsapp' ? 'whatsapp' : 'email';
      const subject = `Wedding Inquiry (${normalizedChannel}) - ${normalizeText(inquiry.name)}`;
      const messageBody = buildInquiryBody(inquiry, labels);
      const messageHtml = buildInquiryHtml(inquiry, labels, normalizedChannel);
      const delivery = await deliverInquiry({
        inquiry,
        labels,
        channel: normalizedChannel,
        targetEmail,
        targetWhatsApp,
        subject,
        body: messageBody,
        html: messageHtml,
        submittedAt: new Date().toISOString()
      });

      appendAuditLog({
        action: 'public_inquiry',
        userId: 'public',
        metadata: {
          channel: normalizedChannel,
          provider: delivery.provider,
          email: normalizeEmail(inquiry.email),
          targetEmail
        }
      });

      sendJson(req, res, 200, { ok: true, provider: delivery.provider });
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
      const email = normalizeEmail(body.email);
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

    if (req.method === 'GET' && url.pathname === '/api/admin/profile') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      sendJson(req, res, 200, { user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/api/admin/profile') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      const body = await getRequestBody(req);
      const nextEmail = normalizeEmail(body.email);
      const nextPassword = String(body.password || '');
      const oldPassword = String(body.oldPassword || '');

      if (nextEmail) {
        const emailInUse = store.users.some((item) => item.email === nextEmail && item.id !== user.id);
        if (emailInUse) {
          sendJson(req, res, 409, { error: 'Email already in use.' });
          return;
        }
        user.email = nextEmail;
      }

      if (nextPassword) {
        if (!oldPassword) {
          sendJson(req, res, 400, { error: 'Current password is required to set a new password.' });
          return;
        }
        const oldPasswordValid = verifyPassword(oldPassword, user.passwordSalt, user.passwordHash);
        if (!oldPasswordValid) {
          sendJson(req, res, 401, { error: 'Current password is incorrect.' });
          return;
        }
        if (nextPassword.length < 8) {
          sendJson(req, res, 400, { error: 'Password must be at least 8 characters.' });
          return;
        }
        const { salt, hash } = hashPassword(nextPassword);
        user.passwordSalt = salt;
        user.passwordHash = hash;
      }

      saveStore(store);
      appendAuditLog({ action: 'profile_update', userId: user.id, metadata: {} });
      sendJson(req, res, 200, { user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/users') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      sendJson(req, res, 200, { users: store.users.map((item) => sanitizeUser(item)) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/users') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      const body = await getRequestBody(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      if (!email || !email.includes('@')) {
        sendJson(req, res, 400, { error: 'Valid email is required.' });
        return;
      }
      if (password.length < 8) {
        sendJson(req, res, 400, { error: 'Password must be at least 8 characters.' });
        return;
      }
      if (store.users.some((item) => item.email === email)) {
        sendJson(req, res, 409, { error: 'User with this email already exists.' });
        return;
      }

      const { salt, hash } = hashPassword(password);
      const newUser = {
        id: randomId(),
        email,
        passwordSalt: salt,
        passwordHash: hash,
        mfaEnabled: false,
        mfaSecret: null,
        recoveryCodes: [],
        createdAt: new Date().toISOString()
      };

      store.users.push(newUser);
      saveStore(store);
      appendAuditLog({
        action: 'user_create',
        userId: user.id,
        metadata: { createdUserId: newUser.id, email: newUser.email }
      });
      sendJson(req, res, 201, { user: sanitizeUser(newUser) });
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/api/admin/users') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      const body = await getRequestBody(req);
      const targetId = String(body.id || '');
      const targetUser = store.users.find((item) => item.id === targetId);
      if (!targetUser) {
        sendJson(req, res, 404, { error: 'User not found.' });
        return;
      }

      const nextEmail = normalizeEmail(body.email);
      const nextPassword = String(body.password || '');

      if (nextEmail) {
        const emailInUse = store.users.some((item) => item.email === nextEmail && item.id !== targetUser.id);
        if (emailInUse) {
          sendJson(req, res, 409, { error: 'Email already in use.' });
          return;
        }
        targetUser.email = nextEmail;
      }

      if (nextPassword) {
        if (nextPassword.length < 8) {
          sendJson(req, res, 400, { error: 'Password must be at least 8 characters.' });
          return;
        }
        const { salt, hash } = hashPassword(nextPassword);
        targetUser.passwordSalt = salt;
        targetUser.passwordHash = hash;
      }

      if (typeof body.mfaEnabled === 'boolean' && body.mfaEnabled === false) {
        targetUser.mfaEnabled = false;
        targetUser.mfaSecret = null;
        targetUser.recoveryCodes = [];
      }

      saveStore(store);
      appendAuditLog({
        action: 'user_update',
        userId: user.id,
        metadata: { targetUserId: targetUser.id }
      });
      sendJson(req, res, 200, { user: sanitizeUser(targetUser) });
      return;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/admin/users') {
      const store = loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      const targetId = String(url.searchParams.get('id') || '');
      if (!targetId) {
        sendJson(req, res, 400, { error: 'User id is required.' });
        return;
      }

      if (targetId === user.id) {
        sendJson(req, res, 400, { error: 'You cannot delete your own active account.' });
        return;
      }

      if (store.users.length <= 1) {
        sendJson(req, res, 400, { error: 'Cannot delete the last admin user.' });
        return;
      }

      const index = store.users.findIndex((item) => item.id === targetId);
      if (index < 0) {
        sendJson(req, res, 404, { error: 'User not found.' });
        return;
      }

      const [removed] = store.users.splice(index, 1);
      saveStore(store);
      appendAuditLog({
        action: 'user_delete',
        userId: user.id,
        metadata: { targetUserId: targetId, targetEmail: removed.email }
      });
      sendJson(req, res, 200, { ok: true });
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
