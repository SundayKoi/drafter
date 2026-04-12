import { Link } from 'react-router-dom';
import { SiteLayout } from '../components/SiteLayout';
import { SITE_BRAND } from '../brand';
import { useNews, useSettings } from '../hooks/useSiteData';

export function HomePage() {
  const { settings } = useSettings();
  const { data: news } = useNews(null, 3);
  const channel = settings.twitch_channel;

  return (
    <SiteLayout>
      <section className="flex flex-col items-center py-16 text-center">
        <img src={SITE_BRAND.logoUrl} alt="" className="h-28 w-28" />
        <h1 className="mt-6 font-display text-7xl tracking-wider md:text-8xl">
          {SITE_BRAND.name.toUpperCase()}
        </h1>
        <p className="mt-2 font-display text-2xl tracking-[0.3em] text-[#F5A800]">
          {SITE_BRAND.tagline}
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            to="/apply"
            className="rounded border border-[#E63000] bg-[#E63000] px-6 py-3 font-display tracking-wider hover:bg-[#CC1A1A]"
          >
            APPLY NOW
          </Link>
          <Link
            to="/standings"
            className="rounded border border-white/30 px-6 py-3 font-display tracking-wider hover:border-white"
          >
            STANDINGS
          </Link>
        </div>
      </section>

      {channel && (
        <section className="mb-12">
          <h2 className="mb-3 font-display text-2xl tracking-wider text-[#F5A800]">STREAM</h2>
          <div className="aspect-video overflow-hidden rounded border border-[#2A2A2A]">
            <iframe
              src={`https://player.twitch.tv/?channel=${encodeURIComponent(
                channel,
              )}&parent=${window.location.hostname || 'localhost'}`}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {news && news.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-display text-2xl tracking-wider text-[#F5A800]">LATEST</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {news.map((p) => (
              <Link
                key={p.id}
                to={`/news/${p.slug}`}
                className="rounded border border-[#2A2A2A] bg-[#141414] p-5 transition hover:border-white/40"
              >
                <div className="font-display text-xl tracking-wide">{p.title}</div>
                <div className="mt-2 line-clamp-3 text-sm text-[#8A9099]">
                  {p.body.slice(0, 160)}
                </div>
                <div className="mt-3 font-mono text-xs text-[#666]">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString() : ''}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {SITE_BRAND.leagues.map((lg) => (
          <Link
            key={lg.id}
            to={`/standings?league=${lg.id}`}
            className="rounded border border-[#2A2A2A] bg-[#141414] p-6 transition hover:border-white/40"
          >
            <div
              className="font-display text-3xl tracking-wider"
              style={{ color: lg.color }}
            >
              {lg.name.toUpperCase()}
            </div>
            <div className="mt-1 font-mono text-xs text-[#666]">TIER {lg.tier}</div>
          </Link>
        ))}
      </section>
    </SiteLayout>
  );
}
