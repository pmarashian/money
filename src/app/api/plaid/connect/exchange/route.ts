import { NextRequest, NextResponse } from 'next/server';
import { exchangePublicToken } from '@/lib/plaid/client';
import { requireAuth, getCurrentUser } from '@/lib/auth/session';
import { saveUserSettings, getUserSettings } from '@/lib/redis/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { publicToken } = await request.json();

    if (!publicToken) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const { accessToken, itemId } = await exchangePublicToken(publicToken);

    // Encrypt the access token (in production, use proper encryption)
    const encryptedAccessToken = Buffer.from(accessToken).toString('base64');

    // Get existing settings
    const existingSettings = await getUserSettings(user.id);

    // Save Plaid credentials to user settings
    await saveUserSettings(user.id, {
      plaidAccessToken: encryptedAccessToken,
      plaidItemId: itemId,
      analysisSchedule: existingSettings?.analysisSchedule || 'manual',
      paycheckDepositAmount: existingSettings?.paycheckDepositAmount || config.finances.paycheckDepositAmount,
      bonusAmountRange: existingSettings?.bonusAmountRange || (config.finances.bonusAmountMin && config.finances.bonusAmountMax ? {
        min: config.finances.bonusAmountMin,
        max: config.finances.bonusAmountMax
      } : undefined),
    });

    return NextResponse.json({
      message: 'Bank account connected successfully',
      itemId,
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to connect bank account' },
      { status: 500 }
    );
  }
}
