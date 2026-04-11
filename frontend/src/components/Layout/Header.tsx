import { BRAND } from '../../constants/brand';

interface HeaderProps {
  patch?: string | null;
}

export function Header({ patch }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-draft-border bg-draft-surface">
      <div className="flex items-center gap-3">
        {BRAND.logoUrl && <img src={BRAND.logoUrl} alt={BRAND.name} className="h-8 w-auto" />}
        <span className="font-display text-lg text-white uppercase tracking-wider">
          {BRAND.siteName}
        </span>
      </div>
      {patch && (
        <span className="font-mono text-xs text-muted px-2 py-0.5 rounded bg-draft-bg border border-draft-border">
          Patch {patch}
        </span>
      )}
    </header>
  );
}
