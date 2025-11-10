import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getDashboardCache, setDashboardCache } from '@/lib/redis/cache';
import { getUserTransactions } from '@/lib/redis/transactions';
import { getAutomatedPayments } from '@/lib/redis/automated-payments';
import { getAlerts } from '@/lib/alerts/system';
import { calculateFinancialOutlook, calculateSpendingByCategory } from '@/lib/calculations/financial-outlook';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check cache first
    const cached = await getDashboardCache(user.id);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Aggregate dashboard data
    const [recentTransactions, automatedPayments, alerts] = await Promise.all([
      getUserTransactions(user.id, { limit: 10 }), // Recent transactions
      getAutomatedPayments(user.id),
      getAlerts(user.id),
    ]);

    // Calculate financial outlook
    // Note: In a real app, you'd get current balance from Plaid
    const currentBalance = 5000; // Placeholder
    const nextBonusDate = settings?.nextBonusDate; // From user settings

    const financialOutlook = calculateFinancialOutlook({
      currentBalance,
      nextBonusDate,
      automatedPayments,
      paycheckDepositAmount: settings?.paycheckDepositAmount,
    });

    // Calculate spending by category (monthly)
    const spendingByCategory = calculateSpendingByCategory(recentTransactions, 'monthly');

    // Build dashboard data
    const dashboardData = {
      currentBalance,
      financialOutlook,
      recentTransactions,
      automatedPayments,
      alerts,
      spendingByCategory,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result
    await setDashboardCache(user.id, dashboardData);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
