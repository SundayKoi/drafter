import { useMemo } from 'react';
import { SiteLayout } from '../components/SiteLayout';
import { useMatches, useTeams } from '../hooks/useSiteData';
import type { Match, Team } from '../types';

export function ScoresPage() {
  const { data: matches, loading } = useMatches();
  const { data: teams } = useTeams();

  const teamMap = useMemo(() => {
    const m = new Map<string, Team>();
    teams?.forEach((t) => m.set(t.id, t));
    return m;
  }, [teams]);

  const upcoming = matches?.filter((m) => m.status === 'scheduled') ?? [];
  const results = matches?.filter((m) => m.status === 'completed') ?? [];

  return (
    <SiteLayout>
      <h1 className="mb-6 font-display text-5xl tracking-wider">SCORES</h1>

      {loading && <div className="mt-8 text-[#666]">Loading…</div>}

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl tracking-wider text-[#F5A800]">UPCOMING</h2>
        {upcoming.length === 0 ? (
          <div className="text-[#666]">No upcoming matches.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} teamMap={teamMap} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-2xl tracking-wider text-[#F5A800]">RESULTS</h2>
        {results.length === 0 ? (
          <div className="text-[#666]">No results yet.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((m) => (
              <MatchCard key={m.id} match={m} teamMap={teamMap} />
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function MatchCard({ match, teamMap }: { match: Match; teamMap: Map<string, Team> }) {
  const blue = teamMap.get(match.blue_team_id);
  const red = teamMap.get(match.red_team_id);
  const completed = match.status === 'completed';
  const blueWin = completed && match.winner_id === match.blue_team_id;
  const redWin = completed && match.winner_id === match.red_team_id;

  return (
    <div className="rounded border border-[#2A2A2A] bg-[#141414] p-4">
      <div className="flex items-center justify-between">
        <TeamSide name={blue?.name ?? '???'} logo={blue?.logo_url} dim={completed && !blueWin} />
        <div className="px-4 text-center">
          {completed ? (
            <div className="font-mono text-3xl">
              {match.blue_score}–{match.red_score}
            </div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-widest text-[#8A9099]">VS</div>
          )}
        </div>
        <TeamSide
          name={red?.name ?? '???'}
          logo={red?.logo_url}
          dim={completed && !redWin}
          alignRight
        />
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-xs text-[#666]">
        <span>{new Date(match.scheduled_at).toLocaleString()}</span>
        {match.vod_url && (
          <a href={match.vod_url} target="_blank" rel="noreferrer" className="text-[#F5A800]">
            VOD →
          </a>
        )}
      </div>
    </div>
  );
}

function TeamSide({
  name,
  logo,
  dim,
  alignRight,
}: {
  name: string;
  logo?: string | null;
  dim?: boolean;
  alignRight?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-3 ${
        alignRight ? 'flex-row-reverse text-right' : ''
      } ${dim ? 'opacity-50' : ''}`}
    >
      {logo && <img src={logo} alt="" className="h-10 w-10 rounded" />}
      <span className="font-display text-xl tracking-wide">{name}</span>
    </div>
  );
}
