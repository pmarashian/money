'use client';

import { useState, useEffect } from 'react';
import { Alert } from '@/lib/redis/types';

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  onMarkRead: (alertId: string) => void;
}

export default function AlertBanner({ alerts, onDismiss, onMarkRead }: AlertBannerProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    setVisibleAlerts(alerts.filter(alert => !alert.dismissedAt));
  }, [alerts]);

  if (visibleAlerts.length === 0) return null;

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200';
    }
  };

  const handleDismiss = async (alertId: string) => {
    onDismiss(alertId);
  };

  const handleMarkRead = async (alertId: string) => {
    onMarkRead(alertId);
  };

  return (
    <div className="space-y-3 mb-6">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 p-4 rounded-r-md ${getSeverityStyles(alert.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium">{alert.title}</h3>
              <p className="text-sm mt-1">{alert.message}</p>
              <p className="text-xs mt-2 opacity-75">
                {new Date(alert.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {!alert.read && (
                <button
                  onClick={() => handleMarkRead(alert.id)}
                  className="text-xs underline hover:no-underline"
                >
                  Mark Read
                </button>
              )}

              <button
                onClick={() => handleDismiss(alert.id)}
                className="text-xs underline hover:no-underline"
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
