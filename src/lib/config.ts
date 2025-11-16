// Environment configuration
export const config = {
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID!,
    secret: process.env.PLAID_SECRET!,
    env: process.env.PLAID_ENV || 'sandbox',
    webhookSecret: process.env.PLAID_WEBHOOK_SECRET!,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: process.env.REDIS_PREFIX || 'money_app',
  },
  upstash: {
    restUrl: process.env.UPSTASH_REDIS_REST_URL!,
    restToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
  },
  auth: {
    sessionSecret: process.env.SESSION_SECRET!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  cache: {
    dashboard: parseInt(process.env.CACHE_TTL_DASHBOARD || '300'),
    search: parseInt(process.env.CACHE_TTL_SEARCH || '60'),
  },
  finances: {
    paycheckDepositAmount: process.env.PAYCHECK_DEPOSIT_AMOUNT ? parseFloat(process.env.PAYCHECK_DEPOSIT_AMOUNT) : undefined,
    bonusAmountMin: process.env.BONUS_AMOUNT_MIN ? parseFloat(process.env.BONUS_AMOUNT_MIN) : undefined,
    bonusAmountMax: process.env.BONUS_AMOUNT_MAX ? parseFloat(process.env.BONUS_AMOUNT_MAX) : undefined,
  } as {
    paycheckDepositAmount?: number;
    bonusAmountMin?: number;
    bonusAmountMax?: number;
  },
};

// Required environment variables
export const requiredEnvVars = [
  'PLAID_CLIENT_ID',
  'PLAID_SECRET',
  'PLAID_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'SESSION_SECRET',
];

// Validate required environment variables
export function validateConfig() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
