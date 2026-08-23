/**
 * Presence and Caching Store (Redis with graceful In-Memory Map fallback)
 */
class MemoryCache {
  constructor() {
    this.store = new Map();
    this.sets = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, expirySeconds = null) {
    this.store.set(key, value);
    if (expirySeconds) {
      setTimeout(() => this.store.delete(key), expirySeconds * 1000);
    }
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key);
  }

  async sadd(key, member) {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    this.sets.get(key).add(member);
    return 1;
  }

  async srem(key, member) {
    if (this.sets.has(key)) {
      this.sets.get(key).delete(member);
    }
    return 1;
  }

  async smembers(key) {
    if (!this.sets.has(key)) return [];
    return Array.from(this.sets.get(key));
  }

  async sismember(key, member) {
    if (!this.sets.has(key)) return false;
    return this.sets.get(key).has(member);
  }
}

class RedisWrapper {
  constructor(client) {
    this.client = client;
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, expirySeconds = null) {
    if (expirySeconds) {
      return this.client.set(key, value, 'EX', expirySeconds);
    }
    return this.client.set(key, value);
  }

  async del(key) {
    return this.client.del(key);
  }

  async sadd(key, member) {
    return this.client.sadd(key, member);
  }

  async srem(key, member) {
    return this.client.srem(key, member);
  }

  async smembers(key) {
    return this.client.smembers(key);
  }

  async sismember(key, member) {
    return this.client.sismember(key, member);
  }
}

let redisClient = new MemoryCache();

export const initRedis = async () => {
  if (process.env.REDIS_URL) {
    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        tls: process.env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      });

      client.on('connect', () => {
        console.log('[Redis] Connected to Upstash Cloud Redis successfully.');
        redisClient = new RedisWrapper(client);
      });

      client.on('error', (err) => {
        console.warn(`[Redis] Redis warning: ${err.message}. Using In-Memory fallback.`);
      });
    } catch (e) {
      console.log('[Redis] ioredis not available. Using In-Memory Presence Store.');
    }
  } else {
    console.log('[Redis] REDIS_URL not specified. Using high-speed In-Memory Presence Store.');
  }
  return redisClient;
};

export const getCacheClient = () => redisClient;
