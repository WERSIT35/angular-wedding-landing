const API = localStorage.getItem('admin_api_base') || window.location.origin;

let accessToken = sessionStorage.getItem('admin_access_token') || '';
let tempMfaToken = '';

const authCard = document.getElementById('authCard');
const adminCard = document.getElementById('adminCard');
const mfaCard = document.getElementById('mfaCard');
const auditCard = document.getElementById('auditCard');
const adminGrid = document.getElementById('adminGrid');

const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const authMsg = document.getElementById('authMsg');
const mfaWrap = document.getElementById('mfaWrap');
const mfaCode = document.getElementById('mfaCode');
const verifyMfaBtn = document.getElementById('verifyMfaBtn');

const contentEditor = document.getElementById('contentEditor');
const loadBtn = document.getElementById('loadBtn');
const saveBtn = document.getElementById('saveBtn');
const contentMsg = document.getElementById('contentMsg');
const logoutBtn = document.getElementById('logoutBtn');

const setupMfaBtn = document.getElementById('setupMfaBtn');
const mfaOutput = document.getElementById('mfaOutput');

const refreshAuditBtn = document.getElementById('refreshAuditBtn');
const auditOutput = document.getElementById('auditOutput');

function setAuthState(loggedIn) {
  authCard.classList.toggle('hidden', loggedIn);
  adminGrid.classList.toggle('hidden', !loggedIn);
  adminCard.classList.toggle('hidden', !loggedIn);
  mfaCard.classList.toggle('hidden', !loggedIn);
  auditCard.classList.toggle('hidden', !loggedIn);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body;
}

async function login() {
  authMsg.textContent = 'Signing in...';
  try {
    const payload = await api('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailEl.value, password: passwordEl.value })
    });

    if (payload.mfaRequired) {
      tempMfaToken = payload.tempToken;
      mfaWrap.classList.remove('hidden');
      authMsg.textContent = 'MFA required. Enter your 6-digit code.';
      return;
    }

    accessToken = payload.accessToken;
    sessionStorage.setItem('admin_access_token', accessToken);
    setAuthState(true);
    authMsg.textContent = '';
    await Promise.all([loadContent(), loadAudit()]);
  } catch (error) {
    authMsg.textContent = error.message;
  }
}

async function verifyMfa() {
  authMsg.textContent = 'Verifying MFA...';
  try {
    const payload = await api('/api/admin/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ tempToken: tempMfaToken, code: mfaCode.value })
    });

    accessToken = payload.accessToken;
    sessionStorage.setItem('admin_access_token', accessToken);
    setAuthState(true);
    authMsg.textContent = '';
    await Promise.all([loadContent(), loadAudit()]);
  } catch (error) {
    authMsg.textContent = error.message;
  }
}

async function loadContent() {
  contentMsg.textContent = 'Loading content...';
  try {
    const payload = await api('/api/admin/content');
    contentEditor.value = JSON.stringify(payload.content ?? {}, null, 2);
    contentMsg.textContent = 'Loaded.';
  } catch (error) {
    contentMsg.textContent = error.message;
  }
}

async function saveContent() {
  contentMsg.textContent = 'Saving...';
  try {
    const parsed = JSON.parse(contentEditor.value || '{}');
    await api('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify({ content: parsed })
    });
    contentMsg.textContent = 'Saved successfully.';
  } catch (error) {
    contentMsg.textContent = error.message;
  }
}

async function setupMfa() {
  mfaOutput.textContent = 'Configuring MFA...';
  try {
    const payload = await api('/api/admin/auth/mfa/setup', { method: 'POST' });
    mfaOutput.textContent = JSON.stringify(payload, null, 2);
  } catch (error) {
    mfaOutput.textContent = error.message;
  }
}

async function loadAudit() {
  auditOutput.textContent = 'Loading logs...';
  try {
    const payload = await api('/api/admin/audit');
    auditOutput.textContent = JSON.stringify(payload.logs, null, 2);
  } catch (error) {
    auditOutput.textContent = error.message;
  }
}

function logout() {
  accessToken = '';
  tempMfaToken = '';
  localStorage.removeItem('admin_access_token');
  sessionStorage.removeItem('admin_access_token');
  setAuthState(false);
  mfaWrap.classList.add('hidden');
  authMsg.textContent = '';
}

loginBtn.addEventListener('click', login);
verifyMfaBtn.addEventListener('click', verifyMfa);
loadBtn.addEventListener('click', loadContent);
saveBtn.addEventListener('click', saveContent);
setupMfaBtn.addEventListener('click', setupMfa);
refreshAuditBtn.addEventListener('click', loadAudit);
logoutBtn.addEventListener('click', logout);

if (accessToken) {
  setAuthState(true);
  Promise.all([loadContent(), loadAudit()]).catch(() => logout());
} else {
  setAuthState(false);
}
