import { createClient, RedisClientType } from 'redis';
import { config } from '@/lib/config';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    await redisClient.connect();
  }

  return redisClient;
}

// RedisJSON operations
export async function setJson(key: string, data: any, ttl?: number): Promise<void> {
  const client = await getRedisClient();

  // Store as JSON string for now (RedisJSON requires Redis Stack)
  await client.set(key, JSON.stringify(data));

  if (ttl) {
    await client.expire(key, ttl);
  }
}

export async function getJson<T = any>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const data = await client.get(key);

  if (!data) return null;

  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function deleteJson(key: string): Promise<boolean> {
  const client = await getRedisClient();
  const result = await client.del(key);
  return result > 0;
}

// Cache operations
export async function setCache(key: string, data: any, ttlSeconds: number): Promise<void> {
  await setJson(key, data, ttlSeconds);
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  return getJson<T>(key);
}

export async function invalidateCache(pattern: string): Promise<void> {
  const client = await getRedisClient();
  const keys = await client.keys(pattern);

  if (keys.length > 0) {
    await client.del(keys);
  }
}

// RedisSearch operations (simplified - would need Redis Stack for full functionality)
export async function searchTransactions(
  userId: string,
  query: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}
): Promise<any[]> {
  // This is a simplified implementation
  // In a real Redis Stack setup, you'd use FT.SEARCH
  const client = await getRedisClient();

  // For now, we'll implement a basic search using KEYS and filtering
  // In production, you'd want proper RedisSearch indexes
  const pattern = `transaction:${userId}:*`;
  const keys = await client.keys(pattern);

  const transactions = [];
  for (const key of keys) {
    const transaction = await getJson(key);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  // Basic filtering (would be much more sophisticated with RedisSearch)
  let filtered = transactions;

  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = transactions.filter(t =>
      t.vendor?.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery)
    );
  }

  // Sorting
  if (options.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[options.sortBy];
      const bVal = b[options.sortBy];

      if (options.sortOrder === 'DESC') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }

  // Pagination
  const { offset = 0, limit = 25 } = options;
  return filtered.slice(offset, offset + limit);
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
