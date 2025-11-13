import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { privacyBeforeSend, privacyBeforeBreadcrumb } from './sentry-privacy';

/**
 * Check if Sentry should be initialized
 * Only in production builds, not in development or preview
 */
function shouldInitialize(): boolean {
  const appEnv = process.env.APP_ENV;
  const isDev = __DEV__;

  // Only initialize in production
  if (appEnv !== 'production' || isDev) {
    console.log('[Sentry] Skipping initialization (not production)');
    return false;
  }

  // Verify DSN is available
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured, skipping initialization');
    return false;
  }

  return true;
}

/**
 * Initialize Sentry with platform-specific configuration
 */
export function initializeSentry(): void {
  if (!shouldInitialize()) {
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      environment: 'production',

      // Release tracking
      release: Constants.expoConfig?.version || '1.0.0',
      dist: Constants.expoConfig?.extra?.eas?.buildNumber,

      // Session tracking
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,

      // Performance Monitoring - 100% sampling
      tracesSampleRate: 1.0,
      enableTracing: true,

      // Integrations
      // Note: Web doesn't support ReactNativeTracing as it's designed for native performance monitoring
      integrations:
        Platform.OS === 'web'
          ? [] // Web doesn't support ReactNativeTracing
          : [
              new Sentry.ReactNativeTracing({
                tracingOrigins: ['localhost', /^\//],
                enableUserInteractionTracing: true,
                enableNativeFramesTracking: true,
              }),
            ],

      // Privacy hooks
      beforeSend: privacyBeforeSend,
      beforeBreadcrumb: privacyBeforeBreadcrumb,

      // Error sampling (100% of errors)
      sampleRate: 1.0,
    });

    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Set user context for Sentry events
 */
export function setSentryUser(userId: string, role?: string): void {
  if (!shouldInitialize()) return;

  Sentry.setUser({
    id: userId,
  });

  if (role) {
    Sentry.setTag('user.role', role);
  }
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser(): void {
  if (!shouldInitialize()) return;
  Sentry.setUser(null);
}

/**
 * Add custom context to Sentry events
 */
export function setSentryContext(name: string, context: Record<string, any>): void {
  if (!shouldInitialize()) return;
  Sentry.setContext(name, context);
}

/**
 * Manually capture an exception
 */
export function captureSentryException(error: Error, context?: Record<string, any>): void {
  if (!shouldInitialize()) return;

  Sentry.captureException(error, {
    contexts: context,
  });
}
