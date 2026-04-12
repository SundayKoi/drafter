import { useMemo, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import { LeagueFilter } from '../../components/LeagueFilter';
import { useMatches, useSettings, useTeams } from '../../hooks/useSiteData';
import type { LeagueId, Match, MatchStatus, Team } from '../../types';

export function ScoresManagerPage() {
  const { settings } = useSettings();
  const season = settings.current_season || 'S1';
  const [league, setLeague] = useState<LeagueId>('cinder');
  const { data: matches, loading } = useMatches(league, season);
  const { data: teams } = useTeams(league);
  const [editing, setEditing] = useState<Match | null>(null);
  const [creating, setCreating] = useState(false);

  const teamMap = useMemo(() => {
    const m = new Map<string, Team>();
    teams?.forEach((t) => m.set(t.id, t));
    return m;
  }, [teams]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-wider">SCORES</h1>
        <button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="rounded bg-[#E63000] px-4 py-2 font-display text-sm tracking-wider"
        >
          + NEW MATCH
        </button>
      </div>
      <div className="mt-4">
        <LeagueFilter value={league} onChange={setLeague} />
      </div>

      {loading && <div className="mt-4 text-[#666]">Loading…</div>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 font-display text-lg tracking-wider text-[#8A9099]">MATCHES</div>
          <ul className="divide-y divide-[#2A2A2A] rounded border border-[#2A2A2A] bg-[#141414]">
            {matches?.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => {
                    setEditing(m);
                    setCreating(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#1C1C1C] ${
                    editing?.id === m.id ? 'bg-[#1C1C1C]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {teamMap.get(m.blue_team_id)?.name ?? '???'} vs{' '}
                      {teamMap.get(m.red_team_id)?.name ?? '???'}
                    </span>
                    <span className="font-mono text-xs uppercase text-[#8A9099]">
                      {m.status}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[#666]">
                    {new Date(m.scheduled_at).toLocaleString()}
                    {m.status === 'completed' &&
                      ` · ${m.blue_score}-${m.red_score}`}
                  </div>
                </button>
              </li>
            ))}
            {matches?.length === 0 && <li className="p-4 text-[#666]">No matches.</li>}
          </ul>
        </div>

        <div>
          {(creating || editing) && teams && (
            <MatchForm
              teams={teams}
              league={league}
              season={season}
              match={editing}
              onDone={() => {
                setCreating(false);
                setEditing(null);
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MatchForm({
  teams,
  league,
  season,
  match,
  onDone,
}: {
  teams: Team[];
  league: LeagueId;
  season: string;
  match: Match | null;
  onDone: () => void;
}) {
  const [blue, setBlue] = useState(match?.blue_team_id ?? teams[0]?.id ?? '');
  const [red, setRed] = useState(match?.red_team_id ?? teams[1]?.id ?? teams[0]?.id ?? '');
  const [blueScore, setBlueScore] = useState<string>(
    match?.blue_score != null ? String(match.blue_score) : '',
  );
  const [redScore, setRedScore] = useState<string>(
    match?.red_score != null ? String(match.red_score) : '',
  );
  const [scheduledAt, setScheduledAt] = useState(
    match?.scheduled_at
      ? new Date(match.scheduled_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [vodUrl, setVodUrl] = useState(match?.vod_url ?? '');
  const [status, setStatus] = useState<MatchStatus>(match?.status ?? 'scheduled');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const blueN = blueScore ? Number(blueScore) : null;
      const redN = redScore ? Number(redScore) : null;
      const winner =
        status === 'completed' && blueN != null && redN != null
          ? blueN > redN
            ? blue
            : red
          : null;
      const body = {
        league_id: league,
        season,
        blue_team_id: blue,
        red_team_id: red,
        blue_score: blueN,
        red_score: redN,
        winner_id: winner,
        scheduled_at: new Date(scheduledAt).toISOString(),
        played_at: status === 'completed' ? new Date().toISOString() : null,
        vod_url: vodUrl || null,
        status,
      };
      if (match) {
        await api(`/matches/${match.id}`, { method: 'PUT', body });
      } else {
        await api('/matches', { method: 'POST', body });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!match) return;
    if (!confirm('Delete this match?')) return;
    setBusy(true);
    try {
      await api(`/matches/${match.id}`, { method: 'DELETE' });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded border border-[#2A2A2A] bg-[#141414] p-5"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Blue">
          <select value={blue} onChange={(e) => setBlue(e.target.value)} className={inputCls}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Red">
          <select value={red} onChange={(e) => setRed(e.target.value)} className={inputCls}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Blue score">
          <input
            value={blueScore}
            onChange={(e) => setBlueScore(e.target.value)}
            inputMode="numeric"
            className={inputCls}
          />
        </Field>
        <Field label="Red score">
          <input
            value={redScore}
            onChange={(e) => setRedScore(e.target.value)}
            inputMode="numeric"
            className={inputCls}
          />
        </Field>
        <Field label="Scheduled at">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MatchStatus)}
            className={inputCls}
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
      </div>
      <Field label="VOD URL">
        <input
          value={vodUrl}
          onChange={(e) => setVodUrl(e.target.value)}
          placeholder="https://..."
          className={inputCls}
        />
      </Field>

      {error && <div className="text-sm text-[#E63000]">{error}</div>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy || blue === red}
          className="rounded bg-[#E63000] px-5 py-2 font-display tracking-wider disabled:opacity-40"
        >
          {match ? 'SAVE' : 'CREATE'}
        </button>
        {match && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded border border-[#E63000] px-4 py-2 text-sm text-[#E63000]"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 focus:border-[#F5A800] focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-[#8A9099]">
      <div className="mb-1">{label}</div>
      {children}
    </label>
  );
}
