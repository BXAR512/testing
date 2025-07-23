const routeCache = new Map();
const distanceCache = new Map();
const attendeeCache = new Map();

const CACHE_TTL = 5 * 60 * 1000;

function generateCacheKey(...args) {
  return args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join("|");
}

function getCachedValue(cache, key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  return null;
}

function setCachedValue(cache, key, value) {
  cache.set(key, { value, timestamp: Date.now() });
}

function cleanupCache(cache) {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

function clearAllCaches() {
  cleanupCache(routeCache);
  cleanupCache(distanceCache);
  cleanupCache(attendeeCache);
}

function cacheRoute(key, routeData) {
  setCachedValue(routeCache, key, routeData);
}

function getCacheRoute(key) {
  return getCachedValue(routeCache, key);
}

function cacheDistance(key, distanceData) {
  setCachedValue(distanceCache, key, distanceData);
}

function getCacheDistance(key) {
  return getCachedValue(distanceCache, key);
}

function cacheAttendee(key, attendeeData) {
  setCachedValue(attendeeCache, key, attendeeData);
}

function getCacheAttendee(key) {
  return getCachedValue(attendeeCache, key);
}

function needsCleanup(cache) {
  return cache.size > 1000;
}

module.exports = {
  routeCache,
  distanceCache,
  attendeeCache,
  generateCacheKey,
  getCachedValue,
  setCachedValue,
  cleanupCache,
  clearAllCaches,
  cacheRoute,
  getCacheRoute,
  cacheDistance,
  getCacheDistance,
  cacheAttendee,
  getCacheAttendee,
  needsCleanup,
  CACHE_TTL,
};
