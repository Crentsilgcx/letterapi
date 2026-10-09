import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, isAbortError } from '../services/api';
import { POSITIONS, PositionOption, mergePositions } from '../constants/positions';

const SYNC_KEY = '@letter-delivery/positions:last-sync';
const CACHE_KEY = '@letter-delivery/positions:cache';
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UsePositionsReturn {
  positions: PositionOption[];
  isSyncing: boolean;
  lastSync: Date | null;
  /** Background refresh. Pass true to bypass the 24h throttle (pull to refresh). */
  syncNow: (force?: boolean) => Promise<void>;
}

/**
 * Recipient positions, local-first.
 *
 * The list starts as the predefined constants so the Delivery form is complete
 * and usable on its very first frame. `GET /api/public/recipient-roles` runs once
 * in the background and can only ever *add* positions that the constants do not
 * already contain - local constants are never dropped, the form is never blocked
 * waiting for it, and a failure is silent because the constants already cover
 * the workflow.
 */
export function usePositions(): UsePositionsReturn {
  const [positions, setPositions] = useState<PositionOption[]>(POSITIONS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const syncInFlight = useRef(false);
  const mountedRef = useRef(true);
  const syncPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Hydrate any previously merged backend-only positions. The cache can only
  // ever widen the list, and hydration happens exactly once per mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [cached, timestamp] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY),
          AsyncStorage.getItem(SYNC_KEY),
        ]);
        if (cancelled) return;

        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const values = parsed
                .filter((entry): entry is PositionOption => Boolean(entry && typeof entry.value === 'string'))
                .map((entry) => entry.value);
              if (values.length > 0 && mountedRef.current) {
                setPositions(mergePositions(values));
              }
            }
          } catch {
            // Ignore a corrupt cache and keep the constants.
          }
        }

        if (timestamp && mountedRef.current) {
          const parsedTime = parseInt(timestamp, 10);
          if (!Number.isNaN(parsedTime)) {
            setLastSync(new Date(parsedTime));
          }
        }
      } catch {
        // Cache is an optimisation; the constants are always available.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const syncNow = useCallback(async (force = false) => {
    // If a sync is already in progress, return the existing promise
    if (syncInFlight.current && syncPromiseRef.current) {
      if (__DEV__) {
        console.log('[Positions] Background sync already in progress, returning existing promise');
      }
      return syncPromiseRef.current;
    }

    if (!force) {
      try {
        const lastSyncStr = await AsyncStorage.getItem(SYNC_KEY);
        if (lastSyncStr) {
          const lastSyncTime = parseInt(lastSyncStr, 10);
          if (!Number.isNaN(lastSyncTime) && Date.now() - lastSyncTime < SYNC_INTERVAL_MS) {
            if (__DEV__) {
              console.log('[Positions] Background sync skipped (within 24h window)');
            }
            return;
          }
        }
      } catch {
        // Ignore storage errors and sync anyway.
      }
    }

    syncInFlight.current = true;
    setIsSyncing(true);

    const syncedAt = Date.now();

    const syncPromise = (async () => {
      try {
        if (__DEV__) {
          console.log('[Positions] Starting background sync');
        }
        const data = await api.getRecipientRolesBackground();
        const merged = mergePositions(data.map((entry) => entry.value));

        if (mountedRef.current) {
          setPositions(merged);
          setLastSync(new Date(syncedAt));
        }

        await Promise.all([
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged)),
          AsyncStorage.setItem(SYNC_KEY, String(syncedAt)),
        ]);

        if (__DEV__) {
          console.log('[Positions] Background sync completed');
        }
      } catch (error) {
        // Distinguish intentional cancellation from genuine failures
        if (isAbortError(error)) {
          if (__DEV__) {
            console.log('[Positions] Background sync cancelled intentionally, not treated as failure');
          }
          return;
        }

        // Silent by design: the predefined list is already on screen, so a failed
        // background sync is not a failure the courier needs to act on.
        if (__DEV__) {
          console.warn('[Positions] Background sync failed; keeping predefined list:', error);
        }
      } finally {
        syncInFlight.current = false;
        syncPromiseRef.current = null;
        if (mountedRef.current) setIsSyncing(false);
      }
    })();

    syncPromiseRef.current = syncPromise;
    return syncPromise;
  }, []);

  // One background sync per mount, throttled to once a day. Deferred by a tick
  // so the first render - which already has the full local list - completes
  // before anything can update state.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        syncNow();
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [syncNow]);

  return {
    positions,
    isSyncing,
    lastSync,
    syncNow,
  };
}
