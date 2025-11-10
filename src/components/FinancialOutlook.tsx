interface FinancialOutlookProps {
  outlook: {
    daysUntilBonus: number;
    paychecksUntilBonus: number;
    overUnder: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
    nextBonusDate?: string;
  } | null;
}

export default function FinancialOutlook({ outlook }: FinancialOutlookProps) {
  if (!outlook) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading financial outlook...</p>
      </div>
    );
  }

  const { daysUntilBonus, overUnder, riskLevel, recommendations, nextBonusDate } = outlook;
  const hasBonus = !!nextBonusDate;

  const isPositive = overUnder >= 0;
  const formattedOverUnder = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always',
  }).format(overUnder);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Financial Outlook
        </h3>
        <span className={`text-sm font-medium ${getRiskColor(riskLevel)}`}>
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {hasBonus ? 'Days until bonus' : '90-day projection'}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {hasBonus ? daysUntilBonus : 'Based on paychecks'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Financial position
          </span>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formattedOverUnder}
          </span>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Recommendations:</p>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
              {recommendations.slice(0, 2).map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
