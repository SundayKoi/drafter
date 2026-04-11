import { useTimer } from './useTimer';

interface DraftTimerProps {
  serverSeconds: number;
  maxSeconds: number;
  running: boolean;
}

const SIZE = 120;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getColor(seconds: number): string {
  if (seconds <= 5) return '#DC2626';   // red — critical
  if (seconds <= 10) return '#EAB308';  // gold — warning
  return '#FFFFFF';                      // white — normal
}

export function DraftTimer({ serverSeconds, maxSeconds, running }: DraftTimerProps) {
  const { display, fraction } = useTimer({ serverSeconds, maxSeconds, running });

  const offset = CIRCUMFERENCE * (1 - fraction);
  const color = getColor(display);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      {/* Background circle */}
      <svg className="absolute inset-0" width={SIZE} height={SIZE}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#222222"
          strokeWidth={STROKE}
        />
        {/* Arc countdown */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className="transition-[stroke] duration-300"
        />
      </svg>

      {/* Timer digits */}
      <span
        className="font-mono text-3xl font-bold tabular-nums transition-colors duration-300"
        style={{ color }}
      >
        {display}
      </span>
    </div>
  );
}
