import { NextRequest, NextResponse } from 'next/server';
import { syncTransactions } from '@/lib/plaid/client';
import { invalidateUserCache } from '@/lib/redis/cache';
import { processNewTransactions } from '@/lib/transactions/processor';

// Webhook endpoint for Plaid transaction updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('plaid-verification') || '';
    const timestamp = request.headers.get('x-plaid-request-id') || '';

    // Verify webhook signature (simplified for development)
    // In production, implement proper signature verification
    // const isValidSignature = verifyWebhookSignature(body, signature, timestamp);
    // if (!isValidSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const webhookData = JSON.parse(body);

    console.log('Received Plaid webhook:', webhookData);

    // Handle different webhook types
    switch (webhookData.webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionWebhook(webhookData);
        break;

      case 'ITEM':
        await handleItemWebhook(webhookData);
        break;

      default:
        console.log('Unhandled webhook type:', webhookData.webhook_type);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Plaid from retrying with invalid data
    return NextResponse.json({ status: 'error', message: 'Processing failed' });
  }
}

async function handleTransactionWebhook(webhookData: any) {
  const { webhook_code, item_id, new_transactions = 0 } = webhookData;

  // Find user by item_id
  const userId = await findUserByItemId(item_id);
  if (!userId) {
    console.error('User not found for item_id:', item_id);
    return;
  }

  switch (webhook_code) {
    case 'INITIAL_UPDATE':
    case 'HISTORICAL_UPDATE':
      // Initial or historical data is ready
      console.log('Transaction data ready for user:', userId);

      // Trigger analysis for initial data
      if (webhook_code === 'INITIAL_UPDATE') {
        try {
          // Get user's Plaid access token
          const { getUserSettings } = await import('@/lib/redis/auth');
          const settings = await getUserSettings(userId);

          if (settings?.plaidAccessToken) {
            // Fetch recent transactions and process them
            const accessToken = Buffer.from(settings.plaidAccessToken, 'base64').toString();
            const { getTransactions } = await import('@/lib/plaid/client');

            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const transactionData = await getTransactions(accessToken, startDate, endDate);
            await processNewTransactions(userId, transactionData.transactions);
          }
        } catch (error) {
          console.error('Failed to process initial transactions:', error);
        }
      }
      break;

    case 'DEFAULT_UPDATE':
      // New transactions available
      console.log(`New transactions available for user ${userId}: ${new_transactions} transactions`);

      if (new_transactions > 0) {
        try {
          // Sync the new transactions
          const { getUserSettings } = await import('@/lib/redis/auth');
          const settings = await getUserSettings(userId);

          if (settings?.plaidAccessToken) {
            const accessToken = Buffer.from(settings.plaidAccessToken, 'base64').toString();
            const syncData = await syncTransactions(accessToken);

            if (syncData.added && syncData.added.length > 0) {
              await processNewTransactions(userId, syncData.added);
            }
          }
        } catch (error) {
          console.error('Failed to sync new transactions:', error);
        }
      }

      // Invalidate user cache to force refresh
      await invalidateUserCache(userId);
      break;

    case 'TRANSACTIONS_REMOVED':
      // Transactions were removed
      console.log('Transactions removed for user:', userId);
      await invalidateUserCache(userId);
      break;

    default:
      console.log('Unhandled transaction webhook code:', webhook_code);
  }
}

async function handleItemWebhook(webhookData: any) {
  const { webhook_code, item_id } = webhookData;

  // Find user by item_id
  const userId = await findUserByItemId(item_id);
  if (!userId) {
    console.error('User not found for item_id:', item_id);
    return;
  }

  switch (webhook_code) {
    case 'ERROR':
      console.error('Plaid item error for user:', userId, webhookData.error);
      break;

    case 'PENDING_EXPIRATION':
      console.warn('Plaid access token expiring soon for user:', userId);
      break;

    case 'USER_PERMISSION_REVOKED':
      console.warn('User revoked permissions for user:', userId);
      break;

    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      console.log('Webhook update acknowledged for user:', userId);
      break;

    default:
      console.log('Unhandled item webhook code:', webhook_code);
  }
}

async function findUserByItemId(itemId: string): Promise<string | null> {
  // This is a simplified lookup - in production, you'd maintain an index
  // For now, we'll scan user settings (not efficient for production)
  const { getRedisClient } = await import('@/lib/redis/client');
  const client = await getRedisClient();

  const pattern = 'user:*:settings';
  const keys = await client.keys(pattern);

  for (const key of keys) {
    try {
      const settings = await client.get(key);
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.plaidItemId === itemId) {
          const userId = key.split(':')[1];
          return userId;
        }
      }
    } catch (e) {
      console.error('Error parsing user settings:', e);
    }
  }

  return null;
}
