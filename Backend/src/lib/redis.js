import Redis from 'ioredis';

let pubClient = null;
let subClient = null;
let isRedisConnected = false;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export async function initRedis() {
  try {
    pubClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Connection retries exceeded. Falling back to in-memory adapter.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 1000);
      },
      lazyConnect: true,
    });

    pubClient.on('error', (err) => {
      // Gracefully prevent unhandled crash
      if (!isRedisConnected) {
        console.warn(`[Redis Pub] Notice: Redis not reachable (${err.message}). Using local in-memory fallback.`);
      }
    });

    await pubClient.connect();
    subClient = pubClient.duplicate();
    await subClient.connect();

    isRedisConnected = true;
    console.log('[Redis] Successfully connected to Redis Pub/Sub at', REDIS_URL);
    return { pubClient, subClient, isRedisConnected: true };
  } catch (error) {
    console.warn(`[Redis] Notice: Redis not running at ${REDIS_URL}. Running in standalone in-memory mode.`);
    isRedisConnected = false;
    return { pubClient: null, subClient: null, isRedisConnected: false };
  }
}

export function getRedisClients() {
  return { pubClient, subClient, isRedisConnected };
}

export function getRedisUrl() {
  return REDIS_URL;
}
