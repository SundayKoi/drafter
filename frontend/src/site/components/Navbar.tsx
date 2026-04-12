import { Link, NavLink } from 'react-router-dom';
import { SITE_BRAND } from '../brand';

// Internal SPA links.
const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/standings', label: 'Standings' },
  { to: '/scores', label: 'Scores' },
  { to: '/vods', label: 'VODs' },
  { to: '/drafter', label: 'Drafter' },
  { to: '/apply', label: 'Apply' },
  { to: '/about', label: 'About' },
];

// External / non-SPA links (served by nginx, not React Router).
const externalLinks = [{ href: '/stats/', label: 'Stats' }];

export function Navbar() {
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
                className="font-display text-lg tracking-wide text-white/80 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
