import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

let stompClient = null;
let mountCount = 0;
let pendingDisconnect = false;
const pendingSubscriptions = new Map();
const activeSubscriptions = new Map();
const connectionListeners = new Set();

function createClient() {
  const client = new Client({
    webSocketFactory: () => {
      console.log('Connecting STOMP WebSocket to:', WS_URL);
      return new WebSocket(WS_URL);
    },

    reconnectDelay: 0,

    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    debug: (message) => {
      console.log('[STOMP]', message);
    },

    onConnect: (frame) => {
      console.log('STOMP connected:', frame);
      connectionListeners.forEach((listener) => listener(true));

      pendingSubscriptions.forEach((handlers, destination) => {
        if (client.connected) {
          handlers.forEach((handler) => {
            try {
              const subscription = client.subscribe(destination, (message) => {
                try {
                  const event = JSON.parse(message.body);
                  handler(event);
                } catch (err) {
                  console.error('Failed to parse STOMP message:', err);
                }
              });
              if (!activeSubscriptions.has(destination)) {
                activeSubscriptions.set(destination, { handlers: new Set(), subscriptions: [] });
              }
              const subInfo = activeSubscriptions.get(destination);
              subInfo.handlers.add(handler);
              subInfo.subscriptions.push(subscription);
            } catch (err) {
              console.error('Failed to subscribe to:', destination, err);
            }
          });
          pendingSubscriptions.delete(destination);
        }
      });
    },

    onStompError: (frame) => {
      console.error('STOMP error:', frame);
    },

    onWebSocketError: (event) => {
      console.error('WebSocket error:', event);
    },

    onWebSocketClose: (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      connectionListeners.forEach((listener) => listener(false));
    },

    onDisconnect: () => {
      console.log('STOMP disconnected');
      connectionListeners.forEach((listener) => listener(false));
    },
  });
  return client;
}

function getOrCreateClient() {
  if (!stompClient) {
    stompClient = createClient();
  }
  return stompClient;
}

function requestDisconnect() {
  if (pendingDisconnect) {
    return;
  }
  pendingDisconnect = true;
  queueMicrotask(() => {
    if (pendingDisconnect) {
      pendingDisconnect = false;
      mountCount--;
      console.log('STOMP mount count (deferred):', mountCount);
      if (mountCount === 0 && stompClient) {
        stompClient.deactivate();
        stompClient = null;
        activeSubscriptions.clear();
        pendingSubscriptions.clear();
      }
    }
  });
}

function cancelDisconnect() {
  pendingDisconnect = false;
}

export function useStomp() {
  const [isConnected, setIsConnected] = useState(false);
  const listenerRef = useRef(null);
  const isMountedRef = useRef(false);

  const connect = useCallback(() => {
    if (isMountedRef.current) {
      return;
    }
    isMountedRef.current = true;

    cancelDisconnect();

    if (mountCount === 0) {
      mountCount = 1;
    } else {
      mountCount++;
    }
    console.log('STOMP mount count:', mountCount);

    const client = getOrCreateClient();

    if (mountCount === 1) {
      listenerRef.current = (connected) => {
        setIsConnected(connected);
      };
      connectionListeners.add(listenerRef.current);

      if (!client.active) {
        client.activate();
      }
    } else if (client.connected) {
      queueMicrotask(() => setIsConnected(true));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }
    isMountedRef.current = false;

    if (listenerRef.current) {
      connectionListeners.delete(listenerRef.current);
      listenerRef.current = null;
    }

    requestDisconnect();
  }, []);

  const subscribe = useCallback((destination, handler) => {
    const client = getOrCreateClient();

    if (!pendingSubscriptions.has(destination)) {
      pendingSubscriptions.set(destination, new Set());
    }
    pendingSubscriptions.get(destination).add(handler);

    if (client.connected) {
      try {
        const subscription = client.subscribe(destination, (message) => {
          try {
            const event = JSON.parse(message.body);
            handler(event);
          } catch (err) {
            console.error('Failed to parse STOMP message:', err);
          }
        });

        if (!activeSubscriptions.has(destination)) {
          activeSubscriptions.set(destination, { handlers: new Set(), subscriptions: [] });
        }
        const subInfo = activeSubscriptions.get(destination);
        subInfo.handlers.add(handler);
        subInfo.subscriptions.push(subscription);

        pendingSubscriptions.get(destination).delete(handler);
        if (pendingSubscriptions.get(destination).size === 0) {
          pendingSubscriptions.delete(destination);
        }

        console.log('Subscribed successfully to:', destination);
      } catch (err) {
        console.error('Failed to subscribe to:', destination, err);
      }
    } else {
      console.log('STOMP not yet connected, queuing subscription for:', destination);
    }

    return () => {
      if (pendingSubscriptions.has(destination)) {
        pendingSubscriptions.get(destination).delete(handler);
        if (pendingSubscriptions.get(destination).size === 0) {
          pendingSubscriptions.delete(destination);
        }
      }

      if (activeSubscriptions.has(destination)) {
        const subInfo = activeSubscriptions.get(destination);
        subInfo.handlers.delete(handler);
        if (subInfo.handlers.size === 0) {
          subInfo.subscriptions.forEach((sub) => sub.unsubscribe());
          activeSubscriptions.delete(destination);
        }
      }
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
    isConnected,
  };
}