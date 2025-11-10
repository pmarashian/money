import { Transaction, AutomatedPayment } from '@/lib/redis/types';
import { PAYCHECK_DEPOSIT_AMOUNT, BONUS_AMOUNT_RANGE } from '@/utils/constants';
import { saveTransaction, saveTransactions, getAutomatedPayments } from '@/lib/redis/transactions';
import { analyzeTransactions } from '@/lib/ai/transaction-analyzer';

// Convert Plaid transaction to our Transaction format
export function convertPlaidTransaction(
  plaidTransaction: any,
  userId: string
): Transaction {
  const amount = plaidTransaction.amount;
  const isCredit = amount < 0; // Plaid uses negative for credits

  return {
    id: plaidTransaction.transaction_id,
    userId,
    plaidTransactionId: plaidTransaction.transaction_id,
    accountId: plaidTransaction.account_id,
    amount: Math.abs(amount), // Store as positive for credits, negative for debits
    date: plaidTransaction.date,
    vendor: plaidTransaction.merchant_name || plaidTransaction.name || 'Unknown',
    description: plaidTransaction.name || '',
    category: 'other', // Will be updated by AI analysis
    type: isCredit ? 'deposit' : 'manual_charge', // Will be refined by AI analysis
    pending: plaidTransaction.pending || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Process new transactions from Plaid webhook
export async function processNewTransactions(
  userId: string,
  plaidTransactions: any[]
): Promise<{
  processed: Transaction[];
  analysisTriggered: boolean;
}> {
  const transactions = plaidTransactions.map(t => convertPlaidTransaction(t, userId));

  // Save transactions to Redis
  await saveTransactions(userId, transactions);

  // Check if we should trigger AI analysis
  const shouldAnalyze = await shouldTriggerAnalysis(userId, transactions);

  if (shouldAnalyze) {
    // Trigger background analysis
    triggerAnalysis(userId).catch(error => {
      console.error('Background analysis failed:', error);
    });
  }

  return {
    processed: transactions,
    analysisTriggered: shouldAnalyze,
  };
}

// Determine if we should trigger AI analysis
async function shouldTriggerAnalysis(userId: string, newTransactions: Transaction[]): Promise<boolean> {
  // Trigger analysis if:
  // 1. We don't have automated payments yet, OR
  // 2. We have large transactions that might be bonuses, OR
  // 3. It's been more than 7 days since last analysis

  const automatedPayments = await getAutomatedPayments(userId);

  // If no automated payments, we need analysis
  if (automatedPayments.length === 0) {
    return true;
  }

  // Check for potential bonus transactions
  const potentialBonuses = newTransactions.filter(t =>
    t.amount >= BONUS_AMOUNT_RANGE.min &&
    t.amount <= BONUS_AMOUNT_RANGE.max * 1.5 // Allow some variance
  );

  if (potentialBonuses.length > 0) {
    return true;
  }

  // TODO: Check analysis frequency
  // For now, always trigger on new transactions
  return true;
}

// Trigger background analysis
async function triggerAnalysis(userId: string): Promise<void> {
  try {
    // Get recent transactions (last 3 months)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { getUserTransactions } = await import('@/lib/redis/transactions');
    const transactions = await getUserTransactions(userId, { startDate, endDate });

    if (transactions.length === 0) {
      return;
    }

    // Get user settings for context
    const { getUserSettings } = await import('@/lib/redis/auth');
    const settings = await getUserSettings(userId);

    // Run AI analysis
    const analysis = await analyzeTransactions({
      transactions,
      userId,
      dateRange: { start: startDate, end: endDate },
      context: {
        paycheckAmount: settings?.paycheckDepositAmount || PAYCHECK_DEPOSIT_AMOUNT,
        bonusRange: settings?.bonusAmountRange || BONUS_AMOUNT_RANGE,
      },
    });

    // Save analysis results
    const { saveAIAnalysis } = await import('@/lib/redis/transactions');
    await saveAIAnalysis(userId, analysis);

    // Update transactions with AI results
    await updateTransactionsWithAnalysis(userId, analysis);

    // Update automated payments
    await updateAutomatedPayments(userId, analysis.automatedPayments);

    console.log(`Analysis completed for user ${userId}: ${analysis.automatedPayments.length} automated payments found`);
  } catch (error) {
    console.error(`Analysis failed for user ${userId}:`, error);
    throw error;
  }
}

// Update transactions with AI analysis results
async function updateTransactionsWithAnalysis(
  userId: string,
  analysis: any
): Promise<void> {
  // Update transaction categories
  for (const categoryMapping of analysis.categoryMappings) {
    const { getTransaction } = await import('@/lib/redis/transactions');
    const transaction = await getTransaction(userId, categoryMapping.transactionId);

    if (transaction) {
      const updatedTransaction: Transaction = {
        ...transaction,
        category: categoryMapping.category,
        updatedAt: new Date().toISOString(),
      };

      await saveTransaction(userId, updatedTransaction);
    }
  }

  // Update paycheck types
  for (const paycheck of analysis.paychecks) {
    const { getTransaction } = await import('@/lib/redis/transactions');
    const transaction = await getTransaction(userId, paycheck.transactionId);

    if (transaction) {
      const updatedTransaction: Transaction = {
        ...transaction,
        type: paycheck.isBonus ? 'bonus' : 'paycheck',
        updatedAt: new Date().toISOString(),
      };

      await saveTransaction(userId, updatedTransaction);
    }
  }

  // Update bonus types
  for (const bonus of analysis.bonuses) {
    const { getTransaction } = await import('@/lib/redis/transactions');
    const transaction = await getTransaction(userId, bonus.transactionId);

    if (transaction) {
      const updatedTransaction: Transaction = {
        ...transaction,
        type: 'bonus',
        updatedAt: new Date().toISOString(),
      };

      await saveTransaction(userId, updatedTransaction);
    }
  }
}

// Update automated payments from analysis
async function updateAutomatedPayments(
  userId: string,
  newAutomatedPayments: AutomatedPayment[]
): Promise<void> {
  const { saveAutomatedPayments } = await import('@/lib/redis/transactions');

  // Get existing automated payments
  const existing = await getAutomatedPayments(userId);

  // Merge with new ones (avoid duplicates)
  const merged = [...existing];

  for (const newPayment of newAutomatedPayments) {
    const existingIndex = merged.findIndex(p =>
      p.vendor === newPayment.vendor &&
      Math.abs(p.amount - newPayment.amount) < 0.01 // Allow small differences
    );

    if (existingIndex >= 0) {
      // Update existing
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...newPayment,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Add new
      merged.push(newPayment);
    }
  }

  await saveAutomatedPayments(userId, merged);
}

// Detect bonus paychecks
export function detectBonusPaycheck(amount: number, date: string): boolean {
  // Check amount range
  if (amount < BONUS_AMOUNT_RANGE.min || amount > BONUS_AMOUNT_RANGE.max * 1.5) {
    return false;
  }

  // Check timing (last paycheck of month after quarter ends)
  const transactionDate = new Date(date);
  const month = transactionDate.getMonth() + 1; // 1-12
  const day = transactionDate.getDate();

  // Rough check: last week of month after quarter ends
  const quarterEndMonths = [3, 6, 9, 12]; // March, June, September, December
  const isAfterQuarterEnd = quarterEndMonths.includes(month) || quarterEndMonths.includes(month - 1);

  return isAfterQuarterEnd && day >= 20; // Last 10 days of month
}

// Detect regular paychecks
export function detectRegularPaycheck(amount: number): boolean {
  const tolerance = 50; // Allow $50 variance
  return Math.abs(amount - PAYCHECK_DEPOSIT_AMOUNT) <= tolerance;
}
