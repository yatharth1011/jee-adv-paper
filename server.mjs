import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
// Local-only by default: the Vite dev server proxies /api here, so nothing
// else needs to reach it. Set HOST=0.0.0.0 to expose it on your network.
const HOST = process.env.HOST || 'localhost';
const MAX_BODY = 10 * 1024 * 1024;
const dataDir = path.join(process.cwd(), 'server-data');
const dataFile = path.join(dataDir, 'users.json');

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify({ users: [] }, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw);
}

async function writeStore(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

// Passwords are stored as salted scrypt ("scrypt$<salt>$<hash>"). Accounts
// created before this used unsalted SHA-256; they still log in and are
// upgraded to scrypt on their next successful login.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function safeEqual(a, b) {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('scrypt$')) {
    const [, salt, expected] = stored.split('$');
    return safeEqual(crypto.scryptSync(String(password), salt, 32).toString('hex'), expected);
  }
  return safeEqual(crypto.createHash('sha256').update(String(password)).digest('hex'), stored);
}

function send(res, status, body) {
  // No CORS headers: the app reaches this server same-origin through Vite's
  // /api proxy, so other websites must not be able to call it.
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function getToken(req) {
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ')) return '';
  return auth.slice('Bearer '.length);
}

function sanitizeUser(u) {
  return { username: u.username, token: u.token };
}

const server = http.createServer(async (req, res) => {

  if (req.url === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req).catch(() => null);
    if (!body?.username || !body?.password) return send(res, 400, { error: 'username/password required' });
    const store = await readStore();
    if (store.users.some(u => u.username === body.username)) return send(res, 409, { error: 'Username exists' });
    const token = crypto.randomBytes(24).toString('hex');
    const user = {
      username: body.username,
      passwordHash: hashPassword(body.password),
      token,
      data: { tests: [], settings: {}, timetableOptIn: true },
    };
    store.users.push(user);
    await writeStore(store);
    return send(res, 200, sanitizeUser(user));
  }

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req).catch(() => null);
    if (!body?.username || !body?.password) return send(res, 400, { error: 'username/password required' });
    const store = await readStore();
    const user = store.users.find(u => u.username === body.username);
    if (!user || !verifyPassword(body.password, user.passwordHash)) return send(res, 401, { error: 'Invalid credentials' });
    if (!user.passwordHash.startsWith('scrypt$')) user.passwordHash = hashPassword(body.password);
    user.token = crypto.randomBytes(24).toString('hex');
    await writeStore(store);
    return send(res, 200, sanitizeUser(user));
  }

  if (req.url === '/api/user/data' && req.method === 'GET') {
    const token = getToken(req);
    const store = await readStore();
    const user = token && store.users.find(u => u.token === token);
    if (!user) return send(res, 401, { error: 'Unauthorized' });
    return send(res, 200, user.data ?? { tests: [], settings: {}, timetableOptIn: true });
  }

  if (req.url === '/api/user/data' && req.method === 'PUT') {
    const token = getToken(req);
    const body = await parseBody(req).catch(() => null);
    const store = await readStore();
    const user = token && store.users.find(u => u.token === token);
    if (!user) return send(res, 401, { error: 'Unauthorized' });
    if (!body || typeof body !== 'object') return send(res, 400, { error: 'Invalid data' });
    user.data = body ?? { tests: [] };
    await writeStore(store);
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Local auth/data server listening on http://${HOST}:${PORT}`);
});
