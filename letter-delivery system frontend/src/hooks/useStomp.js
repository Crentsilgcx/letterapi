import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';

// Same-origin so it goes through the Vite /ws proxy in dev and the reverse proxy in production.
const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export function useStomp() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const messageHandlersRef = useRef(new Map());

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setIsConnected(true);
        setError(null);
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setError(frame.headers.message || 'STOMP error');
      },

      onWebSocketError: (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
      },

      onDisconnect: () => {
        setIsConnected(false);
      }
    });

    clientRef.current = client;
    client.activate();
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setIsConnected(false);
    messageHandlersRef.current.clear();
  }, []);

  const subscribe = useCallback((destination, handler) => {
    const client = clientRef.current;
    if (!client?.connected) {
      return () => {};
    }

    const subscription = client.subscribe(destination, (message) => {
      try {
        const event = JSON.parse(message.body);
        handler(event);
      } catch (err) {
        console.error('Failed to parse STOMP message:', err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    subscribe,
    connect,
    disconnect,
  };
}