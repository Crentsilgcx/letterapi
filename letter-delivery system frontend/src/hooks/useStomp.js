import { useCallback, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

// Same-origin so it goes through the Vite /ws proxy in dev and the reverse proxy in production.
const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

export function useStomp() {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Map()); // destination -> { handler, unsubscribe }
  const pendingSubscriptionsRef = useRef(new Map()); // destination -> handler

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

        // Execute all pending subscriptions now that we're connected
        pendingSubscriptionsRef.current.forEach((handler, destination) => {
          if (clientRef.current?.connected) {
            try {
              const subscription = clientRef.current.subscribe(
                destination,
                (message) => {
                  try {
                    const event = JSON.parse(message.body);
                    const stored = subscriptionsRef.current.get(destination);
                    if (stored) {
                      stored.handler(event);
                    }
                  } catch (err) {
                    console.error('Failed to parse STOMP message:', err);
                  }
                }
              );
              subscriptionsRef.current.set(destination, { handler: pendingSubscriptionsRef.current.get(destination), unsubscribe: () => subscription.unsubscribe() });
              console.log('Subscribed successfully to:', destination);
            } catch (err) {
              console.error('Failed to subscribe to:', destination, err);
            }
          }
        });
        // Clear pending after processing
        pendingSubscriptionsRef.current.clear();
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },

      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      },

      onWebSocketClose: (event) => {
        console.log(
          'WebSocket closed:',
          event.code,
          event.reason
        );
      },

      onDisconnect: () => {
        console.log('STOMP disconnected');
      },
    });

    clientRef.current = client;
    client.activate();
  }, []);

  const disconnect = useCallback(async () => {
    const client = clientRef.current;
    clientRef.current = null;
    if (client) {
      await client.deactivate();
    }
    subscriptionsRef.current.clear();
    pendingSubscriptionsRef.current.clear();
  }, []);

  const subscribe = useCallback((destination, handler) => {
    const client = clientRef.current;

    // Store handler for (re)subscription
    pendingSubscriptionsRef.current.set(destination, handler);

    // If already connected, subscribe immediately
    if (client?.connected) {
      try {
        const subscription = client.subscribe(
          destination,
          (message) => {
            try {
              const event = JSON.parse(message.body);
              handler(event);
            } catch (err) {
              console.error('Failed to parse STOMP message:', err);
            }
          }
        );
        subscriptionsRef.current.set(destination, { handler, unsubscribe: () => subscription.unsubscribe() });
        console.log('Subscribed successfully to:', destination);
        pendingSubscriptionsRef.current.delete(destination);
      } catch (err) {
        console.error('Failed to subscribe to:', destination, err);
      }
    } else {
      console.log('STOMP not yet connected, queuing subscription for:', destination);
    }

    // Return cleanup function
    return () => {
      const stored = subscriptionsRef.current.get(destination);
      if (stored) {
        stored.unsubscribe();
        subscriptionsRef.current.delete(destination);
      }
      pendingSubscriptionsRef.current.delete(destination);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    subscribe,
    connect,
    disconnect,
  };
}