import { NextRequest, NextResponse } from 'next/server';
import { syncTransactions } from '@/lib/plaid/client';
import { requireAuth } from '@/lib/auth/session';
import { getUserSettings } from '@/lib/redis/auth';

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

    const { cursor } = await request.json();

    // Sync transactions
    const syncData = await syncTransactions(accessToken, cursor);

    return NextResponse.json({
      added: syncData.added,
      modified: syncData.modified,
      removed: syncData.removed,
      nextCursor: syncData.next_cursor,
      hasMore: syncData.has_more,
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    );
  }
}
