import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api/client';
import { LeagueFilter } from '../../components/LeagueFilter';
import { useSettings, useStandings, useTeams } from '../../hooks/useSiteData';
import type { LeagueId, Standing } from '../../types';

interface RowState {
  team_id: string;
  wins: number;
  losses: number;
  point_diff: number;
  streak: number;
}

export function StandingsManagerPage() {
  const { settings } = useSettings();
  const season = settings.current_season || 'S1';
  const [league, setLeague] = useState<LeagueId>('cinder');
  const { data: teams } = useTeams(league);
  const { data: standings, loading } = useStandings(league, season);
  const [rows, setRows] = useState<RowState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!teams) return;
    const map = new Map<string, Standing>();
    standings?.forEach((s) => map.set(s.team_id, s));
    setRows(
      teams.map((t) => {
        const s = map.get(t.id);
        return {
          team_id: t.id,
          wins: s?.wins ?? 0,
          losses: s?.losses ?? 0,
          point_diff: s?.point_diff ?? 0,
          streak: s?.streak ?? 0,
        };
      }),
    );
  }, [teams, standings]);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api(`/standings?league=${league}&season=${encodeURIComponent(season)}`, {
        method: 'PUT',
        body: rows,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const update = (i: number, patch: Partial<RowState>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div>
      <h1 className="font-display text-4xl tracking-wider">STANDINGS</h1>
      <div className="mt-1 font-mono text-xs text-[#666]">Season {season}</div>
      <div className="mt-4">
        <LeagueFilter value={league} onChange={setLeague} />
      </div>

      {loading && <div className="mt-4 text-[#666]">Loading…</div>}

      <table className="mt-4 w-full">
        <thead className="font-display text-sm uppercase tracking-wider text-[#8A9099]">
          <tr>
            <th className="p-2 text-left">Team</th>
            <th className="p-2 text-right font-mono">W</th>
            <th className="p-2 text-right font-mono">L</th>
            <th className="p-2 text-right font-mono">+/-</th>
            <th className="p-2 text-right font-mono">Streak</th>
          </tr>
        </thead>
        <tbody>
          {teams?.map((t, i) => {
            const r = rows[i];
            if (!r) return null;
            return (
              <tr key={t.id} className="border-t border-[#2A2A2A]">
                <td className="p-2">{t.name}</td>
                <td className="p-2 text-right">
                  <NumInput
                    value={r.wins}
                    onChange={(v) => update(i, { wins: v })}
                  />
                </td>
                <td className="p-2 text-right">
                  <NumInput
                    value={r.losses}
                    onChange={(v) => update(i, { losses: v })}
                  />
                </td>
                <td className="p-2 text-right">
                  <NumInput
                    value={r.point_diff}
                    onChange={(v) => update(i, { point_diff: v })}
                  />
                </td>
                <td className="p-2 text-right">
                  <NumInput
                    value={r.streak}
                    onChange={(v) => update(i, { streak: v })}
                  />
                </td>
              </tr>
            );
          })}
          {teams?.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-[#666]">
                No teams in this league yet — approve applications first.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {error && <div className="mt-3 text-sm text-[#E63000]">{error}</div>}
      {saved && <div className="mt-3 text-sm text-green-400">Saved.</div>}

      <div className="mt-4 flex gap-3">
        <button
          onClick={save}
          disabled={saving || !teams?.length}
          className="rounded bg-[#E63000] px-6 py-2 font-display tracking-wider disabled:opacity-40"
        >
          {saving ? 'SAVING…' : 'SAVE'}
        </button>
      </div>

      <SheetsImport league={league} season={season} />
    </div>
  );
}

function NumInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-20 rounded border border-[#2A2A2A] bg-[#0D0D0D] px-2 py-1 text-right font-mono"
    />
  );
}

interface PreviewRow {
  team_name: string;
  matched_team_id: string | null;
  wins: number;
  losses: number;
  point_diff: number;
}
interface PreviewResult {
  rows: PreviewRow[];
  unmatched: string[];
  will_update: number;
}

function SheetsImport({ league, season }: { league: LeagueId; season: string }) {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(confirm: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<PreviewResult>('/admin/sheets/import', {
        method: 'POST',
        body: { url, league, season, confirm },
      });
      setPreview(res);
      if (confirm) {
        setUrl('');
        setPreview(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded border border-[#2A2A2A] bg-[#141414] p-5">
      <h2 className="font-display text-xl tracking-wider text-[#F5A800]">
        GOOGLE SHEETS IMPORT
      </h2>
      <p className="mt-1 text-xs text-[#666]">
        Paste a published-to-web Google Sheets CSV URL. Preview first — import never
        auto-applies.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
          className="flex-1 rounded border border-[#2A2A2A] bg-[#0D0D0D] px-3 py-2 text-sm"
        />
        <button
          onClick={() => run(false)}
          disabled={busy || !url}
          className="rounded border border-white/30 px-4 py-2 text-sm disabled:opacity-40"
        >
          Preview
        </button>
      </div>
      {error && <div className="mt-2 text-sm text-[#E63000]">{error}</div>}
      {preview && (
        <div className="mt-4">
          <div className="text-xs text-[#8A9099]">
            {preview.will_update} rows will be updated. {preview.unmatched.length} unmatched.
          </div>
          <table className="mt-2 w-full text-sm">
            <thead className="text-xs uppercase text-[#8A9099]">
              <tr>
                <th className="p-1 text-left">Team</th>
                <th className="p-1 text-left">Matched</th>
                <th className="p-1 text-right">W</th>
                <th className="p-1 text-right">L</th>
                <th className="p-1 text-right">+/-</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r, i) => (
                <tr key={i} className="border-t border-[#2A2A2A]">
                  <td className="p-1">{r.team_name}</td>
                  <td className="p-1 font-mono text-xs">
                    {r.matched_team_id ?? (
                      <span className="text-[#E63000]">no match</span>
                    )}
                  </td>
                  <td className="p-1 text-right font-mono">{r.wins}</td>
                  <td className="p-1 text-right font-mono">{r.losses}</td>
                  <td className="p-1 text-right font-mono">{r.point_diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => run(true)}
            disabled={busy}
            className="mt-3 rounded bg-[#E63000] px-4 py-2 text-sm font-display tracking-wider disabled:opacity-40"
          >
            CONFIRM IMPORT
          </button>
        </div>
      )}
    </section>
  );
}
