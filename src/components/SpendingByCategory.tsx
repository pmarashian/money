interface SpendingData {
  category: string;
  amount: number;
  transactionCount: number;
  timePeriod: string;
}

interface SpendingByCategoryProps {
  spending: SpendingData[];
  onPeriodChange?: (period: 'monthly' | 'quarterly' | 'yearly') => void;
}

export default function SpendingByCategory({ spending, onPeriodChange }: SpendingByCategoryProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const handlePeriodChange = (period: 'monthly' | 'quarterly' | 'yearly') => {
    setSelectedPeriod(period);
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalSpending = spending.reduce((sum, item) => sum + item.amount, 0);

  if (spending.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending by Category
        </h3>
        <p className="text-gray-600 dark:text-gray-400">No spending data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Spending by Category
        </h3>

        <div className="flex space-x-1">
          {(['monthly', 'quarterly', 'yearly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                selectedPeriod === period
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {spending.map((item, index) => {
          const percentage = totalSpending > 0 ? (item.amount / totalSpending) * 100 : 0;

          return (
            <div key={item.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.transactionCount} transactions
                  </p>
                </div>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Total</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalSpending)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Need to import React for useState
import React from 'react';
