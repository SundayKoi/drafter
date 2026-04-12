import { SITE_BRAND } from '../brand';
import type { LeagueId } from '../types';

export function LeagueFilter({
  value,
  onChange,
}: {
  value: LeagueId;
  onChange: (id: LeagueId) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-[#2A2A2A]">
      {SITE_BRAND.leagues.map((lg) => {
        const active = value === lg.id;
        return (
          <button
            key={lg.id}
            onClick={() => onChange(lg.id as LeagueId)}
            className={`relative px-5 py-3 font-display text-xl tracking-wider transition ${
              active ? 'text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {lg.name.toUpperCase()}
            {active && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5"
                style={{ background: lg.color, boxShadow: `0 0 12px ${lg.color}` }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function leagueColor(id: LeagueId): string {
  return SITE_BRAND.leagues.find((l) => l.id === id)?.color ?? '#fff';
}
