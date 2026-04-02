import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword, randomId } from './crypto.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, '../data/store.json');

const DATABASE_URL = process.env.DATABASE_URL || '';
const DATABASE_SSL = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true';
const PGSSLMODE = String(process.env.PGSSLMODE || '').toLowerCase();
const USE_DATABASE = DATABASE_URL.length > 0;
const DB_STORE_KEY = 'store';

let initialized = false;
let initPromise = null;
let pool = null;
let fileStoreCache = null;
let writeQueue = Promise.resolve();

function buildInitialStore() {
  const jwtSecret = process.env.JWT_SECRET || randomId().replace(/-/g, '');
  const email = process.env.ADMIN_EMAIL || 'admin@eliteweddings.local';
  const generatedPassword = randomId().replace(/-/g, '').slice(0, 16);
  const password = process.env.ADMIN_PASSWORD || generatedPassword;
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

  console.log(`[backend] Created store with default admin ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`[backend] Generated initial admin password: ${generatedPassword}`);
    console.log('[backend] Set ADMIN_PASSWORD in environment and rotate this generated credential immediately.');
  }

  return initial;
}

function clone(data) {
  return structuredClone(data);
}

async function readLocalStoreIfExists() {
  if (!existsSync(STORE_PATH)) {
    return null;
  }
  return JSON.parse(await fs.readFile(STORE_PATH, 'utf8'));
}

async function writeLocalStore(data) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function getPool() {
  if (pool) {
    return pool;
  }

  const { Pool } = await import('pg');
  const useSsl = DATABASE_SSL || PGSSLMODE === 'require';
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined
  });
  return pool;
}

async function ensureFileStore() {
  if (!existsSync(STORE_PATH)) {
    const initial = buildInitialStore();
    await writeLocalStore(initial);
    fileStoreCache = initial;
    return;
  }

  const existing = JSON.parse(await fs.readFile(STORE_PATH, 'utf8'));
  fileStoreCache = existing;
}

async function ensurePostgresStore() {
  const db = await getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const result = await db.query('SELECT value FROM app_state WHERE key = $1', [DB_STORE_KEY]);
  if (result.rowCount && result.rows[0]?.value) {
    return;
  }

  const fileStore = await readLocalStoreIfExists();
  const initial = fileStore ?? buildInitialStore();
  await db.query(
    `
      INSERT INTO app_state (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [DB_STORE_KEY, JSON.stringify(initial)]
  );

  if (fileStore) {
    console.log('[backend] Migrated local store.json into PostgreSQL.');
  }
}

async function ensureStore() {
  if (initialized) {
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      if (USE_DATABASE) {
        await ensurePostgresStore();
      } else {
        await ensureFileStore();
      }
      initialized = true;
    })();
  }

  await initPromise;
}

async function readStore() {
  if (USE_DATABASE) {
    const db = await getPool();
    const result = await db.query('SELECT value FROM app_state WHERE key = $1', [DB_STORE_KEY]);
    if (!result.rowCount || !result.rows[0]?.value) {
      throw new Error('Store state is missing in database.');
    }
    return result.rows[0].value;
  }

  if (fileStoreCache) {
    return clone(fileStoreCache);
  }

  const fromDisk = JSON.parse(await fs.readFile(STORE_PATH, 'utf8'));
  fileStoreCache = fromDisk;
  return clone(fromDisk);
}

async function persistStore(data) {
  if (USE_DATABASE) {
    const db = await getPool();
    await db.query(
      `
        INSERT INTO app_state (key, value, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
      [DB_STORE_KEY, JSON.stringify(data)]
    );
    return;
  }

  fileStoreCache = clone(data);
  await writeLocalStore(data);
}

export async function loadStore() {
  await ensureStore();
  return readStore();
}

export async function saveStore(data) {
  await ensureStore();
  writeQueue = writeQueue.then(() => persistStore(data));
  await writeQueue;
}

export async function appendAuditLog(entry) {
  const store = await loadStore();
  store.auditLogs.push({
    id: randomId(),
    at: new Date().toISOString(),
    ...entry
  });
  await saveStore(store);
}

process.on('exit', async () => {
  if (pool) {
    try {
      await pool.end();
    } catch {
      // ignore on shutdown
    }
  }
});
