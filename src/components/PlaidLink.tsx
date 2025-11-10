'use client';

import { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidLinkProps {
  linkToken: string;
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit?: (error: any) => void;
  onEvent?: (eventName: string, metadata: any) => void;
}

export default function PlaidLink({
  linkToken,
  onSuccess,
  onExit,
  onEvent
}: PlaidLinkProps) {
  const [isReady, setIsReady] = useState(false);

  const { open, ready, error } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      onSuccess(publicToken, metadata);
    },
    onExit: (err, metadata) => {
      if (onExit) {
        onExit(err);
      }
    },
    onEvent: (eventName, metadata) => {
      if (onEvent) {
        onEvent(eventName, metadata);
      }
    },
  });

  useEffect(() => {
    if (ready) {
      setIsReady(true);
    }
  }, [ready]);

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 text-sm">
        Error loading Plaid Link: {error.message}
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!isReady}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {!isReady ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Connect Bank Account
        </>
      )}
    </button>
  );
}

// Hook for managing Plaid Link state
export function usePlaidLinkState() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLinkToken = async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plaid/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setLinkToken(data.linkToken);
      } else {
        setError(data.error || 'Failed to create link token');
      }
    } catch (err) {
      setError('Failed to create link token');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setLinkToken(null);
    setError(null);
  };

  return {
    linkToken,
    isLoading,
    error,
    createLinkToken,
    reset,
  };
}
