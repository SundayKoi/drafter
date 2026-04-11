import type { ConnectionStatus as Status } from '../../hooks/useWebSocket';

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  connected:    { color: 'bg-green-500', label: 'Connected' },
  connecting:   { color: 'bg-yellow-500', label: 'Connecting...' },
  reconnecting: { color: 'bg-yellow-500', label: 'Reconnecting...' },
  disconnected: { color: 'bg-red-500', label: 'Disconnected' },
};

interface ConnectionStatusProps {
  status: Status;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${config.color} ${
        status === 'connecting' || status === 'reconnecting' ? 'animate-pulse' : ''
      }`} />
      <span className="font-mono text-[10px] text-muted">{config.label}</span>
    </div>
  );
}
