# Fullstack Backend + Admin Setup

This project now includes a built-in backend API and admin panel.

## What you get
- Admin login with password auth
- MFA (TOTP) setup and verification
- Recovery codes
- Content CRUD API
- Public content API for Angular app
- Audit logs
- Admin panel at `/admin`

## Run locally
1. Start backend:
```bash
npm run backend:start
```

2. Start frontend (separate terminal):
```bash
npm run start
```

3. Open admin panel:
- `http://localhost:4000/admin`

4. Public site:
- `http://localhost:4200`

## Initial admin credentials
- Email defaults to: `admin@eliteweddings.local` (override via `ADMIN_EMAIL`)
- Password is generated on first boot if `ADMIN_PASSWORD` is not set, and printed once in backend logs

Change this immediately via environment variables before first start:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`

Example:
```bash
$env:ADMIN_EMAIL='you@example.com'
$env:ADMIN_PASSWORD='VeryStrongPassword!123'
$env:JWT_SECRET='replace-with-long-random-secret'
npm run backend:start
```

## API endpoints
- `GET /health`
- `GET /api/public/content`
- `POST /api/public/inquiry`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/mfa/verify`
- `POST /api/admin/auth/mfa/setup` (requires admin token)
- `GET /api/admin/content` (requires admin token)
- `PUT /api/admin/content` (requires admin token)
- `GET /api/admin/audit` (requires admin token)

## Inquiry delivery (server-side, no client mail app)
`POST /api/public/inquiry` now submits RSVP details from frontend to backend.

Delivery providers:
- `RESEND_API_KEY` set: sends real email using Resend API
- `INQUIRY_WEBHOOK_URL` set: forwards payload to your webhook
- none set: logs payload on backend (no external delivery)

Optional env:
- `INQUIRY_FROM_EMAIL` (default: `onboarding@resend.dev`, recommended: `noreply@elitewe.com.ge`)

### Resend domain DNS (elitewe.com.ge)
Recommended DNS setup to avoid MX conflicts:
- Sending (required):
  - `TXT resend._domainkey` -> your Resend DKIM value
  - `MX send` -> `feedback-smtp.eu-west-1.amazonses.com` (priority `10`)
  - `TXT send` -> `v=spf1 include:amazonses.com ~all`
- Receiving (only if needed):
  - Prefer a subdomain MX, for example:
    - `MX inbound` -> `inbound-smtp.eu-west-1.amazonaws.com` (priority `10`)
  - Then receive mail on `*@inbound.elitewe.com.ge`
  - Keep root domain MX (`@`) with your existing mailbox provider to avoid conflict

## Storage
Backend data file:
- `backend/data/store.json`

This contains users, MFA state, content JSON, and audit logs.

## PostgreSQL Mode (Recommended)

Backend now supports PostgreSQL storage when `DATABASE_URL` is provided.

### Env vars
- `DATABASE_URL` (example: `postgresql://user:pass@host:25060/dbname`)
- `DATABASE_SSL` (`true` for managed DBs)
- `PGSSLMODE` (`require` for managed DBs)

When `DATABASE_URL` is set:
- backend stores full app state in PostgreSQL (`app_state` table)
- if `store.json` exists and DB is empty, backend auto-imports it once
- `store.json` is ignored for runtime writes after migration

### Local example
```bash
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/elitewe'
$env:DATABASE_SSL='false'
$env:PGSSLMODE='disable'
npm run backend:start
```
