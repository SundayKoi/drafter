import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { SITE_BRAND } from '../brand';

// Internal SPA links.
const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/standings', label: 'Standings' },
  { to: '/scores', label: 'Scores' },
  { to: '/vods', label: 'VODs' },
  { to: '/apply', label: 'Apply' },
  { to: '/about', label: 'About' },
];

// External / non-SPA links (open in new tab).
const externalLinks = [
  { href: '/drafter', label: 'Drafter' },
  { href: '/stats/', label: 'Stats' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <nav className="sticky top-0 z-40 border-b border-[#2A2A2A] bg-[#0D0D0D]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={SITE_BRAND.logoUrl} alt="" className="h-9 w-9" />
          <span className="font-display text-2xl tracking-wider text-white">
            {SITE_BRAND.name.toUpperCase()}
          </span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `font-display text-lg tracking-wide transition-colors ${
                    isActive ? 'text-[#FFD700]' : 'text-white/80 hover:text-white'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
          {externalLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="font-display text-lg tracking-wide text-white/80 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded border border-[#2A2A2A] text-white md:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-[#0D0D0D] md:hidden"
          onClick={() => setOpen(false)}
        >
          <ul className="flex flex-col px-6 py-6">
            {links.map((l) => (
              <li key={l.to} className="border-b border-[#2A2A2A]">
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `block py-4 font-display text-2xl tracking-wider transition-colors ${
                      isActive ? 'text-[#FFD700]' : 'text-white'
                    }`
                  }
                >
                  {l.label.toUpperCase()}
                </NavLink>
              </li>
            ))}
            {externalLinks.map((l) => (
              <li key={l.href} className="border-b border-[#2A2A2A]">
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block py-4 font-display text-2xl tracking-wider text-white"
                >
                  {l.label.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5l14 14M19 5L5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
