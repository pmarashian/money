import { NextRequest, NextResponse } from 'next/server';
import { createLinkToken } from '@/lib/plaid/client';
import { requireAuth } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await requireAuth();

    // Create link token
    const linkToken = await createLinkToken(user.id);

    return NextResponse.json({
      linkToken,
    });
  } catch (error) {
    console.error('Error creating link token:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user has connected their bank account
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user has settings with Plaid tokens
    const { getUserSettings } = await import('@/lib/redis/auth');
    const settings = await getUserSettings(user.id);

    const hasConnectedBank = !!(settings?.plaidAccessToken && settings?.plaidItemId);

    return NextResponse.json({
      hasConnectedBank,
      bankConnected: hasConnectedBank,
    });
  } catch (error) {
    console.error('Error checking bank connection:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check bank connection' },
      { status: 500 }
    );
  }
}
