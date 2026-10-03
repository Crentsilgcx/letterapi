import { getApiUrl, API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { CreateDeliveryRequest, DeliveryResponse, RecipientPosition } from '../types';

const REQUEST_TIMEOUT = 15000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Determines if an error is caused by request cancellation (AbortController).
 * React Native's fetch may report cancellation as AbortError (DOMException)
 * or as a TypeError with message containing "cancel" / "abort".
 */
export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ('name' in error && error.name === 'AbortError') return true;
  if (error instanceof TypeError) {
    const message = error.message?.toLowerCase() || '';
    return message.includes('abort') || message.includes('cancel');
  }
  return false;
}

async function fetchJson<T>(url: string, options?: RequestInit, debugLabel = 'api', timeoutMs = REQUEST_TIMEOUT): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (__DEV__) {
      console.log(`[Delivery] ${debugLabel} request ->`, url);
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers,
      },
    });

    const responseText = await response.text();

    let parsed: unknown = null;
    if (responseText) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        if (__DEV__) {
          console.warn(`[Delivery] ${debugLabel} returned a non-JSON body`);
        }
        parsed = null;
      }
    }

    if (response.status === 401) {
      throw new ApiError('Invalid username or password.', 401);
    }

    if (!response.ok) {
      const message =
        parsed && typeof parsed === 'object' && 'message' in parsed && typeof parsed.message === 'string'
          ? parsed.message
          : `Request failed: ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) {
      if (__DEV__) {
        console.error(`[Delivery] ${debugLabel} failed:`, error.status, error.message);
      }
      throw error;
    }
    if (isAbortError(error)) {
      throw new ApiError('Request timed out. Please try again.', 408);
    }
    if (error instanceof TypeError) {
      if (__DEV__) {
        console.error(`[Delivery] ${debugLabel} transport failure for ${url}:`, error.message);
      }
      throw new ApiError(
        `Could not reach ${API_BASE_URL || 'the server'}. Check the API URL and that the device is on the same network.`,
        0
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch without timeout for background/non-blocking requests.
 * Uses the same logic as fetchJson but without an AbortController timeout.
 */
async function fetchJsonNoTimeout<T>(url: string, options?: RequestInit, debugLabel = 'api'): Promise<T> {
  try {
    if (__DEV__) {
      console.log(`[Delivery] ${debugLabel} request (no timeout) ->`, url);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options?.headers,
      },
    });

    const responseText = await response.text();

    let parsed: unknown = null;
    if (responseText) {
      try {
        parsed = JSON.parse(responseText);
      } catch {
        if (__DEV__) {
          console.warn(`[Delivery] ${debugLabel} returned a non-JSON body`);
        }
        parsed = null;
      }
    }

    if (response.status === 401) {
      throw new ApiError('Invalid username or password.', 401);
    }

    if (!response.ok) {
      const message =
        parsed && typeof parsed === 'object' && 'message' in parsed && typeof parsed.message === 'string'
          ? parsed.message
          : `Request failed: ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) {
      if (__DEV__) {
        console.error(`[Delivery] ${debugLabel} failed:`, error.status, error.message);
      }
      throw error;
    }
    if (isAbortError(error)) {
      // Cancellation without timeout - this is intentional (e.g. component unmount)
      // Re-throw as a plain error so callers can detect it via isAbortError
      throw error;
    }
    if (error instanceof TypeError) {
      if (__DEV__) {
        console.error(`[Delivery] ${debugLabel} transport failure for ${url}:`, error.message);
      }
      throw new ApiError(
        `Could not reach ${API_BASE_URL || 'the server'}. Check the API URL and that the device is on the same network.`,
        0
      );
    }
    throw error;
  }
}

/**
 * Normalises the recipient-roles payload.
 *
 * The endpoint is declared as `List<String>` and does return a plain JSON array
 * today. The wrapped shape is tolerated only as defensive parsing - it never
 * changes what we send or what the backend returns.
 */
export function normalizeRecipientRoles(raw: unknown): string[] {
  let source: unknown[];

  if (Array.isArray(raw)) {
    source = raw;
  } else if (raw && typeof raw === 'object' && Array.isArray((raw as { positions?: unknown }).positions)) {
    source = (raw as { positions: unknown[] }).positions;
  } else {
    return [];
  }

  const seen = new Set<string>();
  const roles: string[] = [];

  for (const entry of source) {
    const role = typeof entry === 'string' ? entry.trim() : '';
    if (!role || seen.has(role)) continue;
    seen.add(role);
    roles.push(role);
  }

  return roles;
}

export const api = {
  /** Positions the backend knows about. Never blocks the Delivery form. */
  async getRecipientRoles(): Promise<RecipientPosition[]> {
    const raw = await fetchJson<unknown>(getApiUrl(API_ENDPOINTS.recipientRoles), undefined, 'positions');
    return normalizeRecipientRoles(raw).map((value) => ({ value, label: value }));
  },

  /** Background sync for positions - no timeout, no cancellation coupling. */
  async getRecipientRolesBackground(): Promise<RecipientPosition[]> {
    const raw = await fetchJsonNoTimeout<unknown>(getApiUrl(API_ENDPOINTS.recipientRoles), undefined, 'positions-background');
    return normalizeRecipientRoles(raw).map((value) => ({ value, label: value }));
  },

  async createDelivery(payload: CreateDeliveryRequest): Promise<DeliveryResponse> {
    return fetchJson<DeliveryResponse>(getApiUrl(API_ENDPOINTS.createDelivery), {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 'create-delivery');
  },
};
