import { useDraftStore } from '../../hooks/useDraft';
import type { ChampionMap } from '../../types/champion';

interface HoverPreviewProps {
  championMap: ChampionMap;
  patch: string | null;
}

function splashUrl(championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`;
}

export function HoverPreview({ championMap, patch }: HoverPreviewProps) {
  const hoveredId = useDraftStore((s) => s.hoveredChampionId);
  const hoveredSide = useDraftStore((s) => s.hoveredSide);

  if (!hoveredId || !patch) return null;

  const champion = championMap[hoveredId];
  const sideColor = hoveredSide === 'blue' ? 'border-blue-side' : hoveredSide === 'red' ? 'border-red-side' : 'border-draft-border';

  return (
    <div className="fixed bottom-4 left-4 z-40 fade-in pointer-events-none">
      <div className={`relative w-72 rounded-lg overflow-hidden border-2 ${sideColor} shadow-2xl`}>
        <img
          src={splashUrl(hoveredId)}
          alt={hoveredId}
          className="w-full h-40 object-cover object-top"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3">
          <h3 className="font-display text-2xl text-white uppercase tracking-wide">
            {champion?.name ?? hoveredId}
          </h3>
          {champion && (
            <p className="font-mono text-[10px] text-muted mt-0.5">
              {champion.title}
            </p>
          )}
          {champion && (
            <div className="flex gap-2 mt-1">
              {champion.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-draft-surface/80 font-mono text-[9px] text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
