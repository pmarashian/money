import { NextRequest, NextResponse } from 'next/server';
import { getAccountBalance, getTransactions } from '@/lib/plaid/client';
import { requireAuth } from '@/lib/auth/session';
import { getUserSettings } from '@/lib/redis/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get user settings to check if bank is connected
    const settings = await getUserSettings(user.id);
    if (!settings?.plaidAccessToken) {
      return NextResponse.json(
        { error: 'Bank account not connected' },
        { status: 400 }
      );
    }

    // Decrypt access token
    const accessToken = Buffer.from(settings.plaidAccessToken, 'base64').toString();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const accountId = searchParams.get('accountId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Get transactions
    const transactionsData = await getTransactions(accessToken, startDate, endDate, {
      accountIds: accountId ? [accountId] : undefined,
      count: 500, // Max per request
    });

    return NextResponse.json({
      transactions: transactionsData.transactions,
      accounts: transactionsData.accounts,
      totalCount: transactionsData.total_transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Get user settings to check if bank is connected
    const settings = await getUserSettings(user.id);
    if (!settings?.plaidAccessToken) {
      return NextResponse.json(
        { error: 'Bank account not connected' },
        { status: 400 }
      );
    }

    // Decrypt access token
    const accessToken = Buffer.from(settings.plaidAccessToken, 'base64').toString();

    // Get account balance
    const balanceData = await getAccountBalance(accessToken);

    return NextResponse.json({
      accounts: balanceData.accounts,
    });
  } catch (error) {
    console.error('Error fetching account balance:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch account balance' },
      { status: 500 }
    );
  }
}
