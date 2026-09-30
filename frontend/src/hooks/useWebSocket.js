import { useCallback, useEffect, useRef, useState } from "react";

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

/**
 * Thin wrapper around the native WebSocket API: connects on mount, exposes
 * connection status, and lets callers send JSON actions / subscribe to
 * incoming JSON messages.
 */
export function useWebSocket() {
  const [status, setStatus] = useState("connecting"); // connecting | connected | disconnected | error
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());

  useEffect(() => {
    if (!WEBSOCKET_URL) {
      setStatus("error");
      return;
    }

    const socket = new WebSocket(WEBSOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => setStatus("connected");
    socket.onclose = () => setStatus("disconnected");
    socket.onerror = () => setStatus("error");
    socket.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      listenersRef.current.forEach((listener) => listener(payload));
    };

    return () => socket.close();
  }, []);

  const send = useCallback((action, data = {}) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ action, ...data }));
  }, []);

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return { status, send, subscribe };
}
