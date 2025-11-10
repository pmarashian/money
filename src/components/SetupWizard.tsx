'use client';

import { useState } from 'react';
import PlaidLink, { usePlaidLinkState } from './PlaidLink';

interface SetupWizardProps {
  onComplete: () => void;
}

type SetupStep = 'welcome' | 'connect-bank' | 'bonus-date' | 'analyzing' | 'review-payments' | 'complete';

interface AutomatedPayment {
  id: string;
  vendor: string;
  amount: number;
  frequency: string;
  category: string;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [bonusDate, setBonusDate] = useState('');
  const [hasBonus, setHasBonus] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [automatedPayments, setAutomatedPayments] = useState<AutomatedPayment[]>([]);
  const [error, setError] = useState('');

  const { linkToken, isLoading: plaidLoading, createLinkToken } = usePlaidLinkState();

  const handleBankConnect = async () => {
    try {
      await createLinkToken('current-user'); // In real app, get from auth context
      setCurrentStep('connect-bank');
    } catch (error) {
      setError('Failed to initialize bank connection');
    }
  };

  const handlePlaidSuccess = async (publicToken: string) => {
    try {
      // Exchange public token for access token
      const response = await fetch('/api/plaid/connect/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken }),
      });

      if (response.ok) {
        setCurrentStep('bonus-date');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to connect bank account');
      }
    } catch (error) {
      setError('Failed to connect bank account');
    }
  };

  const handleBonusDateSubmit = async () => {
    if (hasBonus && !bonusDate) {
      setError('Please select your next bonus date or choose to skip bonuses');
      return;
    }

    try {
      setCurrentStep('analyzing');
      setIsAnalyzing(true);

      // Save bonus date (or skip if no bonus) and trigger analysis
      const response = await fetch('/api/setup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bonusDate: hasBonus ? bonusDate : null,
          hasBonus
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAutomatedPayments(data.automatedPayments || []);
        setCurrentStep('review-payments');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to analyze transactions');
      }
    } catch (error) {
      setError('Failed to analyze transactions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePaymentsConfirm = async () => {
    try {
      // Save automated payments and complete setup
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automatedPayments }),
      });

      if (response.ok) {
        setCurrentStep('complete');
        onComplete();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to complete setup');
      }
    } catch (error) {
      setError('Failed to complete setup');
    }
  };

  const updatePayment = (index: number, field: string, value: any) => {
    const updated = [...automatedPayments];
    updated[index] = { ...updated[index], [field]: value };
    setAutomatedPayments(updated);
  };

  const removePayment = (index: number) => {
    setAutomatedPayments(automatedPayments.filter((_, i) => i !== index));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Let's Get Started
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We'll help you set up your financial dashboard by connecting your bank account
              and analyzing your spending patterns.
            </p>
            <button
              onClick={handleBankConnect}
              disabled={plaidLoading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {plaidLoading ? 'Loading...' : 'Connect Bank Account'}
            </button>
          </div>
        );

      case 'connect-bank':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Bank Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Securely connect your bank account using Plaid to import your transaction data.
            </p>
            {linkToken && (
              <PlaidLink
                linkToken={linkToken}
                onSuccess={handlePlaidSuccess}
                onExit={() => setError('Bank connection cancelled')}
              />
            )}
          </div>
        );

      case 'bonus-date':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Financial Structure
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              How does your income work? This helps us calculate your financial outlook.
            </p>

            <div className="max-w-md mx-auto space-y-6">
              {/* Bonus toggle */}
              <div className="text-left">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hasBonus}
                    onChange={(e) => setHasBonus(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    I receive quarterly bonuses
                  </span>
                </label>
              </div>

              {hasBonus ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Next Bonus Date
                  </label>
                  <input
                    type="date"
                    value={bonusDate}
                    onChange={(e) => setBonusDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When do you expect your next quarterly bonus?
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    We'll project your finances based on regular paycheck deposits over the next 90 days.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleBonusDateSubmit}
              disabled={hasBonus && !bonusDate}
              className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        );

      case 'analyzing':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Analyzing Your Transactions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We're using AI to analyze your transaction history and identify recurring payments...
            </p>
          </div>
        );

      case 'review-payments':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Review Automated Payments
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've identified these recurring payments from your transaction history.
              Please review and confirm they're correct.
            </p>

            <div className="space-y-4 mb-6">
              {automatedPayments.map((payment, index) => (
                <div key={payment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vendor
                      </label>
                      <input
                        type="text"
                        value={payment.vendor}
                        onChange={(e) => updatePayment(index, 'vendor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frequency
                      </label>
                      <select
                        value={payment.frequency}
                        onChange={(e) => updatePayment(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="weekly">Weekly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removePayment(index)}
                        className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 dark:bg-red-900 dark:border-red-700 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('bonus-date')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handlePaymentsConfirm}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Complete Setup
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {renderStep()}

      {/* Progress indicator */}
      <div className="mt-8">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className={currentStep === 'welcome' ? 'font-medium text-indigo-600' : ''}>Welcome</span>
          <span className={currentStep === 'connect-bank' ? 'font-medium text-indigo-600' : ''}>Connect Bank</span>
          <span className={currentStep === 'bonus-date' ? 'font-medium text-indigo-600' : ''}>Bonus Date</span>
          <span className={currentStep === 'analyzing' ? 'font-medium text-indigo-600' : ''}>Analysis</span>
          <span className={currentStep === 'review-payments' ? 'font-medium text-indigo-600' : ''}>Review</span>
          <span className={currentStep === 'complete' ? 'font-medium text-indigo-600' : ''}>Complete</span>
        </div>
        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((['welcome', 'connect-bank', 'bonus-date', 'analyzing', 'review-payments', 'complete'].indexOf(currentStep) + 1) / 6) * 100}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
