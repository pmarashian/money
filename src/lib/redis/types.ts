import { TransactionCategory, TransactionType, AnalysisSchedule } from '@/utils/constants';

// User model
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

// User settings
export interface UserSettings {
  userId: string;
  nextBonusDate: string; // ISO date string
  paycheckDepositAmount: number; // Amount deposited into this account per paycheck
  bonusAmountRange: {
    min: number; // Minimum bonus range
    max: number; // Maximum bonus range
  };
  plaidAccessToken: string; // Encrypted
  plaidItemId: string;
  analysisSchedule: AnalysisSchedule;
  createdAt: string;
  updatedAt: string;
}

// Transaction model
export interface Transaction {
  id: string;
  userId: string;
  plaidTransactionId: string;
  accountId: string;
  amount: number; // Positive for credits, negative for debits
  date: string; // ISO date string
  vendor: string;
  description: string;
  category: TransactionCategory;
  type: TransactionType;
  pending: boolean;
  createdAt: string;
  updatedAt: string;
}

// Automated payment model
export interface AutomatedPayment {
  id: string;
  userId: string;
  vendor: string;
  amount: number; // Exact amount
  frequency: 'monthly' | 'bi-weekly' | 'weekly' | 'quarterly' | 'annual';
  category: TransactionCategory;
  lastOccurrence: string; // ISO date string
  nextExpected?: string; // ISO date string
  confidence: number; // 0-1, how confident we are this is automated
  createdAt: string;
  updatedAt: string;
}

// AI Analysis result
export interface AIAnalysisResult {
  userId: string;
  dateRange: {
    start: string;
    end: string;
  };
  automatedPayments: AutomatedPayment[];
  anomalies: {
    transactionId: string;
    reason: string; // Why it's considered an anomaly
  }[];
  paychecks: {
    transactionId: string;
    amount: number;
    date: string;
  }[];
  bonuses: {
    transactionId: string;
    amount: number;
    date: string;
  }[];
  categoryMappings: {
    transactionId: string;
    category: TransactionCategory;
    confidence: number;
  }[];
  analyzedAt: string;
}

// Alert model
export interface Alert {
  id: string;
  userId: string;
  type: 'low_funds' | 'upcoming_bonus' | 'unexpected_transaction' | 'missing_payment' | 'bonus_detected';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  data?: any; // Additional data for the alert
  read: boolean;
  createdAt: string;
  dismissedAt?: string;
}

// Financial calculation result
export interface FinancialCalculation {
  userId: string;
  calculationKey: string;
  currentBalance: number;
  nextBonusDate: string;
  daysUntilBonus: number;
  paychecksUntilBonus: number;
  expectedPaycheckDeposits: number;
  expectedExpenses: number;
  availableFunds: number;
  requiredFunds: number;
  overUnder: number; // Positive = surplus, negative = deficit
  automatedPayments: AutomatedPayment[];
  calculatedAt: string;
}

// Dashboard data
export interface DashboardData {
  user: User;
  settings: UserSettings;
  currentBalance: number;
  financialOutlook: FinancialCalculation;
  recentTransactions: Transaction[];
  upcomingPayments: AutomatedPayment[];
  alerts: Alert[];
  spendingByCategory: {
    category: TransactionCategory;
    amount: number;
    transactionCount: number;
    timePeriod: string; // e.g., "2024-11", "2024-Q4"
  }[];
  lastUpdated: string;
}

// Search result
export interface TransactionSearchResult {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
