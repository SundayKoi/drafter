import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SiteLayout } from '../components/SiteLayout';
import { LeagueFilter, leagueColor } from '../components/LeagueFilter';
import { useStandings } from '../hooks/useSiteData';
import type { LeagueId } from '../types';

export function StandingsPage() {
  const [params, setParams] = useSearchParams();
  const initial = (params.get('league') as LeagueId) ?? 'cinder';
  const [league, setLeague] = useState<LeagueId>(initial);
  const { data, loading } = useStandings(league);

  const setLg = (id: LeagueId) => {
    setLeague(id);
    setParams({ league: id });
  };

  return (
    <SiteLayout>
      <h1 className="mb-6 font-display text-5xl tracking-wider">STANDINGS</h1>
      <LeagueFilter value={league} onChange={setLg} />

      <div className="mt-6 overflow-x-auto rounded border border-[#2A2A2A] bg-[#141414]">
        <table className="w-full text-left">
          <thead className="bg-[#1C1C1C] font-display text-sm uppercase tracking-wider text-[#8A9099]">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-right font-mono">W</th>
              <th className="px-4 py-3 text-right font-mono">L</th>
              <th className="px-4 py-3 text-right font-mono">W%</th>
              <th className="px-4 py-3 text-right font-mono">+/-</th>
              <th className="px-4 py-3 text-right font-mono">Streak</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#666]">
                  Loading…
                </td>
              </tr>
            )}
            {data?.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#666]">
                  No standings yet.
                </td>
              </tr>
            )}
            {data?.map((row, i) => {
              const total = row.wins + row.losses;
              const pct = total > 0 ? Math.round((row.wins / total) * 100) : 0;
              return (
                <tr
                  key={row.team_id}
                  className="border-t border-[#2A2A2A] hover:bg-[#1C1C1C]"
                  style={i === 0 ? { borderLeft: `3px solid ${leagueColor(league)}` } : undefined}
                >
                  <td className="px-4 py-3 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.team_logo_url && (
                        <img src={row.team_logo_url} alt="" className="h-6 w-6 rounded" />
                      )}
                      <span className="font-display text-lg tracking-wide">{row.team_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{row.wins}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.losses}</td>
                  <td className="px-4 py-3 text-right font-mono">{pct}%</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.point_diff > 0 ? `+${row.point_diff}` : row.point_diff}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.streak !== 0 && (
                      <span
                        className={`inline-block rounded px-2 py-0.5 font-mono text-xs ${
                          row.streak > 0 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}
                      >
                        {row.streak > 0 ? 'W' : 'L'}
                        {Math.abs(row.streak)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SiteLayout>
  );
}
