import * as Sentry from '@sentry/nextjs';

/**
 * Wraps a function in a Sentry span, which is used for performance tracing.
 *
 * @param op - A short, human-readable name for the operation (e.g., 'db.query', 'pdf.process').
 * @param fn - The asynchronous function to be executed and traced. It can receive the span object as an argument.
 * @returns The result of the wrapped function.
 */
export async function trace<T>(
  op: string,
  fn: (span?: Sentry.Span) => Promise<T>
): Promise<T> {
  // `startSpan` is a convenience wrapper around `startActiveSpan` and `startInactiveSpan`.
  // It will automatically pick the right one based on the context.
  return Sentry.startSpan({ name: op, op: op }, async (span) => {
    try {
      // The wrapped function's execution is now part of the created span.
      return await fn(span);
    } catch (error) {
      // If an error occurs, we mark the span as failed and re-throw the error.
      if (error instanceof Error) {
        span.setStatus({ code: Sentry.SpanStatusCode.Error, message: error.message });
      } else {
        span.setStatus({ code: Sentry.SpanStatusCode.Error, message: 'An unknown error occurred.' });
      }
      // Re-throwing the error is important so that it can be handled by higher-level error handlers.
      throw error;
    }
  });
}
