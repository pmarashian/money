import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { calculateFinancialOutlook, calculateSpendingByCategory } from '@/lib/calculations/financial-outlook';
import { cacheFinancialOutlook, getCachedFinancialOutlook, cacheSpendingByCategory, getCachedSpendingByCategory } from '@/lib/calculations/cache';
import { getUserSettings } from '@/lib/redis/auth';
import { getAutomatedPayments } from '@/lib/redis/automated-payments';
import { getUserTransactions } from '@/lib/redis/transactions';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'outlook';
    const force = searchParams.get('force') === 'true';

    switch (type) {
      case 'outlook':
        return await getFinancialOutlook(user.id, force);

      case 'spending':
        const period = (searchParams.get('period') || 'monthly') as 'monthly' | 'quarterly' | 'yearly';
        return await getSpendingByCategory(user.id, period, force);

      default:
        return NextResponse.json(
          { error: 'Invalid calculation type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Calculations error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Calculation failed' },
      { status: 500 }
    );
  }
}

// Calculate financial outlook
async function getFinancialOutlook(userId: string, force = false) {
  // Check cache first
  if (!force) {
    const cached = await getCachedFinancialOutlook(userId);
    if (cached) {
      return NextResponse.json({
        calculation: cached,
        cached: true,
      });
    }
  }

  // Get required data
  const [settings, automatedPayments] = await Promise.all([
    getUserSettings(userId),
    getAutomatedPayments(userId),
  ]);

  if (!settings?.nextBonusDate) {
    return NextResponse.json(
      { error: 'Bonus date not configured' },
      { status: 400 }
    );
  }

  // Get current balance (simplified - in real app, get from Plaid)
  // For now, we'll use a placeholder
  const currentBalance = 5000; // This should come from Plaid

  // Calculate outlook
  const calculation = calculateFinancialOutlook({
    currentBalance,
    nextBonusDate: settings.nextBonusDate,
    automatedPayments,
  });

  // Cache result
  await cacheFinancialOutlook(userId, calculation);

  return NextResponse.json({
    calculation,
    cached: false,
  });
}

// Calculate spending by category
async function getSpendingByCategory(userId: string, period: 'monthly' | 'quarterly' | 'yearly', force = false) {
  // Check cache first
  if (!force) {
    const cached = await getCachedSpendingByCategory(userId, period);
    if (cached) {
      return NextResponse.json({
        spending: cached,
        cached: true,
      });
    }
  }

  // Get transactions for the period
  const now = new Date();
  let startDate: string;

  switch (period) {
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      break;
    case 'quarterly':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      break;
  }

  const transactions = await getUserTransactions(userId, {
    startDate,
  });

  // Calculate spending by category
  const spending = calculateSpendingByCategory(transactions, period);

  // Cache result
  await cacheSpendingByCategory(userId, period, spending);

  return NextResponse.json({
    spending,
    cached: false,
    period,
  });
}
