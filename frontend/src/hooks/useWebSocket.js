import { useEffect, useRef, useState } from 'react';

export function useWebSocket(path = '/ws') {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const url = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws') + path;
    let ws;
    try {
      ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
      ws.onmessage = (e) => {
        try { setLastMessage(JSON.parse(e.data)); } catch { setLastMessage(e.data); }
      };
    } catch { setConnected(false); }
    return () => { try { ws?.close(); } catch {} };
  }, [path]);

  const send = (data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  };

  return { connected, lastMessage, send };
}