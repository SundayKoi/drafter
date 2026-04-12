import { useState, type FormEvent } from 'react';
import { SiteLayout } from '../components/SiteLayout';
import { SITE_BRAND } from '../brand';
import { api, ApiError } from '../api/client';
import { useSettings } from '../hooks/useSiteData';
import { validateOpggUrl } from '../utils/opgg';
import type { LeagueId, Role } from '../types';

interface PlayerRowState {
  summoner_name: string;
  opgg_url: string;
  role: Role;
  is_captain: boolean;
}

const EMPTY_PLAYER: PlayerRowState = {
  summoner_name: '',
  opgg_url: '',
  role: 'top',
  is_captain: false,
};

export function ApplyPage() {
  const { settings, loading } = useSettings();
  const closed = loading ? false : (settings.applications_open ?? 'true') !== 'true';

  if (loading) {
    return (
      <SiteLayout>
        <div className="py-16 text-center text-[#666]">Loading…</div>
      </SiteLayout>
    );
  }
  if (closed) {
    return (
      <SiteLayout>
        <div className="py-16 text-center">
          <h1 className="font-display text-5xl tracking-wider">APPLICATIONS CLOSED</h1>
          <p className="mt-4 text-[#8A9099]">
            Check back next season for a chance to compete.
          </p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <h1 className="mb-6 font-display text-5xl tracking-wider">APPLY</h1>
      <ApplicationForm />
    </SiteLayout>
  );
}

function ApplicationForm() {
  const [league, setLeague] = useState<LeagueId | null>(null);
  const [teamName, setTeamName] = useState('');
  const [bio, setBio] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactDiscord, setContactDiscord] = useState('');
  const [players, setPlayers] = useState<PlayerRowState[]>(
    Array.from({ length: 5 }, () => ({ ...EMPTY_PLAYER })),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const captains = players.filter((p) => p.is_captain).length;
  const opggBad = players.some((p) => !validateOpggUrl(p.opgg_url));
  const canSubmit =
    league &&
    teamName.trim() &&
    bio.trim() &&
    contactName.trim() &&
    contactEmail.includes('@') &&
    contactDiscord.trim() &&
    captains === 1 &&
    !opggBad;

  function updatePlayer(i: number, patch: Partial<PlayerRowState>) {
    setPlayers((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function setCaptain(i: number) {
    setPlayers((ps) => ps.map((p, idx) => ({ ...p, is_captain: idx === i })));
  }

  async function onLogo(file: File) {
    setLogoBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(
        `${(import.meta.env.VITE_API_BASE ?? '') as string}/upload/public-logo`,
        { method: 'POST', body: fd },
      );
      if (!res.ok) throw new Error((await res.json()).detail ?? 'Upload failed');
      const data = (await res.json()) as { url: string };
      setLogoUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLogoBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || !league) return;
    setBusy(true);
    setError(null);
    try {
      await api('/apply', {
        method: 'POST',
        auth: false,
        body: {
          league_id: league,
          team_name: teamName,
          logo_url: logoUrl,
          bio,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_discord: contactDiscord,
          players,
        },
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Submission failed',
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded border border-[#2A2A2A] bg-[#141414] p-10 text-center">
        <h2 className="font-display text-3xl tracking-wider text-[#F5A800]">
          APPLICATION SUBMITTED
        </h2>
        <p className="mt-3 text-[#8A9099]">
          Our staff will review your team and reach out via the Discord you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section>
        <div className="mb-3 font-display text-xl tracking-wider text-[#8A9099]">LEAGUE</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {SITE_BRAND.leagues.map((lg) => (
            <button
              key={lg.id}
              type="button"
              onClick={() => setLeague(lg.id as LeagueId)}
              className={`rounded border px-4 py-4 text-left transition ${
                league === lg.id
                  ? 'border-white bg-[#1C1C1C]'
                  : 'border-[#2A2A2A] bg-[#141414] hover:border-white/40'
              }`}
              style={
                league === lg.id
                  ? { boxShadow: `inset 0 0 0 1px ${lg.color}` }
                  : undefined
              }
            >
              <div className="font-display text-2xl" style={{ color: lg.color }}>
                {lg.name.toUpperCase()}
              </div>
              <div className="font-mono text-xs text-[#666]">TIER {lg.tier}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Field label="Team Name*">
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            maxLength={100}
            required
            className={inputCls}
          />
        </Field>
        <Field label="Team Logo (PNG/JPG/WebP, 2MB max)">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])}
              className="text-sm text-[#8A9099]"
            />
            {logoBusy && <span className="font-mono text-xs text-[#666]">uploading…</span>}
            {logoUrl && <img src={logoUrl} alt="" className="h-10 w-10 rounded" />}
          </div>
        </Field>
        <Field label="Team Bio*" full>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            required
            rows={4}
            className={inputCls}
          />
          <div className="mt-1 text-right font-mono text-xs text-[#666]">{bio.length}/500</div>
        </Field>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Field label="Contact Name*">
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            maxLength={100}
            required
            className={inputCls}
          />
        </Field>
        <Field label="Contact Email*">
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            maxLength={254}
            required
            className={inputCls}
          />
        </Field>
        <Field label="Contact Discord*">
          <input
            value={contactDiscord}
            onChange={(e) => setContactDiscord(e.target.value)}
            maxLength={100}
            required
            className={inputCls}
          />
        </Field>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-xl tracking-wider text-[#8A9099]">
            ROSTER ({players.length}/7 — min 5, exactly one captain)
          </div>
          {players.length < 7 && (
            <button
              type="button"
              onClick={() => setPlayers((ps) => [...ps, { ...EMPTY_PLAYER }])}
              className="rounded border border-[#2A2A2A] px-3 py-1 text-sm hover:border-white"
            >
              + Add Player
            </button>
          )}
        </div>
        <div className="space-y-2">
          {players.map((p, i) => {
            const opggOk = !p.opgg_url || validateOpggUrl(p.opgg_url);
            return (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 rounded border border-[#2A2A2A] bg-[#141414] p-3"
              >
                <input
                  value={p.summoner_name}
                  onChange={(e) => updatePlayer(i, { summoner_name: e.target.value })}
                  placeholder="Summoner"
                  maxLength={50}
                  required
                  className={`col-span-3 ${inputCls}`}
                />
                <input
                  value={p.opgg_url}
                  onChange={(e) => updatePlayer(i, { opgg_url: e.target.value })}
                  placeholder="https://op.gg/summoners/na/…"
                  maxLength={500}
                  required
                  className={`col-span-5 ${inputCls} ${
                    !opggOk ? 'border-[#E63000]' : ''
                  }`}
                />
                <select
                  value={p.role}
                  onChange={(e) => updatePlayer(i, { role: e.target.value as Role })}
                  className={`col-span-2 ${inputCls}`}
                >
                  <option value="top">Top</option>
                  <option value="jungle">Jungle</option>
                  <option value="mid">Mid</option>
                  <option value="bot">Bot</option>
                  <option value="support">Support</option>
                </select>
                <label className="col-span-1 flex items-center justify-center text-xs">
                  <input
                    type="radio"
                    name="captain"
                    checked={p.is_captain}
                    onChange={() => setCaptain(i)}
                    className="mr-1"
                  />
                  C
                </label>
                <div className="col-span-1 flex items-center justify-end">
                  {players.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setPlayers((ps) => ps.filter((_, idx) => idx !== i))}
                      className="text-[#666] hover:text-[#E63000]"
                    >
                      −
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {error && <div className="text-sm text-[#E63000]">{error}</div>}

      <button
        type="submit"
        disabled={!canSubmit || busy}
        className="rounded bg-[#E63000] px-8 py-3 font-display text-lg tracking-wider disabled:opacity-40"
      >
        {busy ? 'SUBMITTING…' : 'SUBMIT APPLICATION'}
      </button>
    </form>
  );
}

const inputCls =
  'w-full rounded border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 text-white focus:border-[#F5A800] focus:outline-none';

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? 'md:col-span-2' : ''}`}>
      <div className="mb-1 text-sm text-[#8A9099]">{label}</div>
      {children}
    </label>
  );
}
