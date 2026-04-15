import http from 'node:http';
import crypto from 'node:crypto';
import { hashPassword, randomId, signToken, verifyPassword, verifyToken } from './lib/crypto.mjs';
import { appendAuditLog, loadStore, saveStore } from './lib/store.mjs';
import { generateRecoveryCodes, generateTotpSecret, getOtpAuthUrl, verifyTotp } from './lib/totp.mjs';

const PORT = Number(process.env.PORT || 4000);
const INQUIRY_TARGET_EMAIL = 'Eliteweddingsandeventsco1@gmail.com';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
const CORS_ORIGINS = new Set([FRONTEND_ORIGIN, 'http://localhost:5173', 'http://localhost:3000']);
const ALLOW_DEV_ORIGINS = String(process.env.ALLOW_DEV_ORIGINS || 'false').toLowerCase() === 'true';
if (!ALLOW_DEV_ORIGINS) {
  CORS_ORIGINS.delete('http://localhost:5173');
  CORS_ORIGINS.delete('http://localhost:3000');
}
const AUTH_RATE_LIMIT = {
  windowMs: 60_000,
  maxAttempts: 8
};
const authAttempts = new Map();

const INQUIRY_RATE_LIMIT = {
  windowMs: 10 * 60_000,
  maxAttempts: 5,
  burstAttempts: 10,
  burstBlockMs: 30 * 60_000
};
const INQUIRY_DEDUPE_WINDOW_MS = Number(process.env.INQUIRY_DEDUPE_WINDOW_MS || 20 * 60_000);
const INQUIRY_MIN_FILL_TIME_MS = Number(process.env.INQUIRY_MIN_FILL_TIME_MS || 3_000);
const INQUIRY_MAX_FILL_TIME_MS = Number(process.env.INQUIRY_MAX_FILL_TIME_MS || 6 * 60 * 60_000);
const INQUIRY_DAILY_GLOBAL_CAP = Number(process.env.INQUIRY_DAILY_GLOBAL_CAP || 500);
const INQUIRY_DAILY_IP_CAP = Number(process.env.INQUIRY_DAILY_IP_CAP || 30);
const INQUIRY_DAILY_IDENTITY_CAP = Number(process.env.INQUIRY_DAILY_IDENTITY_CAP || 10);
const INQUIRY_QUEUE_THROUGHPUT_MS = Number(process.env.INQUIRY_QUEUE_THROUGHPUT_MS || 1_000);
const CAPTCHA_PROVIDER = String(process.env.CAPTCHA_PROVIDER || 'turnstile').toLowerCase();
const CAPTCHA_SECRET =
  process.env.CAPTCHA_SECRET_KEY
  || process.env.TURNSTILE_SECRET_KEY
  || process.env.RECAPTCHA_SECRET_KEY
  || process.env.HCAPTCHA_SECRET_KEY
  || '';
const CAPTCHA_REQUIRED = String(process.env.CAPTCHA_REQUIRED || (CAPTCHA_SECRET ? 'true' : 'false')).toLowerCase() !== 'false';
const SECURITY_ALERT_WEBHOOK_URL = process.env.SECURITY_ALERT_WEBHOOK_URL || '';
const EDGE_SHARED_SECRET = process.env.EDGE_SHARED_SECRET || '';
const SPIKE_ALERT_WINDOW_MS = Number(process.env.SPIKE_ALERT_WINDOW_MS || 5 * 60_000);
const SPIKE_ALERT_THRESHOLD = Number(process.env.SPIKE_ALERT_THRESHOLD || 20);
const SPIKE_ALERT_COOLDOWN_MS = Number(process.env.SPIKE_ALERT_COOLDOWN_MS || 15 * 60_000);
const MFA_SETUP_TTL_MS = Number(process.env.MFA_SETUP_TTL_MS || 10 * 60_000);

const inquiryIpAttempts = new Map();
const inquiryIdentityAttempts = new Map();
const inquiryDedupe = new Map();
const inquiryQueue = [];
let inquiryWorkerBusy = false;
let inquirySequence = 0;
let spikeAlertCooldownUntil = 0;
const blockedEvents = [];
const pendingMfaSetups = new Map();
const dailyCounters = {
  dayKey: '',
  global: 0,
  byIp: new Map(),
  byIdentity: new Map()
};

function setSecurityHeaders(res) {
  const connectSources = ["'self'"];
  if (FRONTEND_ORIGIN.startsWith('http://') || FRONTEND_ORIGIN.startsWith('https://')) {
    connectSources.push(FRONTEND_ORIGIN);
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src ${connectSources.join(' ')}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
  );
}

function sendJson(req, res, statusCode, payload) {
  const origin = req.headers.origin;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    Vary: 'Origin'
  };
  if (origin && CORS_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  res.writeHead(statusCode, headers);
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

function hasMojibakeMarker(value) {
  return /(?:\u00e1\u0192|\u00c3|\u00c2|\u00e2\u20ac|\ufffd)/u.test(value);
}

function maybeRepairMojibake(value) {
  if (typeof value !== 'string' || !hasMojibakeMarker(value)) {
    return value;
  }

  const decoded = Buffer.from(value, 'latin1').toString('utf8');
  const decodedLooksGeorgian = /[\u10a0-\u10ff]/u.test(decoded);
  const decodedStillBroken = hasMojibakeMarker(decoded);

  if (decodedLooksGeorgian && !decodedStillBroken) {
    return decoded;
  }

  return value;
}

function normalizeContentText(value) {
  if (typeof value === 'string') {
    return maybeRepairMojibake(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeContentText(item));
  }

  if (value && typeof value === 'object') {
    const cleaned = {};
    for (const [key, child] of Object.entries(value)) {
      cleaned[key] = normalizeContentText(child);
    }
    return cleaned;
  }

  return value;
}

function normalizePhone(input) {
  return normalizeText(input).replace(/[^\d+]/g, '');
}

function hashText(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function getClientIp(req) {
  const cfIp = normalizeText(req.headers['cf-connecting-ip']);
  if (cfIp) {
    return cfIp;
  }

  const forwarded = normalizeText(req.headers['x-forwarded-for']);
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket.remoteAddress || 'unknown';
}

function getInquiryIdentityKey(inquiry) {
  const email = normalizeEmail(inquiry.email);
  const phone = normalizePhone(inquiry.phone);
  return hashText(`${email}|${phone}`);
}

function getInquiryDedupeKey(inquiry) {
  const payload = [
    normalizeText(inquiry.name).toLowerCase(),
    normalizeEmail(inquiry.email),
    normalizePhone(inquiry.phone),
    normalizeText(inquiry.message).toLowerCase(),
    normalizeText(inquiry.date)
  ].join('|');
  return hashText(payload);
}

function evaluateSlidingWindowLimit(map, key, options) {
  const now = Date.now();
  const current = map.get(key) || { attempts: [], blockedUntil: 0 };

  if (current.blockedUntil > now) {
    return { allowed: false, retryAfterMs: current.blockedUntil - now, burstBlocked: true };
  }

  const attempts = current.attempts.filter((ts) => now - ts <= options.windowMs);
  attempts.push(now);

  if (attempts.length >= options.burstAttempts) {
    current.attempts = attempts;
    current.blockedUntil = now + options.burstBlockMs;
    map.set(key, current);
    return { allowed: false, retryAfterMs: options.burstBlockMs, burstBlocked: true };
  }

  if (attempts.length > options.maxAttempts) {
    current.attempts = attempts;
    current.blockedUntil = 0;
    map.set(key, current);
    const oldestRelevant = attempts[0];
    const retryAfterMs = Math.max(1_000, options.windowMs - (now - oldestRelevant));
    return { allowed: false, retryAfterMs, burstBlocked: false };
  }

  current.attempts = attempts;
  current.blockedUntil = 0;
  map.set(key, current);
  return { allowed: true, retryAfterMs: 0, burstBlocked: false };
}

function getDayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function ensureDailyCounters() {
  const dayKey = getDayKey();
  if (dailyCounters.dayKey === dayKey) {
    return;
  }

  dailyCounters.dayKey = dayKey;
  dailyCounters.global = 0;
  dailyCounters.byIp.clear();
  dailyCounters.byIdentity.clear();
}

function checkDailyCaps(ipKey, identityKey) {
  ensureDailyCounters();

  const ipCount = dailyCounters.byIp.get(ipKey) || 0;
  if (ipCount >= INQUIRY_DAILY_IP_CAP) {
    return { allowed: false, reason: 'ip_daily_cap' };
  }

  const identityCount = dailyCounters.byIdentity.get(identityKey) || 0;
  if (identityCount >= INQUIRY_DAILY_IDENTITY_CAP) {
    return { allowed: false, reason: 'identity_daily_cap' };
  }

  if (dailyCounters.global >= INQUIRY_DAILY_GLOBAL_CAP) {
    return { allowed: false, reason: 'global_daily_cap' };
  }

  return { allowed: true, reason: null };
}

function incrementDailyCounters(ipKey, identityKey) {
  ensureDailyCounters();
  dailyCounters.global += 1;
  dailyCounters.byIp.set(ipKey, (dailyCounters.byIp.get(ipKey) || 0) + 1);
  dailyCounters.byIdentity.set(identityKey, (dailyCounters.byIdentity.get(identityKey) || 0) + 1);
}

function checkInquiryDuplicate(dedupeKey) {
  const now = Date.now();
  const seenAt = inquiryDedupe.get(dedupeKey);
  if (!seenAt) {
    return { duplicate: false, retryAfterMs: 0 };
  }

  const age = now - seenAt;
  if (age > INQUIRY_DEDUPE_WINDOW_MS) {
    inquiryDedupe.delete(dedupeKey);
    return { duplicate: false, retryAfterMs: 0 };
  }

  return { duplicate: true, retryAfterMs: INQUIRY_DEDUPE_WINDOW_MS - age };
}

function markInquiryDuplicate(dedupeKey) {
  inquiryDedupe.set(dedupeKey, Date.now());
}

function recordBlockedEvent(reason, details = {}) {
  const now = Date.now();
  blockedEvents.push(now);

  while (blockedEvents.length > 0 && now - blockedEvents[0] > SPIKE_ALERT_WINDOW_MS) {
    blockedEvents.shift();
  }

  if (blockedEvents.length < SPIKE_ALERT_THRESHOLD || now < spikeAlertCooldownUntil) {
    return;
  }

  spikeAlertCooldownUntil = now + SPIKE_ALERT_COOLDOWN_MS;
  void sendSecurityAlert(`[inquiry_abuse_spike] ${reason}`, {
    reason,
    blockedCount: blockedEvents.length,
    windowMs: SPIKE_ALERT_WINDOW_MS,
    ...details
  });
}

async function sendSecurityAlert(message, metadata = {}) {
  const payload = {
    message,
    metadata,
    at: new Date().toISOString(),
    service: 'elite-backend'
  };

  if (SECURITY_ALERT_WEBHOOK_URL) {
    try {
      const response = await fetch(SECURITY_ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        console.warn(`[security-alert] webhook failed with status ${response.status}`);
      }
      return;
    } catch (error) {
      console.warn(`[security-alert] webhook error: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  console.warn('[security-alert]', payload);
}

async function verifyCaptchaToken(token, ip) {
  if (!CAPTCHA_REQUIRED) {
    return { ok: true, provider: 'disabled' };
  }

  if (!CAPTCHA_SECRET) {
    return { ok: false, provider: CAPTCHA_PROVIDER, error: 'Captcha secret is not configured on server.' };
  }

  const safeToken = normalizeText(token);
  if (!safeToken) {
    return { ok: false, provider: CAPTCHA_PROVIDER, error: 'Captcha token is required.' };
  }

  let verifyUrl = '';
  const body = new URLSearchParams();
  body.set('secret', CAPTCHA_SECRET);
  body.set('response', safeToken);
  body.set('remoteip', ip);

  if (CAPTCHA_PROVIDER === 'turnstile') {
    verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  } else if (CAPTCHA_PROVIDER === 'recaptcha') {
    verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  } else if (CAPTCHA_PROVIDER === 'hcaptcha') {
    verifyUrl = 'https://hcaptcha.com/siteverify';
  } else {
    return { ok: false, provider: CAPTCHA_PROVIDER, error: 'Unsupported CAPTCHA_PROVIDER.' };
  }

  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    const payload = await response.json().catch(() => ({}));
    const success = Boolean(payload.success);

    if (!response.ok || !success) {
      return { ok: false, provider: CAPTCHA_PROVIDER, error: 'Captcha verification failed.' };
    }

    return { ok: true, provider: CAPTCHA_PROVIDER };
  } catch {
    return { ok: false, provider: CAPTCHA_PROVIDER, error: 'Captcha verification request failed.' };
  }
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
    const configuredFrom = normalizeEmail(process.env.INQUIRY_FROM_EMAIL || 'noreply@elitewe.com.ge');
    const fromDomain = configuredFrom.split('@')[1] || '';
    const from = fromDomain === 'elitewe.com.ge' ? configuredFrom : 'noreply@elitewe.com.ge';
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

function enqueueInquiryDelivery(job) {
  inquirySequence += 1;
  const queueJob = {
    id: `inq-${Date.now()}-${inquirySequence}`,
    enqueuedAt: Date.now(),
    ...job
  };
  inquiryQueue.push(queueJob);
  return queueJob;
}

async function processInquiryQueueTick() {
  if (inquiryWorkerBusy || inquiryQueue.length === 0) {
    return;
  }

  const job = inquiryQueue.shift();
  if (!job) {
    return;
  }

  inquiryWorkerBusy = true;
  try {
    const delivery = await deliverInquiry(job.deliveryPayload);
    await appendAuditLog({
      action: 'public_inquiry_delivered',
      userId: 'public',
      metadata: {
        queueId: job.id,
        provider: delivery.provider,
        channel: job.metadata.channel,
        email: job.metadata.email,
        ipHash: job.metadata.ipHash,
        identityHash: job.metadata.identityHash
      }
    });
  } catch (error) {
    await appendAuditLog({
      action: 'public_inquiry_delivery_failed',
      userId: 'public',
      metadata: {
        queueId: job.id,
        channel: job.metadata.channel,
        email: job.metadata.email,
        error: error instanceof Error ? error.message : 'Unknown delivery error'
      }
    });

    recordBlockedEvent('inquiry_delivery_failed', {
      queueId: job.id
    });
  } finally {
    inquiryWorkerBusy = false;
  }
}

function withCors(req, res) {
  setSecurityHeaders(res);
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
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

function sendTooManyRequests(req, res, error, retryAfterMs) {
  const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1_000));
  res.setHeader('Retry-After', String(retryAfterSec));
  sendJson(req, res, 429, { error });
}

function cleanupInMemorySecurityState() {
  const now = Date.now();

  for (const [key, entry] of inquiryIpAttempts.entries()) {
    const recent = entry.attempts.filter((ts) => now - ts <= INQUIRY_RATE_LIMIT.windowMs);
    const blockedActive = entry.blockedUntil > now;
    if (recent.length === 0 && !blockedActive) {
      inquiryIpAttempts.delete(key);
      continue;
    }
    entry.attempts = recent;
  }

  for (const [key, entry] of inquiryIdentityAttempts.entries()) {
    const recent = entry.attempts.filter((ts) => now - ts <= INQUIRY_RATE_LIMIT.windowMs);
    const blockedActive = entry.blockedUntil > now;
    if (recent.length === 0 && !blockedActive) {
      inquiryIdentityAttempts.delete(key);
      continue;
    }
    entry.attempts = recent;
  }

  for (const [key, seenAt] of inquiryDedupe.entries()) {
    if (now - seenAt > INQUIRY_DEDUPE_WINDOW_MS) {
      inquiryDedupe.delete(key);
    }
  }

  for (const [userId, setup] of pendingMfaSetups.entries()) {
    if (setup.expiresAt <= now) {
      pendingMfaSetups.delete(userId);
    }
  }
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
      const store = await loadStore();
      sendJson(req, res, 200, { content: normalizeContentText(store.content) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/public/inquiry') {
      const body = await getRequestBody(req);
      const inquiry = body.inquiry && typeof body.inquiry === 'object' ? body.inquiry : null;
      const labels = body.labels && typeof body.labels === 'object' ? body.labels : null;
      const channel = normalizeText(body.channel).toLowerCase();
      const targetEmail = INQUIRY_TARGET_EMAIL;
      const targetWhatsApp = normalizeText(body.targetWhatsApp || '995595930899');
      const captchaToken = normalizeText(body.captchaToken);
      const honeypot = normalizeText(body.honeypot);
      const formStartedAt = Number(body.formStartedAt || 0);
      const ipKey = getClientIp(req);

      if (!inquiry || !labels) {
        sendJson(req, res, 400, { error: 'Invalid inquiry payload.' });
        return;
      }

      if (EDGE_SHARED_SECRET) {
        const edgeHeader = normalizeText(req.headers['x-edge-auth']);
        if (!edgeHeader || edgeHeader !== EDGE_SHARED_SECRET) {
          recordBlockedEvent('edge_secret_missing', { ipKey });
          sendJson(req, res, 403, { error: 'Request rejected by edge policy.' });
          return;
        }
      }

      if (honeypot) {
        recordBlockedEvent('honeypot_triggered', { ipKey });
        sendJson(req, res, 400, { error: 'Invalid submission.' });
        return;
      }

      const fillElapsedMs = Date.now() - formStartedAt;
      if (!Number.isFinite(formStartedAt) || formStartedAt <= 0 || fillElapsedMs < INQUIRY_MIN_FILL_TIME_MS) {
        recordBlockedEvent('fill_time_too_fast', { ipKey, fillElapsedMs });
        sendJson(req, res, 400, { error: 'Submission was too fast. Please try again.' });
        return;
      }

      if (fillElapsedMs > INQUIRY_MAX_FILL_TIME_MS) {
        sendJson(req, res, 400, { error: 'Form session expired. Please open the form again.' });
        return;
      }

      const captchaCheck = await verifyCaptchaToken(captchaToken, ipKey);
      if (!captchaCheck.ok) {
        recordBlockedEvent('captcha_failed', { ipKey, provider: captchaCheck.provider });
        sendJson(req, res, 400, { error: captchaCheck.error || 'Captcha validation failed.' });
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

      const identityKey = getInquiryIdentityKey(inquiry);
      const dedupeKey = getInquiryDedupeKey(inquiry);

      const ipRate = evaluateSlidingWindowLimit(inquiryIpAttempts, ipKey, INQUIRY_RATE_LIMIT);
      if (!ipRate.allowed) {
        recordBlockedEvent('ip_rate_limited', { ipKey, burstBlocked: ipRate.burstBlocked });
        sendTooManyRequests(req, res, 'Too many requests from this IP. Please try later.', ipRate.retryAfterMs);
        return;
      }

      const identityRate = evaluateSlidingWindowLimit(inquiryIdentityAttempts, identityKey, INQUIRY_RATE_LIMIT);
      if (!identityRate.allowed) {
        recordBlockedEvent('identity_rate_limited', { ipKey });
        sendTooManyRequests(req, res, 'Too many requests for this contact identity. Please try later.', identityRate.retryAfterMs);
        return;
      }

      const duplicateCheck = checkInquiryDuplicate(dedupeKey);
      if (duplicateCheck.duplicate) {
        recordBlockedEvent('duplicate_submission', { ipKey });
        sendTooManyRequests(
          req,
          res,
          'Duplicate inquiry detected. Please wait before resubmitting.',
          duplicateCheck.retryAfterMs
        );
        return;
      }

      const dailyCapCheck = checkDailyCaps(ipKey, identityKey);
      if (!dailyCapCheck.allowed) {
        recordBlockedEvent('daily_cap_reached', { ipKey, reason: dailyCapCheck.reason });
        sendTooManyRequests(req, res, 'Daily inquiry limit reached. Please try again tomorrow.', 24 * 60 * 60_000);
        return;
      }

      const normalizedChannel = channel === 'whatsapp' ? 'whatsapp' : 'email';
      const subject = `Wedding Inquiry (${normalizedChannel}) - ${normalizeText(inquiry.name)}`;
      const messageBody = buildInquiryBody(inquiry, labels);
      const messageHtml = buildInquiryHtml(inquiry, labels, normalizedChannel);
      const queueJob = enqueueInquiryDelivery({
        metadata: {
          channel: normalizedChannel,
          email: normalizeEmail(inquiry.email),
          ipHash: hashText(ipKey).slice(0, 20),
          identityHash: identityKey.slice(0, 20)
        },
        deliveryPayload: {
          inquiry,
          labels,
          channel: normalizedChannel,
          targetEmail,
          targetWhatsApp,
          subject,
          body: messageBody,
          html: messageHtml,
          submittedAt: new Date().toISOString()
        }
      });

      markInquiryDuplicate(dedupeKey);
      incrementDailyCounters(ipKey, identityKey);

      await appendAuditLog({
        action: 'public_inquiry_queued',
        userId: 'public',
        metadata: {
          queueId: queueJob.id,
          channel: normalizedChannel,
          email: normalizeEmail(inquiry.email),
          targetEmail
        }
      });

      sendJson(req, res, 200, {
        ok: true,
        status: 'queued',
        queueId: queueJob.id
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/security/stats') {
      const store = await loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      ensureDailyCounters();
      sendJson(req, res, 200, {
        day: dailyCounters.dayKey,
        globalCount: dailyCounters.global,
        queueDepth: inquiryQueue.length,
        ipEntries: inquiryIpAttempts.size,
        identityEntries: inquiryIdentityAttempts.size,
        dedupeEntries: inquiryDedupe.size,
        caps: {
          global: INQUIRY_DAILY_GLOBAL_CAP,
          perIp: INQUIRY_DAILY_IP_CAP,
          perIdentity: INQUIRY_DAILY_IDENTITY_CAP
        }
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/security/alert-test') {
      const store = await loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      await sendSecurityAlert('[manual_security_alert_test]', { initiatedBy: user.email });
      sendJson(req, res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/auth/login') {
      const ipKey = req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(`login:${ipKey}`)) {
        sendJson(req, res, 429, { error: 'Too many attempts. Try again in a minute.' });
        return;
      }

      const store = await loadStore();
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
      await appendAuditLog({ action: 'login', userId: user.id, metadata: { mfa: false } });
      sendJson(req, res, 200, { accessToken, user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/auth/mfa/verify') {
      const ipKey = req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(`mfa:${ipKey}`)) {
        sendJson(req, res, 429, { error: 'Too many attempts. Try again in a minute.' });
        return;
      }

      const store = await loadStore();
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
          await saveStore(store);
        }
      }

      if (!valid) {
        sendJson(req, res, 401, { error: 'Invalid code' });
        return;
      }

      const accessToken = signToken({ sub: user.id, role: 'admin' }, store.jwtSecret, 60 * 60 * 12);
      await appendAuditLog({ action: 'login', userId: user.id, metadata: { mfa: true } });
      sendJson(req, res, 200, { accessToken, user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/auth/mfa/setup') {
      const store = await loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      if (user.mfaEnabled) {
        sendJson(req, res, 409, { error: 'Authenticator is already enabled.' });
        return;
      }

      const secret = generateTotpSecret();
      const recoveryCodes = generateRecoveryCodes();
      const expiresAt = Date.now() + MFA_SETUP_TTL_MS;
      pendingMfaSetups.set(user.id, {
        secret,
        recoveryCodes,
        expiresAt
      });

      await appendAuditLog({ action: 'mfa_setup_started', userId: user.id, metadata: {} });

      sendJson(req, res, 200, {
        secret,
        expiresInSec: Math.ceil(MFA_SETUP_TTL_MS / 1_000),
        otpauthUrl: getOtpAuthUrl({
          issuer: 'Elite Weddings Admin',
          accountName: user.email,
          secret
        })
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/auth/mfa/setup/confirm') {
      const store = await loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      const body = await getRequestBody(req);
      const code = String(body.code || '').trim();
      if (!code) {
        sendJson(req, res, 400, { error: 'Authenticator code is required.' });
        return;
      }

      const pendingSetup = pendingMfaSetups.get(user.id);
      if (!pendingSetup || pendingSetup.expiresAt <= Date.now()) {
        pendingMfaSetups.delete(user.id);
        sendJson(req, res, 400, { error: 'MFA setup expired. Start setup again.' });
        return;
      }

      const valid = verifyTotp(pendingSetup.secret, code);
      if (!valid) {
        sendJson(req, res, 401, { error: 'Invalid authenticator code.' });
        return;
      }

      user.mfaSecret = pendingSetup.secret;
      user.mfaEnabled = true;
      user.recoveryCodes = pendingSetup.recoveryCodes;
      await saveStore(store);
      pendingMfaSetups.delete(user.id);

      await appendAuditLog({ action: 'mfa_setup', userId: user.id, metadata: { confirmed: true } });
      sendJson(req, res, 200, { user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/auth/mfa/disable') {
      const store = await loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      user.mfaEnabled = false;
      user.mfaSecret = null;
      user.recoveryCodes = [];
      pendingMfaSetups.delete(user.id);
      await saveStore(store);

      await appendAuditLog({ action: 'mfa_disabled', userId: user.id, metadata: {} });
      sendJson(req, res, 200, { user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/profile') {
      const store = await loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      sendJson(req, res, 200, { user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/api/admin/profile') {
      const store = await loadStore();
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

      await saveStore(store);
      await appendAuditLog({ action: 'profile_update', userId: user.id, metadata: {} });
      sendJson(req, res, 200, { user: sanitizeUser(user) });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/users') {
      const store = await loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      sendJson(req, res, 200, { users: store.users.map((item) => sanitizeUser(item)) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/users') {
      const store = await loadStore();
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
      await saveStore(store);
      await appendAuditLog({
        action: 'user_create',
        userId: user.id,
        metadata: { createdUserId: newUser.id, email: newUser.email }
      });
      sendJson(req, res, 201, { user: sanitizeUser(newUser) });
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/api/admin/users') {
      const store = await loadStore();
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

      await saveStore(store);
      await appendAuditLog({
        action: 'user_update',
        userId: user.id,
        metadata: { targetUserId: targetUser.id }
      });
      sendJson(req, res, 200, { user: sanitizeUser(targetUser) });
      return;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/admin/users') {
      const store = await loadStore();
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
      await saveStore(store);
      await appendAuditLog({
        action: 'user_delete',
        userId: user.id,
        metadata: { targetUserId: targetId, targetEmail: removed.email }
      });
      sendJson(req, res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/content') {
      const store = await loadStore();
      const user = getAuthUser(req, store);
      if (!user) {
        sendJson(req, res, 401, { error: 'Unauthorized' });
        return;
      }

      sendJson(req, res, 200, { content: normalizeContentText(store.content) });
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/api/admin/content') {
      const store = await loadStore();
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

      const normalizedContent = normalizeContentText(body.content);
      store.content = normalizedContent;
      await saveStore(store);

      await appendAuditLog({
        action: 'content_update',
        userId: user.id,
        metadata: { contentKeys: Object.keys(normalizedContent) }
      });

      sendJson(req, res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/audit') {
      const store = await loadStore();
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

setInterval(() => {
  void processInquiryQueueTick();
}, INQUIRY_QUEUE_THROUGHPUT_MS);

setInterval(() => {
  cleanupInMemorySecurityState();
}, 60_000);

server.listen(PORT, () => {
  console.log(`[backend] running on http://localhost:${PORT}`);
});

