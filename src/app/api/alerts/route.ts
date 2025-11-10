import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getAlerts, markAlertAsRead, dismissAlert, getUnreadAlertsCount } from '@/lib/alerts/system';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'count') {
      const count = await getUnreadAlertsCount(user.id);
      return NextResponse.json({ count });
    }

    const alerts = await getAlerts(user.id);
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { action, alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'read':
        const readSuccess = await markAlertAsRead(user.id, alertId);
        return NextResponse.json({
          success: readSuccess,
          message: readSuccess ? 'Alert marked as read' : 'Alert not found',
        });

      case 'dismiss':
        const dismissSuccess = await dismissAlert(user.id, alertId);
        return NextResponse.json({
          success: dismissSuccess,
          message: dismissSuccess ? 'Alert dismissed' : 'Alert not found',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Alert action error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform alert action' },
      { status: 500 }
    );
  }
}
