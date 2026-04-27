import { useEffect, useState } from 'react';
import { getAuthSession, login, migrateLegacyTestsIfNeeded, register, setAuthSession } from '@/lib/serverApi';

interface Props { children: React.ReactNode }

export default function AuthGate({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const existing = getAuthSession();
    setReady(!!existing);
  }, []);

  const submit = async () => {
    setError('');
    try {
      const session = mode === 'login' ? await login(username, password) : await register(username, password);
      setAuthSession(session);
      await migrateLegacyTestsIfNeeded(session.token);
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (ready) return <>{children}</>;

  return (
    <div className="min-h-screen bg-jee-gray flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-border rounded-md p-5 space-y-4">
        <h1 className="text-xl font-extrabold">ExamSim Login</h1>
        <p className="text-xs text-muted-foreground">Local multi-user auth (server-backed). On GitHub Pages, it automatically falls back to offline local mode.</p>
        <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full border rounded px-3 py-2 text-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button className="w-full bg-primary text-primary-foreground rounded py-2 text-sm font-bold" onClick={submit}>
          {mode === 'login' ? 'Login' : 'Create Account'}
        </button>
        <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Register' : 'Already have account? Login'}
        </button>
      </div>
    </div>
  );
}
