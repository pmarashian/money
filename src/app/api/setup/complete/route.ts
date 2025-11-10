import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { saveAutomatedPayments } from '@/lib/redis/transactions';
import { generateAlerts } from '@/lib/alerts/system';
import { invalidateUserCache } from '@/lib/redis/cache';

interface AutomatedPaymentInput {
  id: string;
  vendor: string;
  amount: number;
  frequency: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { automatedPayments } = await request.json();

    if (!Array.isArray(automatedPayments)) {
      return NextResponse.json(
        { error: 'Automated payments must be an array' },
        { status: 400 }
      );
    }

    // Validate and format automated payments
    const validatedPayments = automatedPayments.map((payment: AutomatedPaymentInput, index: number) => {
      if (!payment.vendor || !payment.amount || !payment.frequency || !payment.category) {
        throw new Error(`Invalid payment data at index ${index}`);
      }

      return {
        id: payment.id || `payment_${Date.now()}_${index}`,
        userId: user.id,
        vendor: payment.vendor,
        amount: Math.abs(payment.amount),
        frequency: payment.frequency as 'monthly' | 'bi-weekly' | 'weekly' | 'quarterly' | 'annual',
        category: payment.category,
        lastOccurrence: new Date().toISOString(),
        confidence: 0.9, // User-confirmed payments have high confidence
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Save automated payments
    await saveAutomatedPayments(user.id, validatedPayments);

    // Generate initial alerts
    // Note: This would normally include financial data, but we'll skip for setup completion
    const initialAlerts = [];
    // const initialAlerts = await generateAlerts({
    //   userId: user.id,
    //   financialOutlook: {}, // Would need to calculate this
    //   recentTransactions: [],
    //   automatedPayments: validatedPayments,
    // });

    // Invalidate user cache to force refresh
    await invalidateUserCache(user.id);

    return NextResponse.json({
      message: 'Setup completed successfully',
      automatedPaymentsCount: validatedPayments.length,
    });
  } catch (error) {
    console.error('Setup completion error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete setup' },
      { status: 500 }
    );
  }
}
