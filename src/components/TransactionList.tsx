import { Transaction } from '@/lib/redis/types';

interface TransactionListProps {
  transactions: Transaction[];
  showPagination?: boolean;
  maxItems?: number;
  onCategorize?: (transactionId: string, category: string, type: string) => void;
}

export default function TransactionList({
  transactions,
  showPagination = true,
  maxItems,
  onCategorize
}: TransactionListProps) {
  const displayTransactions = maxItems ? transactions.slice(0, maxItems) : transactions;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayTransactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {transaction.vendor}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {transaction.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                  {transaction.category}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {transaction.type}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-4">
            <div className="text-right">
              <p className={`text-sm font-medium ${getAmountColor(transaction.amount)}`}>
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(transaction.date)}
              </p>
            </div>

            {onCategorize && (
              <button
                onClick={() => onCategorize(transaction.id, transaction.category, transaction.type)}
                className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      ))}

      {showPagination && transactions.length > (maxItems || 25) && (
        <div className="flex justify-center pt-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
