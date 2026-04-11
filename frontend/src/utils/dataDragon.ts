const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com/cdn';

export function splashUrl(championId: string): string {
  return `${DDRAGON_BASE}/img/champion/splash/${championId}_0.jpg`;
}

export function iconUrl(patch: string, championId: string): string {
  return `${DDRAGON_BASE}/${patch}/img/champion/${championId}.png`;
}

export function loadingArtUrl(championId: string): string {
  return `${DDRAGON_BASE}/img/champion/loading/${championId}_0.jpg`;
}

export async function fetchLatestPatch(): Promise<string> {
  const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  if (!res.ok) throw new Error('Failed to fetch patch versions');
  const versions: string[] = await res.json();
  const latest = versions[0];
  if (!latest) throw new Error('No patch versions available');
  return latest;
}
