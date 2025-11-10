import { AutomatedPayment, FinancialCalculation } from '@/lib/redis/types';
import { PAYCHECK_FREQUENCY_DAYS } from '@/utils/constants';

export interface FinancialOutlookInput {
  currentBalance: number;
  nextBonusDate?: string; // Optional for non-bonus users
  automatedPayments: AutomatedPayment[];
  paycheckDepositAmount?: number; // Optional, will use default if not provided
  lastPaycheckDate?: string; // Optional, for more accurate calculations
}

export interface FinancialOutlookResult {
  currentBalance: number;
  nextBonusDate?: string; // Optional for non-bonus users
  daysUntilBonus: number;
  paychecksUntilBonus: number;
  expectedPaycheckDeposits: number;
  expectedExpenses: number;
  availableFunds: number;
  requiredFunds: number;
  overUnder: number; // Positive = surplus, negative = deficit
  automatedPayments: AutomatedPayment[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  calculatedAt: string;
}

// Calculate financial outlook
export function calculateFinancialOutlook(input: FinancialOutlookInput): FinancialOutlookResult {
  const {
    currentBalance,
    nextBonusDate,
    automatedPayments,
    paycheckDepositAmount,
    lastPaycheckDate,
  } = input;

  const now = new Date();

  // Handle case where no bonus exists (bonus date is far in the future)
  const bonusDate = nextBonusDate ? new Date(nextBonusDate) : new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now
  const hasBonus = nextBonusDate && bonusDate.getTime() > now.getTime() + (30 * 24 * 60 * 60 * 1000); // Bonus within 30 days

  const daysUntilBonus = hasBonus ? Math.max(0, Math.ceil((bonusDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  // Calculate paychecks until bonus (or for next 90 days if no bonus)
  const projectionDays = hasBonus ? daysUntilBonus : 90; // 3 months projection if no bonus
  let paychecksUntilProjection: number;

  if (lastPaycheckDate) {
    // More accurate calculation using last paycheck date
    const lastPaycheck = new Date(lastPaycheckDate);
    const daysSinceLastPaycheck = Math.floor((now.getTime() - lastPaycheck.getTime()) / (1000 * 60 * 60 * 24));
    const nextPaycheckIn = PAYCHECK_FREQUENCY_DAYS - (daysSinceLastPaycheck % PAYCHECK_FREQUENCY_DAYS);
    const totalDays = projectionDays + nextPaycheckIn;
    paychecksUntilProjection = Math.max(0, Math.floor(totalDays / PAYCHECK_FREQUENCY_DAYS));
  } else {
    // Simple calculation
    paychecksUntilProjection = Math.max(0, Math.ceil(projectionDays / PAYCHECK_FREQUENCY_DAYS));
  }

  // Calculate expected paycheck deposits
  const paycheckAmount = paycheckDepositAmount;
  const expectedPaycheckDeposits = paycheckAmount ? paychecksUntilProjection * paycheckAmount : 0;

  // Calculate expected expenses from automated payments
  const expectedExpenses = calculateExpectedExpenses(automatedPayments, projectionDays);

  // Calculate available funds
  const availableFunds = currentBalance + expectedPaycheckDeposits;

  // Required funds = expected expenses
  const requiredFunds = expectedExpenses;

  // Calculate over/under
  const overUnder = availableFunds - requiredFunds;

  // Determine risk level
  const riskLevel = calculateRiskLevel(overUnder, projectionDays);

  // Generate recommendations
  const recommendations = generateRecommendations(overUnder, projectionDays, automatedPayments, hasBonus);

  return {
    currentBalance,
    nextBonusDate: hasBonus ? nextBonusDate : undefined,
    daysUntilBonus,
    paychecksUntilBonus: paychecksUntilProjection,
    expectedPaycheckDeposits,
    expectedExpenses,
    availableFunds,
    requiredFunds,
    overUnder,
    automatedPayments,
    riskLevel,
    recommendations,
    calculatedAt: new Date().toISOString(),
  };
}

// Calculate expected expenses based on automated payments
function calculateExpectedExpenses(automatedPayments: AutomatedPayment[], daysUntilBonus: number): number {
  let total = 0;

  for (const payment of automatedPayments) {
    switch (payment.frequency) {
      case 'monthly':
        // Calculate how many months until bonus
        const monthsUntilBonus = Math.max(1, Math.ceil(daysUntilBonus / 30));
        total += payment.amount * monthsUntilBonus;
        break;

      case 'bi-weekly':
        // Every 2 weeks
        const biWeeklyPeriods = Math.max(1, Math.ceil(daysUntilBonus / 14));
        total += payment.amount * Math.ceil(biWeeklyPeriods / 2);
        break;

      case 'weekly':
        const weeksUntilBonus = Math.max(1, Math.ceil(daysUntilBonus / 7));
        total += payment.amount * weeksUntilBonus;
        break;

      case 'quarterly':
        // Quarterly payments
        const quartersUntilBonus = Math.max(1, Math.ceil(daysUntilBonus / 91)); // ~3 months
        total += payment.amount * quartersUntilBonus;
        break;

      case 'annual':
        // If bonus is within the year, might need to pay annual bill
        if (daysUntilBonus <= 365) {
          total += payment.amount;
        }
        break;

      default:
        // Default to monthly
        const defaultMonths = Math.max(1, Math.ceil(daysUntilBonus / 30));
        total += payment.amount * defaultMonths;
    }
  }

  return total;
}

// Calculate risk level based on financial situation
function calculateRiskLevel(overUnder: number, daysUntilBonus: number): 'low' | 'medium' | 'high' {
  const deficitPercentage = overUnder < 0 ? Math.abs(overUnder) / (overUnder + 10000) : 0; // Using 10k as baseline

  if (overUnder >= 1000) return 'low';
  if (overUnder >= 0) return 'medium';
  if (deficitPercentage < 0.1) return 'medium';
  return 'high';
}

// Generate recommendations based on financial situation
function generateRecommendations(
  overUnder: number,
  projectionDays: number,
  automatedPayments: AutomatedPayment[],
  hasBonus: boolean = true
): string[] {
  const recommendations: string[] = [];

  if (overUnder < 0) {
    const deficit = Math.abs(overUnder);
    const timeFrame = hasBonus ? 'until your next bonus' : `over the next ${projectionDays} days`;
    recommendations.push(`You have a projected shortfall of $${deficit.toFixed(2)} ${timeFrame}.`);

    if (projectionDays > 30) {
      recommendations.push('Consider reducing discretionary spending to bridge the gap.');
    }

    if (hasBonus && projectionDays < 14) {
      recommendations.push('Your bonus is coming soon - monitor your balance closely.');
    }
  } else if (overUnder < 1000) {
    const timeFrame = hasBonus ? 'until the next bonus' : `over the next ${projectionDays} days`;
    recommendations.push(`Your finances are tight ${timeFrame}. Consider building an emergency fund.`);
  } else {
    const timeFrame = hasBonus ? 'until your next bonus' : `for the next ${projectionDays} days`;
    recommendations.push(`You have a healthy buffer ${timeFrame}.`);
  }

  // Check for high-frequency payments
  const weeklyPayments = automatedPayments.filter(p => p.frequency === 'weekly');
  if (weeklyPayments.length > 0) {
    recommendations.push('You have weekly automated payments - ensure sufficient funds are available.');
  }

  // Check for large monthly payments
  const largeMonthlyPayments = automatedPayments.filter(p =>
    p.frequency === 'monthly' && p.amount > 500
  );
  if (largeMonthlyPayments.length > 0) {
    recommendations.push('You have large monthly payments coming up. Plan accordingly.');
  }

  return recommendations;
}

// Calculate spending by category
export function calculateSpendingByCategory(
  transactions: any[],
  timePeriod: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
): Array<{
  category: string;
  amount: number;
  transactionCount: number;
  timePeriod: string;
}> {
  const now = new Date();
  let startDate: Date;

  switch (timePeriod) {
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarterly':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStart, 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  // Filter transactions by date
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= now;
  });

  // Group by category
  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const transaction of filteredTransactions) {
    // Only count debits (negative amounts)
    if (transaction.amount >= 0) continue;

    const category = transaction.category || 'other';
    const amount = Math.abs(transaction.amount);

    const existing = categoryMap.get(category) || { amount: 0, count: 0 };
    categoryMap.set(category, {
      amount: existing.amount + amount,
      count: existing.count + 1,
    });
  }

  // Convert to array and sort by amount
  const result = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    amount: data.amount,
    transactionCount: data.count,
    timePeriod: timePeriod,
  }));

  return result.sort((a, b) => b.amount - a.amount);
}
