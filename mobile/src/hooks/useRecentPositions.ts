import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = '@letter-delivery/positions:recent';
const MAX_RECENT = 3;

interface UseRecentPositionsReturn {
  recentPositions: string[];
  /** Moves a position to the front of the recent list, capped at 3 entries. */
  rememberPosition: (value: string) => void;
}

/**
 * The last few recipient positions the courier picked, newest first.
 *
 * Purely a convenience for repeat deliveries, so it is capped at three and the
 * picker hides the section entirely while it is empty. Stored in AsyncStorage so
 * it survives a relaunch; a storage failure simply means no recent section.
 */
export function useRecentPositions(): UseRecentPositionsReturn {
  const [recentPositions, setRecentPositions] = useState<string[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_KEY);
        if (cancelled || !stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const values = parsed.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
          if (values.length > 0 && mountedRef.current) {
            setRecentPositions(values.slice(0, MAX_RECENT));
          }
        }
      } catch {
        // No recent history available.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const rememberPosition = useCallback((value: string) => {
    if (!value) return;

    setRecentPositions((prev) => {
      const next = [value, ...prev.filter((entry) => entry !== value)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {
        // Storing the recents list is best effort.
      });
      return next;
    });
  }, []);

  return { recentPositions, rememberPosition };
}
