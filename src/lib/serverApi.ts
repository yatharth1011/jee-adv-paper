import { TestSession } from './types';

const AUTH_KEY = 'examSimulator_auth';
const LEGACY_TESTS_KEY = 'examSimulator_tests';
const OFFLINE_USER_KEY = 'examSimulator_offline_user_data';
const API_BASE = '/api';

export interface AuthSession { username: string; token: string }
export interface UserData { tests: TestSession[]; settings?: Record<string, unknown>; timetableOptIn?: boolean }

function offlineToken(username: string): string {
  return `offline:${username}`;
}

function isOfflineToken(token?: string): boolean {
  return !!token && token.startsWith('offline:');
}

function readOfflineData(): UserData {
  try {
    const raw = localStorage.getItem(OFFLINE_USER_KEY);
    if (!raw) return { tests: [], settings: {}, timetableOptIn: true };
    return JSON.parse(raw);
  } catch {
    return { tests: [], settings: {}, timetableOptIn: true };
  }
}

function writeOfflineData(data: UserData) {
  localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(data));
}

export function getAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSession | null) {
  if (!session) localStorage.removeItem(AUTH_KEY);
  else localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed: ${res.status}`);
  return body as T;
}

export async function login(username: string, password: string): Promise<AuthSession> {
  try {
    return await api<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  } catch {
    return { username, token: offlineToken(username) };
  }
}

export async function register(username: string, password: string): Promise<AuthSession> {
  try {
    return await api<AuthSession>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
  } catch {
    return { username, token: offlineToken(username) };
  }
}

export async function getUserData(token: string): Promise<UserData> {
  if (isOfflineToken(token)) return readOfflineData();
  return api<UserData>('/user/data', { method: 'GET' }, token);
}

export async function putUserData(token: string, data: UserData): Promise<void> {
  if (isOfflineToken(token)) {
    writeOfflineData(data);
    return;
  }
  await api('/user/data', { method: 'PUT', body: JSON.stringify(data) }, token);
}

export async function migrateLegacyTestsIfNeeded(token: string): Promise<void> {
  const raw = localStorage.getItem(LEGACY_TESTS_KEY);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    localStorage.removeItem(LEGACY_TESTS_KEY);
    return;
  }
  const current = await getUserData(token);
  const mergedIds = new Set(current.tests.map(t => t.id));
  const merged = [...current.tests];
  for (const t of parsed) {
    if (!mergedIds.has(t.id)) merged.push(t);
  }
  await putUserData(token, { ...current, tests: merged });
  localStorage.removeItem(LEGACY_TESTS_KEY);
}
