import { SiteLayout } from '../components/SiteLayout';
import { useSettings } from '../hooks/useSiteData';

// Whitelist of hosts allowed in the iframe src. Keeps an admin from
// accidentally embedding something random — Google Docs/Sheets only.
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
  emptyText,
}: {
  title: string;
  settingKey: 'rules_embed_url' | 'league_info_embed_url';
  emptyText: string;
}) {
  const { settings, loading } = useSettings();
  const url = settings[settingKey];
  const safe = isSafeEmbedUrl(url);

  return (
    <SiteLayout>
      <h1 className="mb-6 font-display text-5xl tracking-wider">{title.toUpperCase()}</h1>

      {loading ? (
        <div className="text-[#666]">Loading…</div>
      ) : safe ? (
        <div className="overflow-hidden rounded border border-[#2A2A2A] bg-[#141414]">
          <iframe
            src={url}
            title={title}
            className="h-[85vh] w-full"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="rounded border border-dashed border-[#2A2A2A] bg-[#141414] p-10 text-center">
          <p className="text-[#8A9099]">{emptyText}</p>
          <p className="mt-2 font-mono text-xs text-[#666]">
            Admin: set the embed URL in Settings.
          </p>
        </div>
      )}
    </SiteLayout>
  );
}
