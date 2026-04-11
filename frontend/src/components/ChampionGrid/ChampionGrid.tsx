import { useMemo, useState } from 'react';
import type { ChampionData } from '../../types/champion';
import { useDraftStore } from '../../hooks/useDraft';
import { ChampionCard } from './ChampionCard';
import { RoleFilter, type RoleKey } from './RoleFilter';
import { SearchBar } from './SearchBar';

// DataDragon tag -> role mapping
const TAG_ROLE_MAP: Record<string, RoleKey> = {
  Fighter: 'Fighter',
  Tank: 'Tank',
  Mage: 'Mage',
  Marksman: 'Marksman',
  Support: 'Support',
  Assassin: 'Fighter', // Assassins often played top/mid
};

interface ChampionGridProps {
  champions: ChampionData[];
  patch: string | null;
  fearlessPool: string[];
  onSelect: (championId: string) => void;
  onHover: (championId: string | null) => void;
}

export function ChampionGrid({
  champions,
  patch,
  fearlessPool,
  onSelect,
  onHover,
}: ChampionGridProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleKey>('all');

  const usedChampionIds = useDraftStore((s) => s.usedChampionIds);
  const currentSlot = useDraftStore((s) => s.currentSlot);
  const isMyTurn = useDraftStore((s) => s.isMyTurn);

  const used = usedChampionIds();
  const slot = currentSlot();
  const myTurn = isMyTurn();
  const isCurrentActionPick = slot?.action_type === 'pick';

  const fearlessSet = useMemo(() => new Set(fearlessPool), [fearlessPool]);

  const filtered = useMemo(() => {
    let list = champions;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    if (roleFilter !== 'all') {
      list = list.filter((c) =>
        c.tags.some((tag) => TAG_ROLE_MAP[tag] === roleFilter || tag === roleFilter)
      );
    }

    return list;
  }, [champions, search, roleFilter]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Search + filter row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <RoleFilter selected={roleFilter} onChange={setRoleFilter} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-8 gap-1 max-h-80 overflow-y-auto p-1 bg-draft-bg rounded border border-draft-border champion-scroll">
        {filtered.map((champion) => (
          <ChampionCard
            key={champion.id}
            champion={champion}
            patch={patch ?? ''}
            isUsedThisDraft={used.has(champion.id)}
            isFearlessLocked={fearlessSet.has(champion.id)}
            isCurrentActionPick={isCurrentActionPick}
            isDisabled={!myTurn}
            onClick={onSelect}
            onHover={onHover}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-8 py-8 text-center text-muted font-mono text-sm">
            No champions found
          </div>
        )}
      </div>
    </div>
  );
}
