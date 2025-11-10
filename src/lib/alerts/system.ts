import { Alert, Transaction, FinancialCalculation } from '@/lib/redis/types';
import { getRedisClient, setJson, getJson } from '@/lib/redis/client';
import { REDIS_KEYS } from '@/utils/constants';

export interface AlertCheckInput {
  userId: string;
  financialOutlook: FinancialCalculation;
  recentTransactions: Transaction[];
  automatedPayments: any[];
}

// Generate alerts based on current financial situation
export async function generateAlerts(input: AlertCheckInput): Promise<Alert[]> {
  const { userId, financialOutlook, recentTransactions, automatedPayments } = input;

  const alerts: Omit<Alert, 'id' | 'createdAt'>[] = [];

  // Low funds alert
  if (financialOutlook.overUnder < 0) {
    alerts.push({
      userId,
      type: 'low_funds',
      title: 'Low Funds Warning',
      message: `You have a projected shortfall of $${Math.abs(financialOutlook.overUnder).toFixed(2)} until your next bonus on ${new Date(financialOutlook.nextBonusDate).toLocaleDateString()}.`,
      severity: 'warning',
      data: {
        shortfall: financialOutlook.overUnder,
        daysUntilBonus: financialOutlook.daysUntilBonus,
      },
      read: false,
    });
  }

  // Upcoming bonus alert (within 7 days)
  if (financialOutlook.daysUntilBonus <= 7 && financialOutlook.daysUntilBonus > 0) {
    alerts.push({
      userId,
      type: 'upcoming_bonus',
      title: 'Bonus Incoming',
      message: `Your bonus is expected in ${financialOutlook.daysUntilBonus} days on ${new Date(financialOutlook.nextBonusDate).toLocaleDateString()}.`,
      severity: 'info',
      data: {
        bonusDate: financialOutlook.nextBonusDate,
        daysUntilBonus: financialOutlook.daysUntilBonus,
      },
      read: false,
    });
  }

  // Unexpected large transactions
  const largeTransactions = recentTransactions.filter(t => {
    // Transactions over $1000 that aren't categorized as paycheck or bonus
    return Math.abs(t.amount) > 1000 &&
           t.type !== 'paycheck' &&
           t.type !== 'bonus' &&
           t.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 7 days
  });

  for (const transaction of largeTransactions) {
    alerts.push({
      userId,
      type: 'unexpected_transaction',
      title: 'Large Transaction Detected',
      message: `A transaction of $${Math.abs(transaction.amount).toFixed(2)} at ${transaction.vendor} was detected. Please verify this is correct.`,
      severity: 'warning',
      data: {
        transactionId: transaction.id,
        amount: transaction.amount,
        vendor: transaction.vendor,
        date: transaction.date,
      },
      read: false,
    });
  }

  // Missing expected payments (simplified check)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (const payment of automatedPayments) {
    if (payment.frequency === 'monthly') {
      // Check if we have a payment for this month
      const hasPaymentThisMonth = recentTransactions.some(t =>
        t.vendor.toLowerCase().includes(payment.vendor.toLowerCase()) &&
        t.date.startsWith(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`) &&
        Math.abs(Math.abs(t.amount) - payment.amount) < 10 // Allow small variance
      );

      if (!hasPaymentThisMonth && now.getDate() > 15) { // Only alert after mid-month
        alerts.push({
          userId,
          type: 'missing_payment',
          title: 'Missing Expected Payment',
          message: `Expected monthly payment of $${payment.amount} to ${payment.vendor} not found for ${now.toLocaleDateString('default', { month: 'long', year: 'numeric' })}.`,
          severity: 'warning',
          data: {
            paymentId: payment.id,
            vendor: payment.vendor,
            expectedAmount: payment.amount,
            frequency: payment.frequency,
          },
          read: false,
        });
      }
    }
  }

  // Convert to full Alert objects
  const fullAlerts: Alert[] = alerts.map((alert, index) => ({
    ...alert,
    id: `alert_${userId}_${Date.now()}_${index}`,
    createdAt: new Date().toISOString(),
  }));

  return fullAlerts;
}

// Store alerts in Redis
export async function storeAlerts(userId: string, alerts: Alert[]): Promise<void> {
  const key = REDIS_KEYS.alerts(userId);
  await setJson(key, alerts);
}

// Get alerts for user
export async function getAlerts(userId: string): Promise<Alert[]> {
  const key = REDIS_KEYS.alerts(userId);
  const alerts = await getJson<Alert[]>(key);
  return alerts || [];
}

// Mark alert as read
export async function markAlertAsRead(userId: string, alertId: string): Promise<boolean> {
  const alerts = await getAlerts(userId);
  const alertIndex = alerts.findIndex(a => a.id === alertId);

  if (alertIndex === -1) return false;

  alerts[alertIndex] = {
    ...alerts[alertIndex],
    read: true,
  };

  await storeAlerts(userId, alerts);
  return true;
}

// Dismiss alert
export async function dismissAlert(userId: string, alertId: string): Promise<boolean> {
  const alerts = await getAlerts(userId);
  const filteredAlerts = alerts.filter(a => a.id !== alertId);

  if (filteredAlerts.length === alerts.length) return false;

  await storeAlerts(userId, filteredAlerts);
  return true;
}

// Get unread alerts count
export async function getUnreadAlertsCount(userId: string): Promise<number> {
  const alerts = await getAlerts(userId);
  return alerts.filter(a => !a.read).length;
}

// Clean up old alerts (keep only last 30 days)
export async function cleanupOldAlerts(userId: string): Promise<void> {
  const alerts = await getAlerts(userId);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.createdAt);
    return alertDate >= thirtyDaysAgo;
  });

  if (recentAlerts.length !== alerts.length) {
    await storeAlerts(userId, recentAlerts);
  }
}
