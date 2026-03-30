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

## Default admin credentials
- Email: `admin@eliteweddings.local`
- Password: `ChangeMe123!`

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
- `INQUIRY_FROM_EMAIL` (default: `onboarding@resend.dev`)

## Storage
Backend data file:
- `backend/data/store.json`

This contains users, MFA state, content JSON, and audit logs.
