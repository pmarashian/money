import { getRedisClient, setCache, getCache, invalidateCache } from './client';
import { CACHE_KEYS } from '@/utils/constants';

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  dashboard: 300, // 5 minutes
  search: 60,     // 1 minute
  calculations: 300, // 5 minutes
  userSettings: 3600, // 1 hour
  automatedPayments: 3600, // 1 hour
  aiAnalysis: 3600, // 1 hour
} as const;

// Dashboard cache
export async function setDashboardCache(userId: string, data: any): Promise<void> {
  const key = CACHE_KEYS.dashboard(userId);
  await setCache(key, data, CACHE_TTL.dashboard);
}

export async function getDashboardCache(userId: string): Promise<any | null> {
  const key = CACHE_KEYS.dashboard(userId);
  return getCache(key);
}

export async function invalidateDashboardCache(userId: string): Promise<void> {
  const key = CACHE_KEYS.dashboard(userId);
  await invalidateCache(key);
}

// Search cache
export async function setSearchCache(userId: string, query: string, data: any): Promise<void> {
  const key = CACHE_KEYS.search(userId, query);
  await setCache(key, data, CACHE_TTL.search);
}

export async function getSearchCache(userId: string, query: string): Promise<any | null> {
  const key = CACHE_KEYS.search(userId, query);
  return getCache(key);
}

export async function invalidateSearchCache(userId: string): Promise<void> {
  const pattern = CACHE_KEYS.search(userId, '*');
  await invalidateCache(pattern);
}

// Calculations cache
export async function setCalculationCache(userId: string, key: string, data: any): Promise<void> {
  const cacheKey = CACHE_KEYS.calculations(userId, key);
  await setCache(cacheKey, data, CACHE_TTL.calculations);
}

export async function getCalculationCache(userId: string, key: string): Promise<any | null> {
  const cacheKey = CACHE_KEYS.calculations(userId, key);
  return getCache(cacheKey);
}

export async function invalidateCalculationCache(userId: string): Promise<void> {
  const pattern = CACHE_KEYS.calculations(userId, '*');
  await invalidateCache(pattern);
}

// General cache invalidation
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    invalidateDashboardCache(userId),
    invalidateSearchCache(userId),
    invalidateCalculationCache(userId),
  ]);
}

// Cache with custom TTL
export async function setCacheWithTTL(key: string, data: any, ttlSeconds: number): Promise<void> {
  await setCache(key, data, ttlSeconds);
}

export async function getCacheWithTTL<T = any>(key: string): Promise<T | null> {
  return getCache<T>(key);
}
