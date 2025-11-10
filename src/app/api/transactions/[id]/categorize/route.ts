import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getTransaction, saveTransaction } from '@/lib/redis/transactions';
import { invalidateUserCache } from '@/lib/redis/cache';
import { TRANSACTION_CATEGORIES } from '@/utils/constants';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { category, type } = await request.json();

    if (!params.id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Validate category
    if (category && !TRANSACTION_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['paycheck', 'bonus', 'automated_payment', 'manual_charge', 'transfer', 'deposit', 'withdrawal'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Get the transaction
    const transaction = await getTransaction(user.id, params.id);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update the transaction
    const updatedTransaction = {
      ...transaction,
      ...(category && { category }),
      ...(type && { type }),
      updatedAt: new Date().toISOString(),
    };

    await saveTransaction(user.id, updatedTransaction);

    // Invalidate user cache
    await invalidateUserCache(user.id);

    return NextResponse.json({
      transaction: updatedTransaction,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('Error updating transaction category:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// GET endpoint to get available categories and types
export async function GET() {
  try {
    return NextResponse.json({
      categories: TRANSACTION_CATEGORIES,
      types: [
        'paycheck',
        'bonus',
        'automated_payment',
        'manual_charge',
        'transfer',
        'deposit',
        'withdrawal',
      ],
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { error: 'Failed to get categories' },
      { status: 500 }
    );
  }
}
