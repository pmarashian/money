import { analyzeTransactionsWithAI } from './client';
import { Transaction, AutomatedPayment, AIAnalysisResult } from '@/lib/redis/types';
import { TRANSACTION_CATEGORIES } from '@/utils/constants';

export interface TransactionAnalysisInput {
  transactions: Transaction[];
  userId: string;
  dateRange: {
    start: string;
    end: string;
  };
  context?: {
    paycheckAmount?: number;
    bonusRange?: { min: number; max: number };
    knownAutomatedPayments?: AutomatedPayment[];
  };
}

export interface TransactionAnalysisOutput {
  automatedPayments: AutomatedPayment[];
  anomalies: {
    transactionId: string;
    reason: string;
  }[];
  paychecks: {
    transactionId: string;
    amount: number;
    date: string;
    isBonus: boolean;
  }[];
  bonuses: {
    transactionId: string;
    amount: number;
    date: string;
  }[];
  categories: {
    transactionId: string;
    category: string;
    confidence: number;
  }[];
}

// Convert transactions to format expected by AI
function prepareTransactionsForAI(transactions: Transaction[]): any[] {
  return transactions.map((t, index) => ({
    index,
    id: t.id,
    date: t.date,
    amount: t.amount,
    vendor: t.vendor,
    description: t.description,
    pending: t.pending,
  }));
}

// Analyze transactions using AI
export async function analyzeTransactions(
  input: TransactionAnalysisInput
): Promise<AIAnalysisResult> {
  const { transactions, userId, dateRange, context } = input;

  // Prepare transactions for AI analysis
  const preparedTransactions = prepareTransactionsForAI(transactions);

  // Call AI analysis
  const aiResult = await analyzeTransactionsWithAI(preparedTransactions, {
    userId,
    dateRange,
    knownPaycheckAmount: context?.paycheckAmount,
    knownBonusRange: context?.bonusRange,
  });

  // Process and validate AI results
  const processedResult = processAIResults(aiResult, transactions, userId, dateRange);

  return processedResult;
}

// Process and validate AI analysis results
function processAIResults(
  aiResult: any,
  originalTransactions: Transaction[],
  userId: string,
  dateRange: { start: string; end: string }
): AIAnalysisResult {
  const result: AIAnalysisResult = {
    userId,
    dateRange,
    automatedPayments: [],
    anomalies: [],
    paychecks: [],
    bonuses: [],
    categoryMappings: [],
    analyzedAt: new Date().toISOString(),
  };

  try {
    // Process automated payments
    if (aiResult.automated_payments && Array.isArray(aiResult.automated_payments)) {
      result.automatedPayments = aiResult.automated_payments
        .filter((payment: any) => isValidAutomatedPayment(payment))
        .map((payment: any, index: number) => ({
          id: `auto_${userId}_${Date.now()}_${index}`,
          userId,
          vendor: payment.vendor || 'Unknown',
          amount: Math.abs(payment.amount || 0),
          frequency: validateFrequency(payment.frequency),
          category: validateCategory(payment.category),
          lastOccurrence: payment.last_occurrence || new Date().toISOString(),
          confidence: 0.8, // Default confidence for AI-detected payments
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
    }

    // Process anomalies
    if (aiResult.anomalies && Array.isArray(aiResult.anomalies)) {
      result.anomalies = aiResult.anomalies
        .filter((anomaly: any) => anomaly.transaction_index !== undefined)
        .map((anomaly: any) => ({
          transactionId: originalTransactions[anomaly.transaction_index]?.id,
          reason: anomaly.reason || 'Unusual transaction',
        }))
        .filter(anomaly => anomaly.transactionId);
    }

    // Process paychecks
    if (aiResult.paychecks && Array.isArray(aiResult.paychecks)) {
      result.paychecks = aiResult.paychecks
        .filter((paycheck: any) => paycheck.transaction_index !== undefined)
        .map((paycheck: any) => ({
          transactionId: originalTransactions[paycheck.transaction_index]?.id,
          amount: paycheck.amount || 0,
          date: paycheck.date || originalTransactions[paycheck.transaction_index]?.date,
          isBonus: paycheck.is_bonus || false,
        }))
        .filter(paycheck => paycheck.transactionId);
    }

    // Process bonuses
    if (aiResult.bonuses && Array.isArray(aiResult.bonuses)) {
      result.bonuses = aiResult.bonuses
        .filter((bonus: any) => bonus.transaction_index !== undefined)
        .map((bonus: any) => ({
          transactionId: originalTransactions[bonus.transaction_index]?.id,
          amount: bonus.amount || 0,
          date: bonus.date || originalTransactions[bonus.transaction_index]?.date,
        }))
        .filter(bonus => bonus.transactionId);
    }

    // Process categories
    if (aiResult.categories && Array.isArray(aiResult.categories)) {
      result.categoryMappings = aiResult.categories
        .filter((cat: any) => cat.transaction_index !== undefined)
        .map((cat: any) => ({
          transactionId: originalTransactions[cat.transaction_index]?.id,
          category: validateCategory(cat.category),
          confidence: Math.max(0, Math.min(1, cat.confidence || 0.5)),
        }))
        .filter(cat => cat.transactionId);
    }
  } catch (error) {
    console.error('Error processing AI results:', error);
    // Return minimal result if processing fails
  }

  return result;
}

// Validation helpers
function isValidAutomatedPayment(payment: any): boolean {
  return (
    payment.vendor &&
    typeof payment.amount === 'number' &&
    payment.amount > 0 &&
    payment.frequency &&
    payment.category
  );
}

function validateFrequency(frequency: string): AutomatedPayment['frequency'] {
  const validFrequencies: AutomatedPayment['frequency'][] = ['monthly', 'bi-weekly', 'weekly', 'quarterly', 'annual'];
  return validFrequencies.includes(frequency as any) ? (frequency as AutomatedPayment['frequency']) : 'monthly';
}

function validateCategory(category: string): string {
  // Check if it's a valid predefined category
  if (TRANSACTION_CATEGORIES.includes(category as any)) {
    return category;
  }

  // Default to 'other' if not recognized
  return 'other';
}

// Utility function to get analysis summary
export function getAnalysisSummary(analysis: AIAnalysisResult): {
  automatedPaymentCount: number;
  anomalyCount: number;
  paycheckCount: number;
  bonusCount: number;
  categorizedTransactions: number;
} {
  return {
    automatedPaymentCount: analysis.automatedPayments.length,
    anomalyCount: analysis.anomalies.length,
    paycheckCount: analysis.paychecks.length,
    bonusCount: analysis.bonuses.length,
    categorizedTransactions: analysis.categoryMappings.length,
  };
}
