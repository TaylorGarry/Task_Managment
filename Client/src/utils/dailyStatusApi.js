import axios from "axios";

const DAILY_STATUS_CACHE_TTL_MS = 30000;
const dailyStatusCache = new Map();

const buildCacheKey = ({ endpoint, dateKey, token }) => `${endpoint}::${dateKey}::${token}`;

export const getDailyStatus = async ({ endpoint, dateKey, token, force = false }) => {
  if (!endpoint) throw new Error("Missing daily status endpoint");
  if (!token) throw new Error("Missing auth token");

  const cacheKey = buildCacheKey({ endpoint, dateKey, token });
  const now = Date.now();
  const cached = dailyStatusCache.get(cacheKey);

  if (!force && cached) {
    if (cached.promise) return cached.promise;
    if (now - cached.ts < DAILY_STATUS_CACHE_TTL_MS) return cached.value;
  }

  const request = axios
    .get(endpoint, {
      params: { dateKey },
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      dailyStatusCache.set(cacheKey, { ts: Date.now(), value: response });
      return response;
    })
    .catch((error) => {
      const current = dailyStatusCache.get(cacheKey);
      if (current?.promise === request) {
        dailyStatusCache.delete(cacheKey);
      }
      throw error;
    });

  dailyStatusCache.set(cacheKey, { ts: now, promise: request });
  return request;
};
