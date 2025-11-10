'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BalanceCard from '@/components/BalanceCard';
import FinancialOutlook from '@/components/FinancialOutlook';
import TransactionList from '@/components/TransactionList';
import AlertBanner from '@/components/AlertBanner';
import SpendingByCategory from '@/components/SpendingByCategory';
import { Alert } from '@/lib/redis/types';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
    loadAlerts();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (response.ok) {
        setDashboardData(data);
      } else {
        setError(data.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();

      if (response.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', alertId }),
      });

      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      }
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', alertId }),
      });

      if (response.ok) {
        setAlerts(alerts.map(alert =>
          alert.id === alertId ? { ...alert, read: true } : alert
        ));
      }
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const unreadAlerts = alerts.filter(alert => !alert.read);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your finances and stay on top of your budget until the next bonus.
          </p>
        </div>

        {/* Alerts */}
        {unreadAlerts.length > 0 && (
          <AlertBanner
            alerts={unreadAlerts}
            onDismiss={handleDismissAlert}
            onMarkRead={handleMarkAlertRead}
          />
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BalanceCard balance={dashboardData?.currentBalance || 0} />
          <FinancialOutlook outlook={dashboardData?.financialOutlook} />
          {/* Add more metric cards as needed */}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SpendingByCategory
            spending={dashboardData?.spendingByCategory || []}
            onPeriodChange={loadDashboardData}
          />
          {/* Add more charts here */}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Transactions
            </h2>
            <button
              onClick={() => router.push('/transactions')}
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View All →
            </button>
          </div>

          <TransactionList
            transactions={dashboardData?.recentTransactions || []}
            showPagination={false}
            maxItems={10}
          />
        </div>
      </div>
    </div>
  );
}
