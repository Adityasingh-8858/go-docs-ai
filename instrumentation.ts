// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/using-instrumentation/
import * as Sentry from "@sentry/nextjs";

export function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
