'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2>Something went wrong!</h2>
            <p>An unexpected error occurred. We have been notified and are looking into it.</p>
            <button
                onClick={() => reset()}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    borderRadius: '0.25rem',
                    border: '1px solid #ccc',
                }}
            >
                Try again
            </button>
        </div>
      </body>
    </html>
  );
}
