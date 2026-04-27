import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
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

function hash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => (raw += c));
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
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  if (req.url === '/api/auth/register' && req.method === 'POST') {
    const body = await parseBody(req).catch(() => null);
    if (!body?.username || !body?.password) return send(res, 400, { error: 'username/password required' });
    const store = await readStore();
    if (store.users.some(u => u.username === body.username)) return send(res, 409, { error: 'Username exists' });
    const token = crypto.randomBytes(24).toString('hex');
    const user = {
      username: body.username,
      passwordHash: hash(body.password),
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
    const user = store.users.find(u => u.username === body.username && u.passwordHash === hash(body.password));
    if (!user) return send(res, 401, { error: 'Invalid credentials' });
    user.token = crypto.randomBytes(24).toString('hex');
    await writeStore(store);
    return send(res, 200, sanitizeUser(user));
  }

  if (req.url === '/api/user/data' && req.method === 'GET') {
    const token = getToken(req);
    const store = await readStore();
    const user = store.users.find(u => u.token === token);
    if (!user) return send(res, 401, { error: 'Unauthorized' });
    return send(res, 200, user.data ?? { tests: [], settings: {}, timetableOptIn: true });
  }

  if (req.url === '/api/user/data' && req.method === 'PUT') {
    const token = getToken(req);
    const body = await parseBody(req).catch(() => null);
    const store = await readStore();
    const user = store.users.find(u => u.token === token);
    if (!user) return send(res, 401, { error: 'Unauthorized' });
    user.data = body ?? { tests: [] };
    await writeStore(store);
    return send(res, 200, { ok: true });
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Local auth/data server listening on http://localhost:${PORT}`);
});
