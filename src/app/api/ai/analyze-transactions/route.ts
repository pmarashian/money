import { NextRequest, NextResponse } from 'next/server';
import { analyzeTransactions } from '@/lib/ai/transaction-analyzer';
import { requireAuth } from '@/lib/auth/session';
import { getUserSettings } from '@/lib/redis/auth';
import { getUserTransactions, saveAIAnalysis } from '@/lib/redis/transactions';
import { invalidateUserCache } from '@/lib/redis/cache';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const {
      startDate,
      endDate,
      force = false, // Force re-analysis even if cached
    } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Validate date range (max 3 months for performance)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 93) { // ~3 months
      return NextResponse.json(
        { error: 'Date range cannot exceed 3 months' },
        { status: 400 }
      );
    }

    // Check for cached analysis (unless force is true)
    if (!force) {
      const { getAIAnalysis } = await import('@/lib/redis/transactions');
      const cachedAnalysis = await getAIAnalysis(user.id, { start: startDate, end: endDate });
      if (cachedAnalysis) {
        return NextResponse.json({
          analysis: cachedAnalysis,
          cached: true,
        });
      }
    }

    // Get user settings for context
    const settings = await getUserSettings(user.id);

    // Get transactions for the date range
    const transactions = await getUserTransactions(user.id, {
      startDate,
      endDate,
    });

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found in the specified date range' },
        { status: 404 }
      );
    }

    // Run AI analysis
    const analysis = await analyzeTransactions({
      transactions,
      userId: user.id,
      dateRange: { start: startDate, end: endDate },
      context: {
        paycheckAmount: settings?.paycheckDepositAmount || config.finances.paycheckDepositAmount,
        bonusRange: settings?.bonusAmountRange || (config.finances.bonusAmountMin && config.finances.bonusAmountMax ? {
          min: config.finances.bonusAmountMin,
          max: config.finances.bonusAmountMax
        } : undefined),
      },
    });

    // Save analysis results
    await saveAIAnalysis(user.id, analysis);

    // Invalidate user cache to force dashboard refresh
    await invalidateUserCache(user.id);

    return NextResponse.json({
      analysis,
      cached: false,
    });
  } catch (error) {
    console.error('AI analysis error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze transactions' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve cached analysis
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const { getAIAnalysis } = await import('@/lib/redis/transactions');
    const analysis = await getAIAnalysis(user.id, { start: startDate, end: endDate });

    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis found for the specified date range' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      analysis,
      cached: true,
    });
  } catch (error) {
    console.error('Get analysis error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve analysis' },
      { status: 500 }
    );
  }
}
