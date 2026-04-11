interface FearlessPoolProps {
  pool: string[];
  patch: string | null;
}

function iconUrl(patch: string, championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${championId}.png`;
}

export function FearlessPool({ pool, patch }: FearlessPoolProps) {
  if (pool.length === 0 || !patch) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="font-display text-sm text-fearless-text uppercase tracking-widest">
        Fearless Locked ({pool.length})
      </span>

      <div className="flex flex-wrap gap-1">
        {pool.map((championId) => (
          <div
            key={championId}
            className="relative w-8 h-8 rounded overflow-hidden border border-fearless/60"
            title={championId}
          >
            <img
              src={iconUrl(patch, championId)}
              alt={championId}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-fearless/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
