import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { SITE_BRAND } from '../../brand';

export function LoginPage() {
  const { staff, login, loading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <FullBleed>Loading…</FullBleed>;
  if (staff) {
    const dest = (location.state as { from?: string } | null)?.from ?? '/admin';
    return <Navigate to={dest} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDiscord() {
    try {
      const { url } = await api<{ url: string }>('/auth/discord/redirect', { auth: false });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discord login unavailable');
    }
  }

  return (
    <FullBleed>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded border border-[#2A2A2A] bg-[#141414] p-8"
      >
        <img src={SITE_BRAND.logoUrl} alt="" className="mx-auto h-14 w-14" />
        <h1 className="mt-4 text-center font-display text-3xl tracking-wider">STAFF LOGIN</h1>

        <label className="mt-6 block text-sm text-[#8A9099]">
          Email
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 text-white focus:border-[#F5A800] focus:outline-none"
          />
        </label>
        <label className="mt-4 block text-sm text-[#8A9099]">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 text-white focus:border-[#F5A800] focus:outline-none"
          />
        </label>

        {error && <div className="mt-4 text-sm text-[#E63000]">{error}</div>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded bg-[#E63000] py-2 font-display tracking-wider disabled:opacity-50"
        >
          {busy ? 'SIGNING IN…' : 'SIGN IN'}
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-[#666]">
          <span className="flex-1 border-t border-[#2A2A2A]" />
          OR
          <span className="flex-1 border-t border-[#2A2A2A]" />
        </div>

        <button
          type="button"
          onClick={onDiscord}
          className="w-full rounded border border-[#5865F2] py-2 font-display tracking-wider text-[#5865F2] hover:bg-[#5865F2]/10"
        >
          CONTINUE WITH DISCORD
        </button>
      </form>
    </FullBleed>
  );
}

function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-6 text-white">
      {children}
    </div>
  );
}
