import type { ChampionData } from '../../types/champion';

interface ChampionCardProps {
  champion: ChampionData;
  patch: string;
  isUsedThisDraft: boolean;
  isFearlessLocked: boolean;
  isCurrentActionPick: boolean;
  isDisabled: boolean;
  onClick: (championId: string) => void;
  onHover: (championId: string | null) => void;
}

function iconUrl(patch: string, championId: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${championId}.png`;
}

export function ChampionCard({
  champion,
  patch,
  isUsedThisDraft,
  isFearlessLocked,
  isCurrentActionPick,
  isDisabled,
  onClick,
  onHover,
}: ChampionCardProps) {
  // Three visual states:
  // 1. Available — normal, clickable
  // 2. Used this draft — grey overlay, not clickable
  // 3. Fearless locked — dark crimson overlay + blocked for picks only
  const fearlessBlocked = isFearlessLocked && isCurrentActionPick;
  const disabled = isDisabled || isUsedThisDraft || fearlessBlocked;

  return (
    <button
      disabled={disabled}
      onClick={() => onClick(champion.id)}
      onMouseEnter={() => onHover(champion.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative flex flex-col items-center gap-1 p-1 rounded border transition-all ${
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-pointer hover:border-primary hover:bg-draft-surface'
      } border-transparent`}
    >
      <div className="relative w-12 h-12 rounded overflow-hidden">
        <img
          src={iconUrl(patch, champion.id)}
          alt={champion.name}
          className={`w-full h-full object-cover ${isUsedThisDraft ? 'grayscale' : ''}`}
          loading="lazy"
        />

        {/* Used this draft overlay */}
        {isUsedThisDraft && (
          <div className="absolute inset-0 bg-black/60" />
        )}

        {/* Fearless locked overlay */}
        {isFearlessLocked && !isUsedThisDraft && (
          <div className="absolute inset-0 bg-fearless/70 flex items-center justify-center">
            <svg className="w-5 h-5 text-fearless-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              <line x1="8" y1="8" x2="16" y2="16" />
              <line x1="16" y1="8" x2="8" y2="16" />
            </svg>
          </div>
        )}
      </div>

      <span className={`text-[10px] font-mono leading-tight text-center truncate w-full ${
        disabled ? 'text-muted' : 'text-white'
      }`}>
        {champion.name}
      </span>
    </button>
  );
}
