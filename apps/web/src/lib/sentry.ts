/**
 * @fileoverview Sentry initialization for React frontend
 *
 * Provides centralized error tracking and performance monitoring:
 * - Error capturing with React Error Boundaries
 * - Performance monitoring with Web Vitals
 * - User session tracking
 * - Breadcrumbs for debugging
 * - Integration with React Router for navigation tracking
 *
 * Environment Variables:
 * - VITE_SENTRY_DSN: Sentry project DSN (required for error tracking)
 * - VITE_SENTRY_ENVIRONMENT: Environment name (development/staging/production)
 * - VITE_SENTRY_TRACES_SAMPLE_RATE: Performance sampling rate (0.0 to 1.0)
 * - VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE: Session replay sampling for normal sessions
 * - VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: Session replay sampling for error sessions
 */

import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking and performance monitoring
 *
 * IMPORTANT: Must be called BEFORE React renders (in main.tsx)
 *
 * Features:
 * - Automatic error capturing with source maps
 * - Performance monitoring with Web Vitals (LCP, FID, CLS)
 * - Session replay for debugging (configurable sampling)
 * - React component profiling
 * - Breadcrumbs for user actions
 * - Integration with React Router for navigation tracking
 *
 * @returns {boolean} True if Sentry was initialized, false if DSN not configured
 *
 * @example
 * // In main.tsx (before ReactDOM.render)
 * import { initializeSentry } from './lib/sentry';
 * initializeSentry();
 */
export function initializeSentry(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.VITE_ENV || 'development';
  const tracesSampleRate = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '1.0');
  const replaysSessionSampleRate = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1');
  const replaysOnErrorSampleRate = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0');

  // Skip initialization if DSN not configured (development without Sentry)
  if (!dsn) {
    console.warn('[Sentry] DSN not configured. Error tracking is disabled.');
    return false;
  }

  Sentry.init({
    dsn,
    environment,

    // Release tracking - automatically tagged with version
    // Useful for tracking which version introduced bugs
    release: `inventaire-si-web@${import.meta.env.VITE_APP_VERSION || 'unknown'}`,

    // Performance Monitoring
    integrations: [
      // Browser tracing - tracks page loads and navigation
      Sentry.browserTracingIntegration(),

      // React profiling - tracks component render performance
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),

      // Session replay - records user sessions for debugging
      // Only records a sample of sessions (configurable by environment)
      Sentry.replayIntegration({
        maskAllText: true, // Mask all text for privacy
        blockAllMedia: true, // Don't record media for privacy
      }),

      // Breadcrumbs integration - tracks user interactions
      Sentry.breadcrumbsIntegration({
        console: true, // Track console.log/error/warn
        dom: true, // Track DOM events (clicks, inputs)
        fetch: true, // Track fetch requests
        history: true, // Track navigation
        xhr: true, // Track XHR requests
      }),
    ],

    // Performance monitoring sample rate (0.0 to 1.0)
    // 1.0 = 100% of transactions tracked
    // Reduce in production to control quota usage
    tracesSampleRate,

    // Session replay sample rates
    // replaysSessionSampleRate: Sample rate for normal sessions (no errors)
    // replaysOnErrorSampleRate: Sample rate for sessions with errors
    // Production recommendation: 0.1 for sessions, 1.0 for errors
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,

    // Filter sensitive data before sending to Sentry
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-xsrf-token'];
      }

      // Filter out local storage data (may contain tokens)
      if (event.contexts?.local_storage) {
        delete event.contexts.local_storage;
      }

      return event;
    },

    // Ignore specific errors (noise reduction)
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Network errors (user connectivity issues, not app bugs)
      'NetworkError',
      'Network request failed',
      'Failed to fetch',

      // React dev warnings (not production issues)
      'Warning: ReactDOM.render',

      // Ad blockers
      'adsbygoogle',
      'googletagmanager',
    ],

    // Sampling - don't send all breadcrumbs (reduce noise)
    beforeBreadcrumb(breadcrumb) {
      // Ignore navigation breadcrumbs for static assets
      if (breadcrumb.category === 'navigation' && breadcrumb.data?.to?.includes('/assets/')) {
        return null;
      }

      // Ignore console breadcrumbs from React DevTools
      if (breadcrumb.category === 'console' && breadcrumb.message?.includes('Download the React DevTools')) {
        return null;
      }

      return breadcrumb;
    },

    // Track user context (helpful for debugging)
    // Will be automatically set by authentication system
    // Call Sentry.setUser({ id, email, username }) after login
    // Call Sentry.setUser(null) after logout

    // Enable debug mode in development
    debug: environment === 'development',
  });

  console.log(`[Sentry] Initialized successfully (${environment})`);
  return true;
}

/**
 * Manually capture an exception
 *
 * Use this to explicitly send errors to Sentry that are caught
 * and handled but still worth tracking.
 *
 * @param {Error} error - Error object to capture
 * @param {object} context - Additional context (user, tags, extra data)
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error, {
 *     tags: { operation: 'data-import' },
 *     extra: { userId: user.id }
 *   });
 *   showUserError('Operation failed');
 * }
 */
export function captureException(error: Error, context?: Sentry.CaptureContext): void {
  Sentry.captureException(error, context);
}

/**
 * Manually capture a message (non-error event)
 *
 * Use this to track important events or warnings that aren't errors.
 *
 * @param {string} message - Message to capture
 * @param {Sentry.SeverityLevel} level - Severity level (info, warning, error)
 *
 * @example
 * captureMessage('User completed onboarding', 'info');
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 *
 * Call this after successful login to associate errors with users.
 * Call with null after logout to clear user context.
 *
 * @param {object|null} user - User data or null to clear
 *
 * @example
 * // After login
 * setUserContext({ id: user.id, email: user.email, username: user.username });
 *
 * // After logout
 * setUserContext(null);
 */
export function setUserContext(user: { id: string; email?: string; username?: string } | null): void {
  Sentry.setUser(user);
}

/**
 * Add a breadcrumb (manual tracking)
 *
 * Use this to add custom breadcrumbs for debugging.
 * Breadcrumbs are shown in error reports to understand user flow.
 *
 * @param {object} breadcrumb - Breadcrumb data
 *
 * @example
 * addBreadcrumb({
 *   category: 'auth',
 *   message: 'User attempted login',
 *   level: 'info'
 * });
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

// Re-export commonly used Sentry components and functions
export { Sentry };
export const ErrorBoundary = Sentry.ErrorBoundary;
export const withProfiler = Sentry.withProfiler;
