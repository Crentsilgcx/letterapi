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
    // Prevent duplicate connections
    if (clientRef.current?.active) {
      return;
    }

    const client = new Client({
  
      webSocketFactory: () => {
        console.log('Connecting STOMP WebSocket to:', WS_URL);
        return new WebSocket(WS_URL);
      },

      reconnectDelay: 5000,

      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      debug: (message) => {
        console.log('[STOMP]', message);
      },

      onConnect: (frame) => {
        console.log('STOMP connected:', frame);
        setIsConnected(true);
        setError(null);
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setError(
          frame.headers?.message || 'STOMP broker error'
        );
      },

      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
        setIsConnected(false);
        setError('WebSocket connection error');
      },

      onWebSocketClose: (event) => {
        console.log(
          'WebSocket closed:',
          event.code,
          event.reason
        );

        setIsConnected(false);
      },

      onDisconnect: () => {
        console.log('STOMP disconnected');
        setIsConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();
  }, []);

  const disconnect = useCallback(async () => {
    // Clear the ref before awaiting: a remount (e.g. StrictMode) may create a new client meanwhile,
    // and clearing afterwards would drop that live client so subscribe() finds nothing.
    const client = clientRef.current;
    clientRef.current = null;
    if (client) {
      await client.deactivate();
    }

    setIsConnected(false);
    messageHandlersRef.current.clear();
  }, []);

  const subscribe = useCallback((destination, handler) => {
    const client = clientRef.current;

    if (!client?.connected) {
      console.warn(
        'Cannot subscribe. STOMP is not connected:',
        destination
      );
      return () => {};
    }

    const subscription = client.subscribe(
      destination,
      (message) => {
        try {
          const event = JSON.parse(message.body);
          handler(event);
        } catch (err) {
          console.error(
            'Failed to parse STOMP message:',
            err
          );
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    subscribe,
    connect,
    disconnect,
  };
}

