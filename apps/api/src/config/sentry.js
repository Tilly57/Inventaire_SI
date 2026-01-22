/**
 * @fileoverview Sentry Configuration for Error Tracking and Performance Monitoring
 *
 * Initializes Sentry for:
 * - Error tracking (exceptions, rejections)
 * - Performance monitoring (transactions, spans)
 * - Request context (user, request details)
 * - Breadcrumbs (action history)
 *
 * Documentation: https://docs.sentry.io/platforms/node/
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry with configuration from environment variables
 *
 * Required Environment Variables:
 * - SENTRY_DSN: Data Source Name from Sentry project
 * - SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 * - SENTRY_TRACES_SAMPLE_RATE: Sample rate for performance monitoring (0.0 to 1.0)
 *
 * @returns {boolean} True if Sentry is initialized, false if DSN is missing
 */
export function initializeSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
  const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0');

  // Skip initialization if DSN is not configured
  if (!dsn) {
    console.warn('[Sentry] DSN not configured. Error tracking is disabled.');
    console.warn('[Sentry] Set SENTRY_DSN environment variable to enable Sentry.');
    return false;
  }

  // Initialize Sentry
  Sentry.init({
    dsn,
    environment,

    // Performance Monitoring
    tracesSampleRate, // 1.0 = 100% of transactions (reduce in production)

    // Profiling (optional - requires additional quota)
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    integrations: [
      // Enable profiling
      new ProfilingIntegration(),
    ],

    // Release tracking (automatically detected from package.json version)
    release: `inventaire-si-api@${process.env.npm_package_version || 'unknown'}`,

    // Configure what data to send
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }

        // Remove sensitive query params
        if (event.request.query_string) {
          event.request.query_string = event.request.query_string
            .replace(/password=[^&]*/gi, 'password=[FILTERED]')
            .replace(/token=[^&]*/gi, 'token=[FILTERED]');
        }
      }

      // Filter out sensitive data from extra context
      if (event.extra) {
        if (event.extra.password) delete event.extra.password;
        if (event.extra.token) delete event.extra.token;
        if (event.extra.accessToken) delete event.extra.accessToken;
        if (event.extra.refreshToken) delete event.extra.refreshToken;
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser/Network errors (not server-side)
      'NetworkError',
      'Network request failed',

      // Development errors
      'ResizeObserver loop',

      // Known non-critical errors
      'Non-Error promise rejection'
    ],
  });

  console.log(`[Sentry] Initialized successfully`);
  console.log(`[Sentry] Environment: ${environment}`);
  console.log(`[Sentry] Traces Sample Rate: ${tracesSampleRate * 100}%`);

  return true;
}

/**
 * Export Sentry instance for manual error capturing
 *
 * Usage:
 * ```javascript
 * import { Sentry } from './config/sentry.js';
 *
 * // Capture exception
 * Sentry.captureException(error);
 *
 * // Capture message
 * Sentry.captureMessage('Something went wrong', 'warning');
 *
 * // Add user context
 * Sentry.setUser({ id: user.id, email: user.email });
 *
 * // Add breadcrumb
 * Sentry.addBreadcrumb({
 *   message: 'User action',
 *   level: 'info',
 *   data: { action: 'create_loan' }
 * });
 * ```
 */
export { Sentry };

export default Sentry;
