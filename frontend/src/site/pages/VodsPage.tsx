import { useState } from 'react';
import { SiteLayout } from '../components/SiteLayout';
import { LeagueFilter } from '../components/LeagueFilter';
import { useVods } from '../hooks/useSiteData';
import type { LeagueId, Vod } from '../types';

export function VodsPage() {
  const [league, setLeague] = useState<LeagueId>('cinder');
  const { data, loading } = useVods(league);
  const [active, setActive] = useState<Vod | null>(null);

  return (
    <SiteLayout>
      <h1 className="mb-6 font-display text-5xl tracking-wider">VODS</h1>
      <LeagueFilter value={league} onChange={setLeague} />

      {loading && <div className="mt-8 text-[#666]">Loading…</div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((v) => (
          <button
            key={v.id}
            onClick={() => setActive(v)}
            className="overflow-hidden rounded border border-[#2A2A2A] bg-[#141414] text-left transition hover:border-white/40"
          >
            <div className="aspect-video bg-[#0D0D0D]">
              {v.thumbnail_url && (
                <img
                  src={v.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="p-3">
              <div className="font-display text-lg tracking-wide">{v.title}</div>
              <div className="mt-1 flex items-center justify-between font-mono text-xs text-[#666]">
                <span className="uppercase">{v.platform}</span>
                <span>{new Date(v.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </button>
        ))}
        {data?.length === 0 && !loading && (
          <div className="col-span-full text-[#666]">No VODs yet.</div>
        )}
      </div>

      {active && <VodModal vod={active} onClose={() => setActive(null)} />}
    </SiteLayout>
  );
}

function VodModal({ vod, onClose }: { vod: Vod; onClose: () => void }) {
  const embed = buildEmbed(vod);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded border border-[#2A2A2A] bg-[#0D0D0D]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#2A2A2A] px-4 py-2">
          <div className="font-display tracking-wide">{vod.title}</div>
          <button onClick={onClose} className="text-[#666] hover:text-white">
            ✕
          </button>
        </div>
        <div className="aspect-video">
          {embed ? (
            <iframe
              src={embed}
              className="h-full w-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#666]">
              <a href={vod.url} target="_blank" rel="noreferrer" className="text-[#F5A800]">
                Open on {vod.platform} →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildEmbed(vod: Vod): string | null {
  try {
    const u = new URL(vod.url);
    if (vod.platform === 'youtube') {
      const id =
        u.searchParams.get('v') ??
        u.pathname.split('/').filter(Boolean).pop();
      if (!id) return null;
      return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    }
    if (vod.platform === 'twitch') {
      const parts = u.pathname.split('/').filter(Boolean);
      const parent = window.location.hostname || 'localhost';
      if (parts[0] === 'videos' && parts[1]) {
        return `https://player.twitch.tv/?video=v${encodeURIComponent(parts[1])}&parent=${parent}`;
      }
      if (u.hostname.includes('clips.twitch')) {
        const slug = parts[0];
        return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${parent}`;
      }
    }
  } catch {
    /* fallthrough */
  }
  return null;
}
