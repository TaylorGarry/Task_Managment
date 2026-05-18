import Redis from "ioredis";

const responseCacheStore = new Map();
const cacheTagVersions = new Map();

const nowMs = () => Date.now();
const REDIS_PREFIX = process.env.REDIS_CACHE_PREFIX || "tm:cache";
const REDIS_URL = String(process.env.REDIS_URL || "").trim();

let redisClient = null;
let redisEnabled = false;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableAutoPipelining: true,
    });
    redisEnabled = true;
    redisClient.on("error", (err) => {
      console.warn("[cache] redis error, falling back to in-memory cache:", err?.message || err);
    });
  } catch (err) {
    redisEnabled = false;
    redisClient = null;
    console.warn("[cache] failed to init redis client, using in-memory cache:", err?.message || err);
  }
}

const ensureRedisConnected = async () => {
  if (!redisEnabled || !redisClient) return false;
  if (redisClient.status === "ready") return true;
  if (redisClient.status === "connecting") return false;
  try {
    await redisClient.connect();
    return redisClient.status === "ready";
  } catch {
    return false;
  }
};

const stableStringify = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${k}:${stableStringify(value[k])}`)
    .join(",")}}`;
};

const buildCacheKey = (req, { keyPrefix = "api", varyByUser = true, varyHeaders = [] } = {}) => {
  const userPart = varyByUser ? String(req.user?._id || req.user?.id || "anon") : "public";
  const pathPart = `${req.method}:${req.originalUrl || req.url || req.path}`;
  const headersPart = varyHeaders
    .map((h) => `${h}:${String(req.headers?.[h.toLowerCase()] || "")}`)
    .join("|");
  return `${keyPrefix}|u=${userPart}|${pathPart}|h=${stableStringify(headersPart)}`;
};

const getMemoryTagVersion = (tag = "default") => cacheTagVersions.get(tag) || 0;

const getTagVersion = async (tag = "default") => {
  const redisReady = await ensureRedisConnected();
  if (!redisReady) return getMemoryTagVersion(tag);
  try {
    const raw = await redisClient.get(`${REDIS_PREFIX}:tag:${tag}`);
    const parsed = Number.parseInt(raw || "0", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return getMemoryTagVersion(tag);
  }
};

const incrementTagVersion = async (tag = "default") => {
  cacheTagVersions.set(tag, getMemoryTagVersion(tag) + 1);
  const redisReady = await ensureRedisConnected();
  if (!redisReady) return;
  try {
    await redisClient.incr(`${REDIS_PREFIX}:tag:${tag}`);
  } catch {
    // keep memory fallback active silently
  }
};

export const invalidateCacheTag = (tag = "default") => async (_req, _res, next) => {
  try {
    await incrementTagVersion(tag);
  } finally {
    next();
  }
};

const getCacheEntry = async (cacheKey) => {
  const redisReady = await ensureRedisConnected();
  if (redisReady) {
    try {
      const raw = await redisClient.get(`${REDIS_PREFIX}:resp:${cacheKey}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      // fallback below
    }
  }

  const hit = responseCacheStore.get(cacheKey);
  if (!hit || hit.expiresAt <= nowMs()) return null;
  return hit;
};

const setCacheEntry = async (cacheKey, value, ttlMs) => {
  const redisReady = await ensureRedisConnected();
  if (redisReady) {
    try {
      const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
      await redisClient.set(`${REDIS_PREFIX}:resp:${cacheKey}`, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch {
      // fallback below
    }
  }

  responseCacheStore.set(cacheKey, {
    ...value,
    expiresAt: nowMs() + ttlMs,
  });
};

export const cacheGetResponse = ({
  ttlMs = 30 * 1000,
  keyPrefix = "api",
  varyByUser = true,
  varyHeaders = [],
  tag = "default",
} = {}) => async (req, res, next) => {
  if (req.method !== "GET") return next();

  const cacheVersion = await getTagVersion(tag);
  const cacheKey = `${buildCacheKey(req, { keyPrefix, varyByUser, varyHeaders })}|v=${cacheVersion}`;
  const hit = await getCacheEntry(cacheKey);

  if (hit) {
    return res.status(hit.statusCode).json(hit.payload);
  }

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setCacheEntry(
        cacheKey,
        {
          statusCode: res.statusCode,
          payload,
        },
        ttlMs
      ).catch(() => {});
    }
    return originalJson(payload);
  };

  next();
};
