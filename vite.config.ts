import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

function resolveBase(mode: string): string {
  if (mode !== 'production') return '/';
  const explicit = process.env.VITE_BASE_PATH;
  if (explicit) return explicit.startsWith('/') ? explicit : `/${explicit}`;
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return repo ? `/${repo}/` : '/';
}

export default defineConfig(({ mode }) => ({
  base: resolveBase(mode),
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
