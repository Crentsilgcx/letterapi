import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { API_BASE_URL } from '../config/api';

let stompClient = null;
let mountCount = 0;
let pendingDisconnect = false;
const pendingSubscriptions = new Map();
const activeSubscriptions = new Map();
const connectionListeners = new Set();

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];
let reconnectAttempt = 0;

function getWsUrl(): string {
  // Convert HTTP/HTTPS to WS/WSS
  const httpUrl = API_BASE_URL || '';
  if (!httpUrl) return '';
  return httpUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:') + '/ws';
}

function createClient() {
  const wsUrl = getWsUrl();
  if (!wsUrl) {
    console.warn('[Mobile STOMP] No WebSocket URL configured (API_BASE_URL is empty)');
    return null;
  }
  
  console.log('[Mobile STOMP] Connecting to:', wsUrl);
  const client = new Client({
    webSocketFactory: () => {
      return new WebSocket(wsUrl);
    },

    reconnectDelay: 0,

    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    debug: (message) => {
      console.log('[Mobile STOMP]', message);
    },

    onConnect: (frame) => {
      console.log('[Mobile STOMP] Connected:', frame);
      reconnectAttempt = 0;
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
                  console.error('[Mobile STOMP] Failed to parse message:', err);
                }
              });
              if (!activeSubscriptions.has(destination)) {
                activeSubscriptions.set(destination, { handlers: new Set(), subscriptions: [] });
              }
              const subInfo = activeSubscriptions.get(destination);
              subInfo.handlers.add(handler);
              subInfo.subscriptions.push(subscription);
            } catch (err) {
              console.error('[Mobile STOMP] Failed to subscribe to:', destination, err);
            }
          });
          pendingSubscriptions.delete(destination);
        }
      });
    },

    onStompError: (frame) => {
      console.error('[Mobile STOMP] Error:', frame);
    },

    onWebSocketError: (event) => {
      console.error('[Mobile STOMP] WebSocket error:', event);
    },

    onWebSocketClose: (event) => {
      console.log('[Mobile STOMP] Closed:', event.code, event.reason);
      connectionListeners.forEach((listener) => listener(false));
      
      if (!pendingDisconnect && stompClient) {
        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
        reconnectAttempt++;
        console.log(`[Mobile STOMP] Reconnecting in ${delay}ms (attempt ${reconnectAttempt})`);
        setTimeout(() => {
          if (stompClient && !pendingDisconnect) {
            stompClient.activate();
          }
        }, delay);
      }
    },

    onDisconnect: () => {
      console.log('[Mobile STOMP] Disconnected');
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
  if (pendingDisconnect) return;
  pendingDisconnect = true;
  queueMicrotask(() => {
    if (pendingDisconnect) {
      pendingDisconnect = false;
      mountCount--;
      console.log('[Mobile STOMP] Mount count (deferred):', mountCount);
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

export function useMobileStomp() {
  const [isConnected, setIsConnected] = useState(false);
  const listenerRef = useRef(null);
  const isMountedRef = useRef(false);

  const connect = useCallback(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    cancelDisconnect();

    if (mountCount === 0) {
      mountCount = 1;
    } else {
      mountCount++;
    }
    console.log('[Mobile STOMP] Mount count:', mountCount);

    const client = getOrCreateClient();
    if (!client) return;

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
    if (!isMountedRef.current) return;
    isMountedRef.current = false;

    if (listenerRef.current) {
      connectionListeners.delete(listenerRef.current);
      listenerRef.current = null;
    }

    requestDisconnect();
  }, []);

  const subscribe = useCallback((destination, handler) => {
    const client = getOrCreateClient();
    if (!client) {
      console.warn('[Mobile STOMP] Cannot subscribe - no client');
      return () => {};
    }

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
            console.error('[Mobile STOMP] Failed to parse message:', err);
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

        console.log('[Mobile STOMP] Subscribed to:', destination);
      } catch (err) {
        console.error('[Mobile STOMP] Failed to subscribe to:', destination, err);
      }
    } else {
      console.log('[Mobile STOMP] Not connected, queuing subscription for:', destination);
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