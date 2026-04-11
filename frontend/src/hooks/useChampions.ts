import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChampionData, ChampionMap } from '../types/champion';

interface UseChampionsResult {
  champions: ChampionData[];
  championMap: ChampionMap;
  patch: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChampions(patchOverride?: string): UseChampionsResult {
  const [champions, setChampions] = useState<ChampionData[]>([]);
  const [championMap, setChampionMap] = useState<ChampionMap>({});
  const [patch, setPatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchChampions = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = patchOverride ? `?patch=${patchOverride}` : '';
      const res = await fetch(`/api/champions${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch champions: ${res.status}`);
      }

      const json = await res.json();
      const fetchedPatch: string = json.patch;
      const rawData = json.data?.data ?? json.data ?? {};

      const map: ChampionMap = {};
      const list: ChampionData[] = [];

      for (const [id, champ] of Object.entries(rawData)) {
        const champion = champ as ChampionData;
        map[id] = champion;
        list.push(champion);
      }

      list.sort((a, b) => a.name.localeCompare(b.name));

      setPatch(fetchedPatch);
      setChampionMap(map);
      setChampions(list);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [patchOverride]);

  useEffect(() => {
    fetchChampions();
    return () => abortRef.current?.abort();
  }, [fetchChampions]);

  return { champions, championMap, patch, loading, error, refetch: fetchChampions };
}
