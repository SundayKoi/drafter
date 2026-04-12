import { SITE_BRAND } from '../brand';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[#2A2A2A] bg-[#0D0D0D] py-10 text-sm text-[#666]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="font-display tracking-widest text-white/60">
          {SITE_BRAND.name.toUpperCase()}
        </div>
        <div className="flex gap-6">
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
