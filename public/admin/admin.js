let API = localStorage.getItem('admin_api_base') || window.location.origin;
let accessToken = sessionStorage.getItem('admin_access_token') || '';
let tempMfaToken = '';
let currentContent = {};
let currentLanguage = 'en';

const authCard = document.getElementById('authCard');
const adminBar = document.getElementById('adminBar');
const previewRoot = document.getElementById('previewRoot');
const advancedPanel = document.getElementById('advancedPanel');
const auditPanel = document.getElementById('auditPanel');
const mfaPanel = document.getElementById('mfaPanel');

const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const authMsg = document.getElementById('authMsg');
const mfaWrap = document.getElementById('mfaWrap');
const mfaCode = document.getElementById('mfaCode');
const verifyMfaBtn = document.getElementById('verifyMfaBtn');

const apiBaseInput = document.getElementById('apiBaseInput');
const saveApiBaseBtn = document.getElementById('saveApiBaseBtn');
const loadBtn = document.getElementById('loadBtn');
const injectTemplateBtn = document.getElementById('injectTemplateBtn');
const saveBtn = document.getElementById('saveBtn');
const logoutBtn = document.getElementById('logoutBtn');
const contentMsg = document.getElementById('contentMsg');

const langEnBtn = document.getElementById('langEnBtn');
const langKaBtn = document.getElementById('langKaBtn');

const contentEditor = document.getElementById('contentEditor');
const formatBtn = document.getElementById('formatBtn');

const refreshAuditBtn = document.getElementById('refreshAuditBtn');
const auditOutput = document.getElementById('auditOutput');

const setupMfaBtn = document.getElementById('setupMfaBtn');
const mfaOutput = document.getElementById('mfaOutput');

apiBaseInput.value = API;

function setAuthState(loggedIn) {
  authCard.classList.toggle('hidden', loggedIn);
  adminBar.classList.toggle('hidden', !loggedIn);
  previewRoot.classList.toggle('hidden', !loggedIn);
  advancedPanel.classList.toggle('hidden', !loggedIn);
  auditPanel.classList.toggle('hidden', !loggedIn);
  mfaPanel.classList.toggle('hidden', !loggedIn);
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

function getByPath(target, path) {
  return path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), target);
}

function setByPath(target, path, value) {
  const keys = path.split('.');
  let cursor = target;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!cursor[key] || typeof cursor[key] !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
}

function ensureLang() {
  currentContent[currentLanguage] ??= {};
  return currentContent[currentLanguage];
}

function editField(path, label, type = 'text') {
  const lang = ensureLang();
  const currentValue = getByPath(lang, path);

  let next;
  if (type === 'json') {
    const raw = window.prompt(`Edit ${label} (JSON)`, JSON.stringify(currentValue ?? [], null, 2));
    if (raw === null) return;
    try {
      next = JSON.parse(raw);
    } catch {
      contentMsg.textContent = `Invalid JSON for ${label}.`;
      return;
    }
  } else {
    const raw = window.prompt(`Edit ${label}`, currentValue ?? '');
    if (raw === null) return;
    next = raw;
  }

  setByPath(lang, path, next);
  renderPreview();
  syncJson();
  contentMsg.textContent = `Updated ${label}.`;
}

function withEdit(label, path, value, type = 'text') {
  const wrap = document.createElement('div');
  wrap.className = 'editable';

  const valueEl = document.createElement('div');
  valueEl.className = 'editable-value';
  if (value instanceof HTMLElement) {
    valueEl.append(value);
  } else {
    valueEl.textContent = value ?? '';
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'edit-btn';
  btn.textContent = 'Edit';
  btn.addEventListener('click', () => editField(path, label, type));

  wrap.append(valueEl, btn);
  return wrap;
}

function text(lang, path, fallback = '') {
  const value = getByPath(lang, path);
  return typeof value === 'string' && value.length ? value : fallback;
}

function arrayVal(lang, path, fallback = []) {
  const value = getByPath(lang, path);
  return Array.isArray(value) ? value : fallback;
}

function renderPreview() {
  const lang = ensureLang();
  previewRoot.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'page-shell';

  const header = document.createElement('header');
  header.className = 'site-header';
  const brand = document.createElement('a');
  brand.className = 'brand-mark';
  brand.href = '#';
  brand.append(
    withEdit('Site tagline', 'siteTagline', text(lang, 'siteTagline', 'Luxury Weddings')),
    withEdit('Brand name', 'brandName', text(lang, 'brandName', 'Elite Weddings & Events Co.'))
  );
  header.append(brand);
  shell.append(header);

  const main = document.createElement('main');

  const hero = document.createElement('section');
  hero.className = 'hero-section';
  hero.append(
    withEdit('Hero eyebrow', 'hero.eyebrow', text(lang, 'hero.eyebrow', 'Destination weddings in Georgia')),
    withEdit('Hero title', 'hero.title', text(lang, 'hero.title', 'Elite Weddings & Events Co.')),
    withEdit('Hero subtitle', 'hero.subtitle', text(lang, 'hero.subtitle', 'Luxury Wedding Planning')),
    withEdit('Hero description', 'hero.description', text(lang, 'hero.description', 'Plan your unforgettable wedding.')),
    withEdit('Hero image src', 'landing.heroImageSrc', text(lang, 'landing.heroImageSrc', '/assets/images/L2D100242.JPG'))
  );
  main.append(hero);

  const essentials = document.createElement('section');
  essentials.className = 'section';
  essentials.append(
    withEdit('Essentials eyebrow', 'landing.eventInfoEyebrow', text(lang, 'landing.eventInfoEyebrow', 'Event info')),
    withEdit('Essentials title', 'landing.eventEssentialsTitle', text(lang, 'landing.eventEssentialsTitle', 'Event essentials')),
    withEdit('Essentials description', 'landing.eventEssentialsDescription', text(lang, 'landing.eventEssentialsDescription', 'Everything guests need at a glance.')),
    withEdit('Essentials cards', 'landing.eventEssentials', JSON.stringify(arrayVal(lang, 'landing.eventEssentials', []), null, 2), 'json'),
    withEdit('Timeline', 'landing.eventTimeline', JSON.stringify(arrayVal(lang, 'landing.eventTimeline', []), null, 2), 'json')
  );
  main.append(essentials);

  const gallery = document.createElement('section');
  gallery.className = 'section';
  gallery.append(
    withEdit('Gallery eyebrow', 'landing.galleryEyebrow', text(lang, 'landing.galleryEyebrow', 'Gallery')),
    withEdit('Gallery title', 'landing.galleryTitle', text(lang, 'landing.galleryTitle', 'Moments from real celebrations')),
    withEdit('Gallery photos', 'landing.galleryPhotos', JSON.stringify(arrayVal(lang, 'landing.galleryPhotos', []), null, 2), 'json')
  );
  main.append(gallery);

  const faq = document.createElement('section');
  faq.className = 'section';
  faq.append(
    withEdit('FAQ title', 'faq.title', text(lang, 'faq.title', 'FAQ')),
    withEdit('FAQ questions', 'faq.items', JSON.stringify(arrayVal(lang, 'faq.items', []), null, 2), 'json'),
    withEdit('FAQ answer', 'faq.answer', text(lang, 'faq.answer', 'We tailor every wedding to your needs.'))
  );
  main.append(faq);

  const contact = document.createElement('section');
  contact.className = 'section';
  contact.append(
    withEdit('Contact title', 'landing.contactTitle', text(lang, 'landing.contactTitle', 'RSVP in 30 seconds')),
    withEdit('Contact description', 'landing.contactDescription', text(lang, 'landing.contactDescription', 'Short form, instant send via email or WhatsApp.')),
    withEdit('Email', 'contact.channels.email', text(lang, 'contact.channels.email', 'Eliteweddingsandeventsco1@gmail.com')),
    withEdit('WhatsApp', 'contact.channels.whatsapp', text(lang, 'contact.channels.whatsapp', '+995 595 930 899'))
  );
  main.append(contact);

  shell.append(main);
  previewRoot.append(shell);
}

function syncJson() {
  contentEditor.value = JSON.stringify(currentContent, null, 2);
}

function defaultContent() {
  return {
    en: {
      siteTagline: 'Luxury Weddings',
      brandName: 'Elite Weddings & Events Co.',
      hero: {
        eyebrow: 'Destination weddings in Georgia',
        title: 'Elite Weddings & Events Co.',
        subtitle: 'Luxury Wedding Planning',
        description: 'Plan your unforgettable wedding with us.'
      },
      landing: {
        heroImageSrc: '/assets/images/L2D100242.JPG',
        eventInfoEyebrow: 'Event info',
        eventEssentialsTitle: 'Event essentials',
        eventEssentialsDescription: 'Everything guests need at a glance.',
        eventEssentials: [
          { label: 'Date', value: 'September 12, 2026' },
          { label: 'Time', value: '5:00 PM ceremony, 7:00 PM reception' }
        ],
        eventTimeline: ['5:00 PM - Guest arrival', '5:30 PM - Ceremony'],
        galleryEyebrow: 'Gallery',
        galleryTitle: 'Moments from real celebrations',
        galleryPhotos: [
          { src: '/assets/images/L2D100242.JPG', alt: 'Wedding moment 1' },
          { src: '/assets/images/L2D10028.JPG', alt: 'Wedding moment 2' }
        ],
        contactTitle: 'RSVP in 30 seconds',
        contactDescription: 'Short form, instant send via email or WhatsApp.'
      },
      faq: {
        title: 'FAQ',
        items: ['How much does it cost?'],
        answer: 'We tailor every celebration to your needs.'
      },
      contact: {
        channels: {
          email: 'Eliteweddingsandeventsco1@gmail.com',
          whatsapp: '+995 595 930 899',
          whatsappNumber: '995595930899'
        }
      }
    },
    ka: {}
  };
}

function initializeStarterContent() {
  const starter = defaultContent();
  starter.ka = JSON.parse(JSON.stringify(starter.en));
  currentContent = starter;
  renderPreview();
  syncJson();
  contentMsg.textContent = 'Starter content initialized.';
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
    currentContent = payload.content && typeof payload.content === 'object' ? payload.content : {};
    renderPreview();
    syncJson();
    contentMsg.textContent = 'Loaded.';
  } catch (error) {
    contentMsg.textContent = error.message;
  }
}

async function saveContent() {
  contentMsg.textContent = 'Saving...';
  try {
    await api('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify({ content: currentContent })
    });
    contentMsg.textContent = 'Saved successfully.';
  } catch (error) {
    contentMsg.textContent = error.message;
  }
}

async function loadAudit() {
  auditOutput.textContent = 'Loading logs...';
  try {
    const payload = await api('/api/admin/audit');
    const lines = (payload.logs || []).map((log) => `${new Date(log.at).toLocaleString()} | ${log.action}`);
    auditOutput.textContent = lines.length ? lines.join('\n') : 'No activity yet.';
  } catch (error) {
    auditOutput.textContent = error.message;
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

function logout() {
  accessToken = '';
  tempMfaToken = '';
  sessionStorage.removeItem('admin_access_token');
  setAuthState(false);
  mfaWrap.classList.add('hidden');
  authMsg.textContent = '';
}

function saveApiBase() {
  API = apiBaseInput.value.trim() || window.location.origin;
  localStorage.setItem('admin_api_base', API);
  contentMsg.textContent = `API base set to ${API}`;
}

function setLanguage(lang) {
  currentLanguage = lang;
  langEnBtn.classList.toggle('active', lang === 'en');
  langKaBtn.classList.toggle('active', lang === 'ka');
  renderPreview();
}

function applyAdvancedJson() {
  try {
    currentContent = JSON.parse(contentEditor.value || '{}');
    renderPreview();
    contentMsg.textContent = 'Advanced JSON applied.';
  } catch {
    contentMsg.textContent = 'Invalid JSON.';
  }
}

loginBtn.addEventListener('click', login);
verifyMfaBtn.addEventListener('click', verifyMfa);
loadBtn.addEventListener('click', loadContent);
saveBtn.addEventListener('click', saveContent);
injectTemplateBtn.addEventListener('click', initializeStarterContent);
logoutBtn.addEventListener('click', logout);
saveApiBaseBtn.addEventListener('click', saveApiBase);
refreshAuditBtn.addEventListener('click', loadAudit);
setupMfaBtn.addEventListener('click', setupMfa);
langEnBtn.addEventListener('click', () => setLanguage('en'));
langKaBtn.addEventListener('click', () => setLanguage('ka'));
formatBtn.addEventListener('click', applyAdvancedJson);

if (accessToken) {
  setAuthState(true);
  Promise.all([loadContent(), loadAudit()]).catch(() => logout());
} else {
  setAuthState(false);
}
