import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, ServerMessage } from '../types/ws';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface UseWebSocketOptions {
  seriesId: string;
  token: string;
  onMessage: (message: ServerMessage) => void;
}

interface UseWebSocketResult {
  send: (message: ClientMessage) => void;
  status: ConnectionStatus;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const PING_INTERVAL = 30000;

export function useWebSocket({ seriesId, token, onMessage }: UseWebSocketOptions): UseWebSocketResult {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/${seriesId}?token=${encodeURIComponent(token)}`;

    setStatus(reconnectAttempt.current > 0 ? 'reconnecting' : 'connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectAttempt.current = 0;

      // Start ping keepalive
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        onMessageRef.current(message);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = (event) => {
      clearTimers();
      wsRef.current = null;

      // Don't reconnect on auth failure
      if (event.code === 4001 || event.code === 4004) {
        setStatus('disconnected');
        return;
      }

      // Schedule reconnect
      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)] ?? RECONNECT_DELAYS[0]!;
      reconnectAttempt.current += 1;
      setStatus('reconnecting');
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose will fire after onerror
    };
  }, [seriesId, token, clearTimers]);

  useEffect(() => {
    connect();
    return () => {
      clearTimers();
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.close();
        wsRef.current = null;
      }
      setStatus('disconnected');
    };
  }, [connect, clearTimers]);

  const send = useCallback((message: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WS send failed — not connected. Message:', message.type, 'readyState:', ws?.readyState);
    }
  }, []);

  return { send, status };
}
