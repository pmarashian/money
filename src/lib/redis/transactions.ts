import { getRedisClient, setJson, getJson, deleteJson } from './client';
import { REDIS_KEYS } from '@/utils/constants';
import { Transaction, AutomatedPayment, AIAnalysisResult } from './types';

// Transaction operations
export async function saveTransaction(userId: string, transaction: Transaction): Promise<void> {
  const key = REDIS_KEYS.transaction(userId, transaction.id);
  await setJson(key, transaction);
}

export async function getTransaction(userId: string, transactionId: string): Promise<Transaction | null> {
  const key = REDIS_KEYS.transaction(userId, transactionId);
  return getJson<Transaction>(key);
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<boolean> {
  const key = REDIS_KEYS.transaction(userId, transactionId);
  return deleteJson(key);
}

export async function getUserTransactions(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: string;
  } = {}
): Promise<Transaction[]> {
  const client = await getRedisClient();
  const pattern = REDIS_KEYS.transaction(userId, '*');
  const keys = await client.keys(pattern);

  const transactions: Transaction[] = [];
  for (const key of keys) {
    const transaction = await getJson<Transaction>(key);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  // Apply filters
  let filtered = transactions;

  if (options.startDate) {
    filtered = filtered.filter(t => t.date >= options.startDate!);
  }

  if (options.endDate) {
    filtered = filtered.filter(t => t.date <= options.endDate!);
  }

  if (options.category) {
    filtered = filtered.filter(t => t.category === options.category);
  }

  if (options.type) {
    filtered = filtered.filter(t => t.type === options.type);
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply pagination
  const { offset = 0, limit } = options;
  if (limit) {
    filtered = filtered.slice(offset, offset + limit);
  }

  return filtered;
}

// Automated payments operations
export async function saveAutomatedPayments(userId: string, payments: AutomatedPayment[]): Promise<void> {
  const key = REDIS_KEYS.automatedPayments(userId);
  await setJson(key, payments);
}

export async function getAutomatedPayments(userId: string): Promise<AutomatedPayment[]> {
  const key = REDIS_KEYS.automatedPayments(userId);
  const payments = await getJson<AutomatedPayment[]>(key);
  return payments || [];
}

export async function updateAutomatedPayment(userId: string, payment: AutomatedPayment): Promise<void> {
  const payments = await getAutomatedPayments(userId);
  const index = payments.findIndex(p => p.id === payment.id);

  if (index >= 0) {
    payments[index] = { ...payment, updatedAt: new Date().toISOString() };
  } else {
    payments.push(payment);
  }

  await saveAutomatedPayments(userId, payments);
}

export async function deleteAutomatedPayment(userId: string, paymentId: string): Promise<void> {
  const payments = await getAutomatedPayments(userId);
  const filtered = payments.filter(p => p.id !== paymentId);
  await saveAutomatedPayments(userId, filtered);
}

// AI Analysis operations
export async function saveAIAnalysis(userId: string, analysis: AIAnalysisResult): Promise<void> {
  const key = REDIS_KEYS.analysisCache(userId, `${analysis.dateRange.start}_${analysis.dateRange.end}`);
  await setJson(key, analysis);
}

export async function getAIAnalysis(userId: string, dateRange: { start: string; end: string }): Promise<AIAnalysisResult | null> {
  const key = REDIS_KEYS.analysisCache(userId, `${dateRange.start}_${dateRange.end}`);
  return getJson<AIAnalysisResult>(key);
}

// Bulk operations
export async function saveTransactions(userId: string, transactions: Transaction[]): Promise<void> {
  const promises = transactions.map(transaction => saveTransaction(userId, transaction));
  await Promise.all(promises);
}

export async function deleteAllUserTransactions(userId: string): Promise<void> {
  const client = await getRedisClient();
  const pattern = REDIS_KEYS.transaction(userId, '*');
  const keys = await client.keys(pattern);

  if (keys.length > 0) {
    await client.del(keys);
  }
}
