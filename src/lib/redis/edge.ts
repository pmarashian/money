import { Redis } from '@upstash/redis';
import { config } from '@/lib/config';

let upstashClient: Redis | null = null;

export function getUpstashClient(): Redis {
  if (!upstashClient) {
    upstashClient = new Redis({
      url: config.upstash.restUrl,
      token: config.upstash.restToken,
    });
  }

  return upstashClient;
}

// Edge-compatible operations
export async function setEdgeCache(key: string, data: any, ttlSeconds: number): Promise<void> {
  const client = getUpstashClient();
  await client.set(key, JSON.stringify(data), { ex: ttlSeconds });
}

export async function getEdgeCache<T = any>(key: string): Promise<T | null> {
  const client = getUpstashClient();
  const data = await client.get(key);

  if (!data) return null;

  try {
    return JSON.parse(data as string) as T;
  } catch {
    return null;
  }
}

export async function deleteEdgeCache(key: string): Promise<boolean> {
  const client = getUpstashClient();
  const result = await client.del(key);
  return result > 0;
}

// Session management for Edge
export async function getSession(sessionId: string): Promise<any | null> {
  return getEdgeCache(`session:${sessionId}`);
}

export async function setSession(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
  await setEdgeCache(`session:${sessionId}`, data, ttlSeconds);
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  return deleteEdgeCache(`session:${sessionId}`);
}
