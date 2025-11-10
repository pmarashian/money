import { getRedisClient } from './client';
import { Transaction } from './types';
import { REDIS_KEYS } from '@/utils/constants';

// Simplified RedisSearch implementation
// In production, this would use actual RedisSearch commands

export interface SearchOptions {
  query?: string;
  vendor?: string;
  category?: string;
  type?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount' | 'vendor';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  transactions: Transaction[];
  totalCount: number;
  facets?: {
    categories: { [key: string]: number };
    types: { [key: string]: number };
    dateRange: { min: string; max: string };
  };
}

// Search transactions for a user
export async function searchUserTransactions(userId: string, options: SearchOptions = {}): Promise<SearchResult> {
  const client = await getRedisClient();
  const pattern = REDIS_KEYS.transaction(userId, '*');
  const keys = await client.keys(pattern);

  // Get all transactions
  const transactions: Transaction[] = [];
  for (const key of keys) {
    const transaction = await client.get(key);
    if (transaction) {
      try {
        transactions.push(JSON.parse(transaction));
      } catch (e) {
        console.error('Failed to parse transaction:', e);
      }
    }
  }

  let filtered = transactions;

  // Apply filters
  if (options.query) {
    const query = options.query.toLowerCase();
    filtered = filtered.filter(t =>
      t.vendor?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }

  if (options.vendor) {
    const vendorQuery = options.vendor.toLowerCase();
    filtered = filtered.filter(t =>
      t.vendor?.toLowerCase().includes(vendorQuery)
    );
  }

  if (options.category) {
    filtered = filtered.filter(t => t.category === options.category);
  }

  if (options.type) {
    filtered = filtered.filter(t => t.type === options.type);
  }

  if (options.minAmount !== undefined) {
    filtered = filtered.filter(t => Math.abs(t.amount) >= options.minAmount!);
  }

  if (options.maxAmount !== undefined) {
    filtered = filtered.filter(t => Math.abs(t.amount) <= options.maxAmount!);
  }

  if (options.startDate) {
    filtered = filtered.filter(t => t.date >= options.startDate!);
  }

  if (options.endDate) {
    filtered = filtered.filter(t => t.date <= options.endDate!);
  }

  // Calculate facets before pagination
  const facets = calculateFacets(filtered);

  // Sort
  const sortBy = options.sortBy || 'date';
  const sortOrder = options.sortOrder || 'DESC';

  filtered.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case 'date':
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
        break;
      case 'amount':
        aVal = Math.abs(a.amount);
        bVal = Math.abs(b.amount);
        break;
      case 'vendor':
        aVal = a.vendor || '';
        bVal = b.vendor || '';
        break;
      default:
        return 0;
    }

    if (sortOrder === 'DESC') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });

  const totalCount = filtered.length;

  // Apply pagination
  const limit = options.limit || 25;
  const offset = options.offset || 0;
  const paginatedTransactions = filtered.slice(offset, offset + limit);

  return {
    transactions: paginatedTransactions,
    totalCount,
    facets,
  };
}

// Calculate facets for search results
function calculateFacets(transactions: Transaction[]) {
  const categories: { [key: string]: number } = {};
  const types: { [key: string]: number } = {};
  const dates = transactions.map(t => t.date).filter(d => d);

  transactions.forEach(t => {
    // Category facet
    categories[t.category] = (categories[t.category] || 0) + 1;

    // Type facet
    types[t.type] = (types[t.type] || 0) + 1;
  });

  const sortedDates = dates.sort();
  const dateRange = {
    min: sortedDates[0] || '',
    max: sortedDates[sortedDates.length - 1] || '',
  };

  return {
    categories,
    types,
    dateRange,
  };
}

// Get autocomplete suggestions for search
export async function getSearchSuggestions(userId: string, prefix: string, field: 'vendor' | 'description' = 'vendor'): Promise<string[]> {
  const client = await getRedisClient();
  const pattern = REDIS_KEYS.transaction(userId, '*');
  const keys = await client.keys(pattern);

  const suggestions = new Set<string>();

  for (const key of keys) {
    const transaction = await client.get(key);
    if (transaction) {
      try {
        const t: Transaction = JSON.parse(transaction);
        const value = field === 'vendor' ? t.vendor : t.description;

        if (value && value.toLowerCase().startsWith(prefix.toLowerCase())) {
          suggestions.add(value);
        }
      } catch (e) {
        console.error('Failed to parse transaction for suggestions:', e);
      }
    }
  }

  return Array.from(suggestions).slice(0, 10); // Limit to 10 suggestions
}

// Advanced search with multiple criteria
export async function advancedSearch(userId: string, criteria: {
  must?: SearchOptions;
  should?: SearchOptions;
  mustNot?: SearchOptions;
}): Promise<SearchResult> {
  // Simplified implementation - in real RedisSearch, you'd use complex queries
  return searchUserTransactions(userId, criteria.must || {});
}
