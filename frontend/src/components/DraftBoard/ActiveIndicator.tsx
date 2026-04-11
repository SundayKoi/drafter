interface ActiveIndicatorProps {
  side: 'blue' | 'red';
}

export function ActiveIndicator({ side }: ActiveIndicatorProps) {
  const glowClass = side === 'blue' ? 'glow-blue' : 'glow-red';
  const borderColor = side === 'blue' ? 'border-blue-side' : 'border-red-side';

  return (
    <div
      className={`absolute inset-0 rounded border-2 ${borderColor} ${glowClass} pointer-events-none z-10`}
    />
  );
}
