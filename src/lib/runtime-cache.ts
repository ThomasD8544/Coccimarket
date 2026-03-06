type CacheEntry<T> = { expiresAt: number; payload: T };

const dashboardCache = new Map<string, CacheEntry<unknown>>();
const batchesCache = new Map<string, CacheEntry<unknown>>();

export const CACHE_TTL_MS = 5000;

export function getCache<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return cached.payload;
}

export function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, payload: T, ttlMs = CACHE_TTL_MS) {
  cache.set(key, { payload, expiresAt: Date.now() + ttlMs });
}

export function clearRuntimeCaches() {
  dashboardCache.clear();
  batchesCache.clear();
}

export function getDashboardCache() {
  return dashboardCache;
}

export function getBatchesCache() {
  return batchesCache;
}
