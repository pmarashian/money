// Application constants
import { config } from '@/lib/config';

export const PAYCHECK_DEPOSIT_AMOUNT = config.finances.paycheckDepositAmount; // Amount deposited into this account per paycheck
export const BONUS_AMOUNT_RANGE = {
  min: config.finances.bonusAmountMin,
  max: config.finances.bonusAmountMax
}; // Approximate bonus range
export const PAYCHECK_FREQUENCY_DAYS = 14; // Every 2 weeks

// Bonus timing - last paycheck of month after quarter ends
export const BONUS_TIMING = {
  Q4: 'January', // Oct-Dec quarter → January bonus
  Q1: 'April',   // Jan-Mar quarter → April bonus
  Q2: 'July',    // Apr-Jun quarter → July bonus
  Q3: 'October', // Jul-Sep quarter → October bonus
};

// Transaction categories
export const TRANSACTION_CATEGORIES = [
  'rent',
  'utilities',
  'investments',
  'media',
  'groceries',
  'dining',
  'transportation',
  'entertainment',
  'healthcare',
  'shopping',
  'subscriptions',
  'insurance',
  'other'
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];

// Transaction types
export const TRANSACTION_TYPES = [
  'paycheck',
  'bonus',
  'automated_payment',
  'manual_charge',
  'transfer',
  'deposit',
  'withdrawal'
] as const;

export type TransactionType = typeof TRANSACTION_TYPES[number];

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

// Cache keys
export const CACHE_KEYS = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  search: (userId: string, query: string) => `search:${userId}:${query}`,
  calculations: (userId: string, key: string) => `calculations:${userId}:${key}`,
} as const;

// Redis keys
export const REDIS_KEYS = {
  user: (userId: string) => `user:${userId}`,
  userSettings: (userId: string) => `user:${userId}:settings`,
  userTransactions: (userId: string) => `user:${userId}:transactions`,
  transaction: (userId: string, transactionId: string) => `transaction:${userId}:${transactionId}`,
  automatedPayments: (userId: string) => `user:${userId}:automated-payments`,
  alerts: (userId: string) => `user:${userId}:alerts`,
  analysisCache: (userId: string, dateRange: string) => `user:${userId}:analysis:${dateRange}`,
} as const;

// AI Analysis schedule options
export const ANALYSIS_SCHEDULE = {
  manual: 'manual',
  daily: 'daily',
  weekly: 'weekly',
} as const;

export type AnalysisSchedule = typeof ANALYSIS_SCHEDULE[keyof typeof ANALYSIS_SCHEDULE];
