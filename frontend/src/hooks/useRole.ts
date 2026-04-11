import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type Role = 'blue' | 'red' | 'spectator';

export function useRole(): { token: string | null; role: Role | null } {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Role is resolved server-side on WS connect.
  // We don't know the role until the first SYNC message.
  // This hook just extracts the token from the URL.
  return useMemo(() => ({ token }), [token]) as { token: string | null; role: Role | null };
}
