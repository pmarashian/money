import { Transaction } from '@/lib/redis/types';
import { saveTransaction } from '@/lib/redis/transactions';
import { invalidateUserCache } from '@/lib/redis/cache';

// Bulk update transaction categories
export async function bulkUpdateCategories(
  userId: string,
  updates: Array<{
    transactionId: string;
    category?: string;
    type?: string;
  }>
): Promise<{
  updated: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    updated: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const update of updates) {
    try {
      const transaction = await getTransaction(userId, update.transactionId);
      if (!transaction) {
        results.failed++;
        results.errors.push(`Transaction ${update.transactionId} not found`);
        continue;
      }

      const updatedTransaction: Transaction = {
        ...transaction,
        ...(update.category && { category: update.category }),
        ...(update.type && { type: update.type }),
        updatedAt: new Date().toISOString(),
      };

      await saveTransaction(userId, updatedTransaction);
      results.updated++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to update transaction ${update.transactionId}: ${error}`);
    }
  }

  // Invalidate cache after bulk updates
  await invalidateUserCache(userId);

  return results;
}

// Get transactions that need categorization
export async function getUncategorizedTransactions(
  userId: string,
  limit: number = 50
): Promise<Transaction[]> {
  const { getUserTransactions } = await import('@/lib/redis/transactions');

  // Get recent transactions
  const transactions = await getUserTransactions(userId, {
    limit,
  });

  // Filter for transactions that might need categorization
  return transactions.filter(t =>
    t.category === 'other' ||
    t.type === 'manual_charge' ||
    !t.category ||
    !t.type
  );
}

// Auto-categorize transactions based on patterns
export async function autoCategorizeTransactions(
  userId: string,
  transactions: Transaction[]
): Promise<Array<{
  transactionId: string;
  suggestedCategory: string;
  suggestedType: string;
  confidence: number;
}>> {
  const suggestions = [];

  for (const transaction of transactions) {
    const suggestion = await suggestCategory(transaction);
    if (suggestion) {
      suggestions.push({
        transactionId: transaction.id,
        ...suggestion,
      });
    }
  }

  return suggestions;
}

// Simple rule-based categorization (can be enhanced with ML)
async function suggestCategory(transaction: Transaction): Promise<{
  suggestedCategory: string;
  suggestedType: string;
  confidence: number;
} | null> {
  const vendor = transaction.vendor.toLowerCase();
  const description = transaction.description.toLowerCase();

  // Utility payments
  if (vendor.includes('electric') || vendor.includes('power') || vendor.includes('con ed') ||
      vendor.includes('national grid') || description.includes('utility')) {
    return { suggestedCategory: 'utilities', suggestedType: 'automated_payment', confidence: 0.9 };
  }

  // Rent
  if (vendor.includes('rent') || vendor.includes('apartment') || vendor.includes('landlord') ||
      description.includes('rent')) {
    return { suggestedCategory: 'rent', suggestedType: 'automated_payment', confidence: 0.9 };
  }

  // Groceries
  if (vendor.includes('whole foods') || vendor.includes('trader joe') || vendor.includes('stop & shop') ||
      vendor.includes('wegmans') || vendor.includes('grocery') || description.includes('grocery')) {
    return { suggestedCategory: 'groceries', suggestedType: 'manual_charge', confidence: 0.8 };
  }

  // Dining
  if (vendor.includes('restaurant') || vendor.includes('cafe') || vendor.includes('pizza') ||
      vendor.includes('mcdonald') || vendor.includes('starbucks') || description.includes('dining')) {
    return { suggestedCategory: 'dining', suggestedType: 'manual_charge', confidence: 0.7 };
  }

  // Media/Entertainment
  if (vendor.includes('netflix') || vendor.includes('spotify') || vendor.includes('hulu') ||
      vendor.includes('amazon prime') || vendor.includes('disney') || description.includes('subscription')) {
    return { suggestedCategory: 'media', suggestedType: 'automated_payment', confidence: 0.8 };
  }

  // Transportation
  if (vendor.includes('uber') || vendor.includes('lyft') || vendor.includes('mbta') ||
      vendor.includes('gas') || vendor.includes('shell') || vendor.includes('exxon')) {
    return { suggestedCategory: 'transportation', suggestedType: 'manual_charge', confidence: 0.7 };
  }

  // Default fallback
  return { suggestedCategory: 'other', suggestedType: 'manual_charge', confidence: 0.3 };
}

// Import getTransaction for bulk updates
import { getTransaction } from '@/lib/redis/transactions';
