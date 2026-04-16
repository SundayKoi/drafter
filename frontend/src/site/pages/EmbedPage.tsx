import { SiteLayout } from '../components/SiteLayout';
import { ProseLayout } from '../components/ProseLayout';
import { useSettings } from '../hooks/useSiteData';

const ALLOWED_HOSTS = ['docs.google.com', 'drive.google.com'];

function isSafeEmbedUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch {
    return false;
  }
}

export function EmbedPage({
  title,
  settingKey,
  contentKey,
  emptyText,
}: {
  title: string;
  settingKey: 'rules_embed_url' | 'league_info_embed_url';
  contentKey: 'rules_content' | 'league_info_content';
  emptyText: string;
}) {
  const { settings, loading } = useSettings();
  const markdown = settings[contentKey];
  const embedUrl = settings[settingKey];
  const safe = isSafeEmbedUrl(embedUrl);

  if (loading) {
    return (
      <SiteLayout>
        <div className="py-16 text-center text-[#666]">Loading…</div>
      </SiteLayout>
    );
  }

  if (markdown) {
    return <ProseLayout title={title} markdown={markdown} />;
  }

  if (safe) {
    return (
      <SiteLayout>
        <h1 className="mb-6 font-display text-5xl tracking-wider">{title.toUpperCase()}</h1>
        <div className="overflow-hidden rounded border border-[#2A2A2A] bg-[#141414]">
          <iframe
            src={embedUrl}
            title={title}
            className="h-[85vh] w-full"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer"
          />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="rounded border border-dashed border-[#2A2A2A] bg-[#141414] p-10 text-center">
        <p className="text-[#8A9099]">{emptyText}</p>
        <p className="mt-2 font-mono text-xs text-[#666]">
          Admin: set the content or embed URL in Settings.
        </p>
      </div>
    </SiteLayout>
  );
}
