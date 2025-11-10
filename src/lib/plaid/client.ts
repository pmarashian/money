import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { config } from '@/lib/config';

let plaidClient: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (!plaidClient) {
    const configuration = new Configuration({
      basePath: PlaidEnvironments[config.plaid.env as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': config.plaid.clientId,
          'PLAID-SECRET': config.plaid.secret,
        },
      },
    });

    plaidClient = new PlaidApi(configuration);
  }

  return plaidClient;
}

// Create a link token for Plaid Link
export async function createLinkToken(userId: string): Promise<string> {
  const client = getPlaidClient();

  try {
    const response = await client.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'Financial Dashboard',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });

    return response.data.link_token;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw new Error('Failed to create link token');
  }
}

// Exchange public token for access token
export async function exchangePublicToken(publicToken: string): Promise<{
  accessToken: string;
  itemId: string;
}> {
  const client = getPlaidClient();

  try {
    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw new Error('Failed to exchange public token');
  }
}

// Get account balance
export async function getAccountBalance(accessToken: string): Promise<any> {
  const client = getPlaidClient();

  try {
    const response = await client.accountsBalanceGet({
      access_token: accessToken,
    });

    return response.data;
  } catch (error) {
    console.error('Error getting account balance:', error);
    throw new Error('Failed to get account balance');
  }
}

// Get transactions
export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string,
  options: {
    accountIds?: string[];
    count?: number;
    offset?: number;
  } = {}
): Promise<any> {
  const client = getPlaidClient();

  try {
    const response = await client.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        account_ids: options.accountIds,
        count: options.count || 500,
        offset: options.offset || 0,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw new Error('Failed to get transactions');
  }
}

// Sync transactions (for ongoing sync)
export async function syncTransactions(
  accessToken: string,
  cursor?: string
): Promise<any> {
  const client = getPlaidClient();

  try {
    const response = await client.transactionsSync({
      access_token: accessToken,
      cursor: cursor,
    });

    return response.data;
  } catch (error) {
    console.error('Error syncing transactions:', error);
    throw new Error('Failed to sync transactions');
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  // In production, you should implement proper webhook signature verification
  // For now, we'll skip this for sandbox development
  return true;
}
