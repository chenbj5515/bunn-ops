import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable is not set");
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableAutoPipelining: true,
    });
  }

  return redis;
}
