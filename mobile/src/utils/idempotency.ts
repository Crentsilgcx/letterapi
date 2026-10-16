/**
 * Generates a unique idempotency key for delivery creation.
 * 
 * Format: del_<timestamp>_<random>
 * - del_ prefix identifies the key type
 * - timestamp ensures chronological ordering
 * - random suffix prevents collisions in rapid submissions
 * 
 * The key is 32-40 characters, well within typical header limits.
 * Backend should store used keys with a TTL (e.g., 24 hours) to prevent
 * unbounded growth while still catching retries within a reasonable window.
 */
export function generateIdempotencyKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `del_${timestamp}_${random}`;
}