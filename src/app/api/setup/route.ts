import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getUserSettings } from '@/lib/redis/auth';
import { getAutomatedPayments } from '@/lib/redis/automated-payments';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      // Check if user has completed setup
      const settings = await getUserSettings(user.id);
      const automatedPayments = await getAutomatedPayments(user.id);

      const hasBankConnection = !!(settings?.plaidAccessToken && settings?.plaidItemId);
      const hasBonusDate = !!settings?.nextBonusDate;
      const hasAutomatedPayments = automatedPayments.length > 0;

      const isSetupComplete = hasBankConnection && hasBonusDate && hasAutomatedPayments;

      return NextResponse.json({
        isSetupComplete,
        hasBankConnection,
        hasBonusDate,
        hasAutomatedPayments,
        setupProgress: {
          bank: hasBankConnection,
          bonus: hasBonusDate,
          payments: hasAutomatedPayments,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Setup status error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}
