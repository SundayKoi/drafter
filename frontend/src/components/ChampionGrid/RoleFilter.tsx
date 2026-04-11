const ROLES = [
  { key: 'all', label: 'ALL' },
  { key: 'Fighter', label: 'TOP' },
  { key: 'Tank', label: 'JG' },
  { key: 'Mage', label: 'MID' },
  { key: 'Marksman', label: 'BOT' },
  { key: 'Support', label: 'SUP' },
] as const;

export type RoleKey = (typeof ROLES)[number]['key'];

interface RoleFilterProps {
  selected: RoleKey;
  onChange: (role: RoleKey) => void;
}

export function RoleFilter({ selected, onChange }: RoleFilterProps) {
  return (
    <div className="flex gap-1">
      {ROLES.map((role) => (
        <button
          key={role.key}
          onClick={() => onChange(role.key)}
          className={`px-3 py-1 text-xs font-display uppercase tracking-wider rounded transition-colors ${
            selected === role.key
              ? 'bg-primary text-black'
              : 'bg-draft-surface text-muted hover:text-white border border-draft-border'
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}
