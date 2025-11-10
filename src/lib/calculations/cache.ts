import { setCalculationCache, getCalculationCache } from '@/lib/redis/cache';
import { FinancialCalculation } from '@/lib/redis/types';

// Cache keys for different calculation types
export const CALCULATION_KEYS = {
  financialOutlook: (userId: string) => `financial_outlook:${userId}`,
  spendingByCategory: (userId: string, period: string) => `spending_category:${userId}:${period}`,
  alerts: (userId: string) => `alerts:${userId}`,
} as const;

// Cache financial outlook calculation
export async function cacheFinancialOutlook(
  userId: string,
  calculation: FinancialCalculation
): Promise<void> {
  const key = CALCULATION_KEYS.financialOutlook(userId);
  await setCalculationCache(userId, key, calculation);
}

export async function getCachedFinancialOutlook(
  userId: string
): Promise<FinancialCalculation | null> {
  const key = CALCULATION_KEYS.financialOutlook(userId);
  return getCalculationCache(userId, key);
}

// Cache spending by category
export async function cacheSpendingByCategory(
  userId: string,
  period: string,
  data: any
): Promise<void> {
  const key = CALCULATION_KEYS.spendingByCategory(userId, period);
  await setCalculationCache(userId, key, data);
}

export async function getCachedSpendingByCategory(
  userId: string,
  period: string
): Promise<any | null> {
  const key = CALCULATION_KEYS.spendingByCategory(userId, period);
  return getCalculationCache(userId, key);
}

// Generic calculation caching
export async function cacheCalculation(
  userId: string,
  calculationType: string,
  data: any
): Promise<void> {
  const key = `${calculationType}:${userId}`;
  await setCalculationCache(userId, key, data);
}

export async function getCachedCalculation(
  userId: string,
  calculationType: string
): Promise<any | null> {
  const key = `${calculationType}:${userId}`;
  return getCalculationCache(userId, key);
}
