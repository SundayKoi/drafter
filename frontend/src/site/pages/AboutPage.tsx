import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { SiteLayout } from '../components/SiteLayout';
import { SITE_BRAND } from '../brand';
import { useSettings } from '../hooks/useSiteData';

export function AboutPage() {
  const { settings, loading } = useSettings();
  const bio = settings.org_bio ?? '';

  return (
    <SiteLayout>
      <h1 className="mb-6 font-display text-5xl tracking-wider">ABOUT {SITE_BRAND.name.toUpperCase()}</h1>

      {loading ? (
        <div className="text-[#666]">Loading…</div>
      ) : bio ? (
        <article className="prose prose-invert max-w-none text-[#E5E5E5]">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{bio}</ReactMarkdown>
        </article>
      ) : (
        <p className="text-[#8A9099]">
          Ember Esports runs four competitive League of Legends leagues — Cinder, Blaze,
          Scorch, and Magma — with a focus on development and consistent scrim
          infrastructure.
        </p>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-display text-2xl tracking-wider text-[#F5A800]">SOCIALS</h2>
        <ul className="space-y-2 font-mono text-sm">
          {socialEntries(settings).map(([label, url]) => (
            <li key={label}>
              <span className="inline-block w-24 text-[#666]">{label}</span>
              <a href={url} target="_blank" rel="noreferrer" className="text-white hover:text-[#F5A800]">
                {url}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </SiteLayout>
  );
}

function socialEntries(s: Record<string, string | null>): Array<[string, string]> {
  const pairs: Array<[string, string | null | undefined]> = [
    ['Twitch', s.twitch_channel ? `https://twitch.tv/${s.twitch_channel}` : null],
    ['Twitter', s.twitter_url],
    ['Discord', s.discord_invite],
    ['YouTube', s.youtube_channel],
    ['Instagram', s.instagram_url],
  ];
  return pairs.filter((e): e is [string, string] => Boolean(e[1])) ;
}
