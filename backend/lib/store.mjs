import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword, randomId } from './crypto.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, '../data/store.json');

function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    const jwtSecret = process.env.JWT_SECRET || randomId().replace(/-/g, '');
    const email = process.env.ADMIN_EMAIL || 'admin@eliteweddings.local';
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const { salt, hash } = hashPassword(password);

    const initial = {
      createdAt: new Date().toISOString(),
      jwtSecret,
      users: [
        {
          id: randomId(),
          email: email.toLowerCase(),
          passwordSalt: salt,
          passwordHash: hash,
          mfaEnabled: false,
          mfaSecret: null,
          recoveryCodes: [],
          createdAt: new Date().toISOString()
        }
      ],
      content: null,
      auditLogs: []
    };

    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));

    console.log(`[backend] Created store with default admin ${email}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log('[backend] Default password: ChangeMe123! (change immediately)');
    }
  }
}

export function loadStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

export function saveStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

export function appendAuditLog(entry) {
  const store = loadStore();
  store.auditLogs.push({
    id: randomId(),
    at: new Date().toISOString(),
    ...entry
  });
  saveStore(store);
}
