import { SITE_BRAND } from '../brand';
import { useSettings } from '../hooks/useSiteData';

export function Footer() {
  const { settings } = useSettings();
  const socials = [
    { label: 'Twitch', href: settings.twitch_channel ? `https://twitch.tv/${settings.twitch_channel}` : null, icon: TwitchIcon },
    { label: 'Twitter', href: settings.twitter_url, icon: TwitterIcon },
    { label: 'Discord', href: settings.discord_invite, icon: DiscordIcon },
    { label: 'YouTube', href: settings.youtube_channel, icon: YouTubeIcon },
    { label: 'Instagram', href: settings.instagram_url, icon: InstagramIcon },
  ].filter((s): s is { label: string; href: string; icon: typeof TwitchIcon } => Boolean(s.href));

  return (
    <footer className="mt-24 border-t border-[#2A2A2A] bg-[#0D0D0D] py-10 text-sm text-[#666]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="font-display tracking-widest text-white/60">
          {SITE_BRAND.name.toUpperCase()}
        </div>

        {socials.length > 0 && (
          <div className="flex items-center gap-5">
            {socials.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-[#8A9099] transition-colors hover:text-[#F5A800]"
              >
                <Icon />
              </a>
            ))}
          </div>
        )}

        <div className="flex gap-5">
          {SITE_BRAND.leagues.map((lg) => (
            <span
              key={lg.id}
              className="font-display tracking-wider"
              style={{ color: lg.color }}
            >
              {lg.name.toUpperCase()}
            </span>
          ))}
        </div>

        <div>© {new Date().getFullYear()} Ember Esports</div>
      </div>
    </footer>
  );
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
} as const;

function TwitchIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 2l-2 4v14h5v3h3l3-3h4l5-5V2H4zm17 11l-3 3h-4l-3 3v-3H7V4h14v9zm-5-7h2v5h-2V6zm-5 0h2v5h-2V6z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.84l-5.35-7 -6.12 7H.94l8.02-9.17L1.5 2h6.99l4.84 6.4L18.24 2zm-1.2 18h1.88L6.96 4H5.02l12.02 16z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.317 4.37a19.8 19.8 0 00-4.885-1.515.074.074 0 00-.079.037 13.8 13.8 0 00-.608 1.25 18.27 18.27 0 00-5.487 0 12.7 12.7 0 00-.617-1.25.077.077 0 00-.079-.037A19.74 19.74 0 003.677 4.37a.07.07 0 00-.032.028C.533 9.046-.32 13.58.099 18.057a.08.08 0 00.031.056 19.9 19.9 0 005.993 3.03.08.08 0 00.084-.028 14.2 14.2 0 001.226-1.994.076.076 0 00-.041-.105 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128 10 10 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.197.373.292a.077.077 0 01-.006.128 12.3 12.3 0 01-1.873.891.077.077 0 00-.04.106c.36.698.772 1.363 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.031-.054c.5-5.177-.838-9.674-3.548-13.66a.06.06 0 00-.031-.029zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.334-.946 2.419-2.157 2.419z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M23.498 6.186a2.99 2.99 0 00-2.106-2.117C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.392.569A2.99 2.99 0 00.502 6.186C0 8.094 0 12 0 12s0 3.906.502 5.814a2.99 2.99 0 002.106 2.117C4.495 20.5 12 20.5 12 20.5s7.505 0 9.392-.569a2.99 2.99 0 002.106-2.117C24 15.906 24 12 24 12s0-3.906-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98C23.986 15.668 24 15.259 24 12c0-3.259-.014-3.668-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
