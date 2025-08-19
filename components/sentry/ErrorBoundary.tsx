'use client';

import * as Sentry from '@sentry/nextjs';
import React from 'react';

interface FallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  fallback?: (props: FallbackProps) => React.ReactNode;
  children: React.ReactNode;
  componentName?: string;
}

const DefaultFallbackComponent: React.FC<FallbackProps> = ({ error, resetError }) => (
  <div
    role="alert"
    className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-center"
  >
    <p className="font-semibold">Something went wrong</p>
    <p className="text-sm mt-1">
      We've been notified of the issue. Please try again.
    </p>
    {/* You can add more details from the error object if needed, but be careful not to expose sensitive info */}
    {/* <pre className="mt-2 text-xs text-left">{error.message}</pre> */}
    <button
      onClick={resetError}
      className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
    >
      Try Again
    </button>
  </div>
);

// This is a class component wrapper because React's Error Boundaries are only available in class components.
// Sentry's `withErrorBoundary` HOC handles this for us.
const ErrorBoundaryComponent: React.FC<ErrorBoundaryProps> = ({
  fallback,
  children,
  componentName = 'Unnamed Component',
}) => {
  const Fallback = fallback || DefaultFallbackComponent;

  const sentryErrorBoundaryOptions = {
    fallback: ({ error, resetError }: FallbackProps) => <Fallback error={error} resetError={resetError} />,
    beforeCapture: (scope: Sentry.Scope) => {
      scope.setTag("component-boundary", componentName);
    },
  };

  return Sentry.withErrorBoundary(children as React.ReactElement, sentryErrorBoundaryOptions);
};

export default ErrorBoundaryComponent;
