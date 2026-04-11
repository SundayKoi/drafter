interface UseTimerOptions {
  serverSeconds: number;
  maxSeconds: number;
  running: boolean;
}

/**
 * Client-side timer that syncs from server TIMER_TICK messages.
 * Uses server value directly — no local interpolation to avoid drift.
 */
export function useTimer({ serverSeconds, maxSeconds, running }: UseTimerOptions) {
  const display = running ? serverSeconds : serverSeconds;
  const fraction = maxSeconds > 0 ? display / maxSeconds : 0;

  return { display, fraction };
}
