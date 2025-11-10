import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getUserSettings, saveUserSettings } from '@/lib/redis/auth';
import { analyzeTransactions } from '@/lib/ai/transaction-analyzer';
import { getUserTransactions } from '@/lib/redis/transactions';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { bonusDate, hasBonus } = await request.json();

    let validatedBonusDate: string | null = null;

    if (hasBonus) {
      if (!bonusDate) {
        return NextResponse.json(
          { error: 'Bonus date is required when bonuses are enabled' },
          { status: 400 }
        );
      }

      // Validate bonus date is in the future
      const bonusDateObj = new Date(bonusDate);
      const now = new Date();

      if (bonusDateObj <= now) {
        return NextResponse.json(
          { error: 'Bonus date must be in the future' },
          { status: 400 }
        );
      }

      validatedBonusDate = bonusDate;
    }

    // Get existing settings
    const existingSettings = await getUserSettings(user.id);

    // Update settings with bonus configuration
    await saveUserSettings(user.id, {
      ...existingSettings,
      nextBonusDate: validatedBonusDate,
      paycheckDepositAmount: existingSettings?.paycheckDepositAmount || config.finances.paycheckDepositAmount,
      bonusAmountRange: existingSettings?.bonusAmountRange || (config.finances.bonusAmountMin && config.finances.bonusAmountMax ? {
        min: config.finances.bonusAmountMin,
        max: config.finances.bonusAmountMax
      } : undefined),
      analysisSchedule: existingSettings?.analysisSchedule || 'manual',
    });

    // Fetch recent transactions for analysis
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const transactions = await getUserTransactions(user.id, {
      startDate,
      endDate,
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        message: 'No transactions found for analysis',
        automatedPayments: [],
      });
    }

    // Run AI analysis
    const analysis = await analyzeTransactions({
      transactions,
      userId: user.id,
      dateRange: { start: startDate, end: endDate },
      context: {
        paycheckAmount: config.finances.paycheckDepositAmount,
        bonusRange: config.finances.bonusAmountMin && config.finances.bonusAmountMax ? {
          min: config.finances.bonusAmountMin,
          max: config.finances.bonusAmountMax
        } : undefined,
      },
    });

    // Return the identified automated payments for user review
    return NextResponse.json({
      message: 'Analysis complete',
      automatedPayments: analysis.automatedPayments,
      analysisSummary: {
        totalTransactions: transactions.length,
        automatedPaymentsFound: analysis.automatedPayments.length,
        anomaliesFound: analysis.anomalies.length,
        paychecksFound: analysis.paychecks.length,
        bonusesFound: analysis.bonuses.length,
      },
    });
  } catch (error) {
    console.error('Setup initialization error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initialize setup' },
      { status: 500 }
    );
  }
}
