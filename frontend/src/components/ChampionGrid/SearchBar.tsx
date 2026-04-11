interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search champions..."
      className="w-full bg-draft-surface border border-draft-border rounded px-3 py-2 text-sm font-mono text-white placeholder-muted focus:outline-none focus:border-primary"
    />
  );
}
