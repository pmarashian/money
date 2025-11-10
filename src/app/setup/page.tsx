'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SetupWizard from '@/components/SetupWizard';

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Check if user has completed setup
      const response = await fetch('/api/setup/status');
      const data = await response.json();

      if (data.isSetupComplete) {
        setIsSetupComplete(true);
        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading setup...</p>
        </div>
      </div>
    );
  }

  if (isSetupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Setup Complete!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your financial dashboard is ready to use.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Financial Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Let's set up your account to start tracking your finances.
            </p>
          </div>

          <SetupWizard onComplete={handleSetupComplete} />
        </div>
      </div>
    </div>
  );
}
