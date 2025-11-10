import { setJson, getJson } from './client';
import { REDIS_KEYS } from '@/utils/constants';
import { AutomatedPayment } from './types';

// Automated payments operations
export async function saveAutomatedPayment(userId: string, payment: AutomatedPayment): Promise<void> {
  const payments = await getAutomatedPayments(userId);
  const existingIndex = payments.findIndex(p => p.id === payment.id);

  if (existingIndex >= 0) {
    payments[existingIndex] = payment;
  } else {
    payments.push(payment);
  }

  const key = REDIS_KEYS.automatedPayments(userId);
  await setJson(key, payments);
}

export async function getAutomatedPayments(userId: string): Promise<AutomatedPayment[]> {
  const key = REDIS_KEYS.automatedPayments(userId);
  const payments = await getJson<AutomatedPayment[]>(key);
  return payments || [];
}

export async function getAutomatedPayment(userId: string, paymentId: string): Promise<AutomatedPayment | null> {
  const payments = await getAutomatedPayments(userId);
  return payments.find(p => p.id === paymentId) || null;
}

export async function updateAutomatedPayment(userId: string, paymentId: string, updates: Partial<AutomatedPayment>): Promise<AutomatedPayment | null> {
  const payments = await getAutomatedPayments(userId);
  const index = payments.findIndex(p => p.id === paymentId);

  if (index === -1) return null;

  const updatedPayment: AutomatedPayment = {
    ...payments[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  payments[index] = updatedPayment;

  const key = REDIS_KEYS.automatedPayments(userId);
  await setJson(key, payments);

  return updatedPayment;
}

export async function deleteAutomatedPayment(userId: string, paymentId: string): Promise<boolean> {
  const payments = await getAutomatedPayments(userId);
  const filtered = payments.filter(p => p.id !== paymentId);

  if (filtered.length === payments.length) return false;

  const key = REDIS_KEYS.automatedPayments(userId);
  await setJson(key, filtered);

  return true;
}

export async function getUpcomingPayments(userId: string, daysAhead: number = 30): Promise<AutomatedPayment[]> {
  const payments = await getAutomatedPayments(userId);
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  // This is a simplified implementation
  // In a real system, you'd calculate based on frequency patterns
  return payments.filter(payment => {
    if (!payment.nextExpected) return false;
    const nextExpected = new Date(payment.nextExpected);
    return nextExpected >= now && nextExpected <= futureDate;
  });
}

export async function calculateExpectedPayments(userId: string, startDate: string, endDate: string): Promise<number> {
  const payments = await getAutomatedPayments(userId);
  const start = new Date(startDate);
  const end = new Date(endDate);

  let total = 0;

  // Simplified calculation - assumes monthly payments
  // In a real system, you'd have more sophisticated frequency calculations
  for (const payment of payments) {
    if (payment.frequency === 'monthly') {
      const months = Math.ceil((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
      total += payment.amount * months;
    } else if (payment.frequency === 'bi-weekly') {
      const weeks = Math.ceil((end.getTime() - start.getTime()) / (14 * 24 * 60 * 60 * 1000));
      total += payment.amount * Math.ceil(weeks / 2);
    }
    // Add other frequencies as needed
  }

  return total;
}
