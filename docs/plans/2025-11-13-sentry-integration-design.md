# Sentry Integration Design

**Date**: 2025-11-13
**Status**: Approved
**Author**: Bill Chirico

## Overview

This document outlines the comprehensive Sentry integration for the 12-Step Tracker application. The integration provides full observability with error tracking, performance monitoring, session replay, and user feedback across iOS, Android, and Web platforms.

## Design Decisions

### Key Requirements

- **Full Observability**: Error tracking + performance monitoring + session replay + user feedback
- **Privacy-First**: Balanced approach - track user IDs and basic context, scrub all sensitive recovery data
- **Production-Only**: Monitoring enabled only in production builds to conserve quota
- **Mobile-First**: Deep native integration for iOS/Android, basic monitoring for web
- **EAS Integration**: Automatic source map uploads and release creation via EAS builds
- **100% Sampling**: Full performance monitoring (all transactions) and error-focused session replay

### Privacy Stance

Given the sensitive nature of recovery data, we prioritize user privacy:

- Strip all PII (personal identifiable information)
- Scrub recovery-related data (sobriety dates, relapses, step progress)
- Redact message content and task descriptions
- Mask sensitive UI elements in session replay
- Keep only technical debugging context (user ID, role, platform)

## Architecture

### Integration Points

Sentry initializes at the root of the application in `app/_layout.tsx`, before AuthProvider and ThemeContext. This ensures all errors—including those in context providers—are captured.

**Initialization Flow**:

```
App Launch
  → Platform Detection (iOS/Android/Web)
  → Environment Check (production only)
  → Sentry.init()
    → Load configuration from environment
    → Set up integrations (navigation, network, performance)
    → Register beforeSend/beforeBreadcrumb hooks
    → Initialize native SDKs (iOS/Android)
  → Wrap app in ErrorBoundary
  → Render application
```

### Data Flow

1. **Error Capture**: React Native error handlers → Sentry SDK → beforeSend hook (privacy scrubbing) → Sentry cloud
2. **Performance**: Auto-instrumented transactions (navigation, API calls) → 100% sampling → Sentry performance monitoring
3. **Breadcrumbs**: Navigation events, Supabase queries, user interactions → automatic capture with sensitive data filtered
4. **Session Replay**: User interactions → privacy masking → Sentry replay storage (web only, errors only)
5. **User Feedback**: In-app widget → screenshot + context → attached to Sentry events

### File Structure

New files to create:

- `lib/sentry.ts` - Core Sentry configuration and initialization
- `lib/sentry-privacy.ts` - Data scrubbing and privacy rules
- `lib/sentry-performance.ts` - Custom performance instrumentation
- `components/ErrorBoundary.tsx` - React error boundary with Sentry integration
- `components/SentryFeedback.tsx` - User feedback widget component
- `__mocks__/@sentry/react-native.ts` - Jest mock for testing

Files to modify:

- `app/_layout.tsx` - Add Sentry initialization
- `eas.json` - Add Sentry plugin configuration
- `app.config.ts` - Add Sentry configuration
- `package.json` - Add Sentry dependencies

## SDK Installation and Configuration

### Dependencies

```json
{
  "dependencies": {
    "@sentry/react-native": "^5.36.0",
    "@sentry/react": "^8.40.0"
  },
  "devDependencies": {
    "@sentry/wizard": "^3.28.0",
    "@sentry/cli": "^2.39.0"
  }
}
```

### Platform-Aware Configuration

Use `@sentry/react-native` for iOS/Android with full native crash reporting. Fall back to `@sentry/react` for web with browser-only features.

```typescript
// lib/sentry.ts
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
// import * as SentryWeb from '@sentry/react'; // For web platform

const isProduction = process.env.APP_ENV === 'production' && !__DEV__;

if (isProduction) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: 'production',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Performance Monitoring
    tracesSampleRate: 1.0, // 100% of transactions
    enableTracing: true,

    // Session Replay (web only, errors only)
    replaysSessionSampleRate: 0.0, // Don't record normal sessions
    replaysOnErrorSampleRate: 1.0, // Record all error sessions

    // Integrations
    integrations: [
      // Navigation tracking
      new Sentry.ReactNavigationInstrumentation(),
      // Performance monitoring
      new Sentry.ReactNativeTracing({
        tracingOrigins: ['localhost', /^\//],
        routingInstrumentation: navigationInstrumentation,
      }),
    ],

    // Privacy hooks
    beforeSend: privacyBeforeSend,
    beforeBreadcrumb: privacyBeforeBreadcrumb,
  });
}
```

### Environment Variables

Required environment variables:

- `EXPO_PUBLIC_SENTRY_DSN` - Your Sentry project DSN (public, safe to expose)
- `SENTRY_AUTH_TOKEN` - Authentication token for uploading source maps (private)
- `SENTRY_ORG` - Your Sentry organization slug
- `SENTRY_PROJECT` - Project slug ("12-step-tracker")
- `APP_ENV` - Environment name ("production")

## Privacy and Data Scrubbing

### Sensitive Data Categories

Data to protect:

- **Personal Recovery Data**: Sobriety dates, relapse information, step progress
- **Relationship Data**: Sponsor-sponsee connections, relationship status
- **Communication**: Message content, task descriptions, notifications
- **User Identity**: Full names, email addresses, phone numbers
- **Authentication**: Tokens, session data, OAuth credentials

Keep for debugging:

- User ID (UUID)
- User role (sponsor/sponsee/both)
- Platform and device type
- Route names and navigation flow

### BeforeSend Hook

```typescript
// lib/sentry-privacy.ts
export function privacyBeforeSend(event: Sentry.Event): Sentry.Event | null {
  // Strip sensitive request data
  if (event.request?.data) {
    event.request.data = sanitizeRequestData(event.request.data);
  }

  // Redact email addresses from error messages
  if (event.message) {
    event.message = event.message.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[email]'
    );
  }

  // Sanitize exception values
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map(exception => ({
      ...exception,
      value: sanitizeErrorMessage(exception.value),
    }));
  }

  // Remove sensitive user data
  if (event.user) {
    event.user = {
      id: event.user.id, // Keep ID for debugging
      // Remove email, username, ip_address
    };
  }

  return event;
}

function sanitizeRequestData(data: any): any {
  const sensitiveFields = [
    'message',
    'content',
    'description',
    'reflection',
    'sobriety_date',
    'relapse_date',
    'notes',
    'email',
    'phone',
    'name',
    'password',
    'token',
  ];

  // Recursively scrub sensitive fields
  // Replace values with '[Filtered]'
  // ...implementation
}
```

### Breadcrumb Filtering

```typescript
export function privacyBeforeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  // Filter Supabase query breadcrumbs
  if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('supabase')) {
    return {
      ...breadcrumb,
      data: {
        method: breadcrumb.data.method,
        table: extractTableName(breadcrumb.data.url),
        status_code: breadcrumb.data.status_code,
        // Remove actual query data
      },
    };
  }

  // Filter navigation breadcrumbs with sensitive params
  if (breadcrumb.category === 'navigation') {
    return {
      ...breadcrumb,
      data: {
        from: breadcrumb.data?.from,
        to: breadcrumb.data?.to,
        // Remove route params
      },
    };
  }

  return breadcrumb;
}
```

### Session Replay Privacy Masking

For web session replay, configure privacy masking:

```typescript
// Mask all text inputs by default
mask: ['input', 'textarea', 'select'],

// Block sensitive screens entirely
block: [
  '.message-thread',
  '.relapse-form',
  '[data-sentry-block]',
],

// Mask specific elements
maskTextSelector: [
  '.sensitive-data',
  '[data-sentry-mask]',
  '.user-content',
],
```

## EAS Build Integration

### EAS.json Configuration

Update `eas.json` to add Sentry plugin to production profile:

```json
{
  "build": {
    "production": {
      "env": {
        "APP_ENV": "production"
      },
      "distribution": "store",
      "autoIncrement": true,
      "plugins": [
        [
          "sentry-expo",
          {
            "organization": "your-sentry-org",
            "project": "12-step-tracker"
          }
        ]
      ]
    }
  }
}
```

### App.config.ts Updates

```typescript
export default {
  // ... existing config
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        },
      },
    ],
  },
  plugins: [
    // ... existing plugins
    [
      'sentry-expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ],
  ],
};
```

### Build Process Flow

1. EAS build starts for production profile
2. Sentry plugin detects build configuration
3. **Build phase**: Native code compiles, JavaScript bundles created
4. **Post-build phase**:
   - Sentry CLI uploads source maps
   - Debug symbols uploaded (iOS dSYMs, Android Proguard mappings)
   - Release created with version from `app.json`
   - Distribution tagged with EAS build ID
   - Git commit SHA associated with release
5. Build artifacts generated and distributed

### Secrets Management

Add to EAS secrets via `eas secret:create`:

```bash
eas secret:create --name SENTRY_DSN --value "https://..."
eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_..."
eas secret:create --name SENTRY_ORG --value "your-org-slug"
eas secret:create --name SENTRY_PROJECT --value "12-step-tracker"
```

Also add to GitHub Actions secrets for CI/CD builds.

## Platform-Specific Configuration

### iOS Deep Integration

**Native Crash Reporting**:

- Automatic Objective-C/Swift crash capture
- dSYM upload via EAS for symbolicated stack traces
- App hangs detection (main thread blocked >2 seconds)

**Performance Monitoring**:

- Native screen load tracking via `UIViewController` lifecycle
- Automatic view hierarchy breadcrumbs
- NSURLSession request tracking for Supabase calls

**Initialization**:
Sentry initializes before `RCTRootView` creation in native AppDelegate.

### Android Deep Integration

**Native Crash Reporting**:

- NDK crash capture for native modules
- Java exception tracking
- ANR (Application Not Responding) detection (>5 seconds)

**Performance Monitoring**:

- Activity lifecycle tracking
- Fragment transaction monitoring
- OkHttp interceptor for network requests

**ProGuard/R8 Mapping**:
Automatically uploaded via EAS for deobfuscated stack traces.

### Web Basic Monitoring

**Error Tracking**:

- JavaScript errors
- Unhandled promise rejections
- Browser-specific exceptions

**Performance**:

- Navigation timing API
- Expo Router navigation tracking
- Basic fetch/XHR monitoring

**Bundle Optimization**:
Use lightweight `@sentry/react` (not `@sentry/react-native`) to minimize web bundle size.

### Platform Detection

```typescript
import { Platform } from 'react-native';

export function initializeSentry() {
  if (Platform.OS === 'web') {
    // Use @sentry/react for web
    initSentryWeb();
  } else {
    // Use @sentry/react-native for iOS/Android
    initSentryNative();
  }
}
```

### Tagging Strategy

Every event tagged with:

- `platform`: iOS, Android, or web
- `platform.version`: OS version (iOS 17.5, Android 14, etc.)
- `expo.version`: Expo SDK version (54)
- `app.version`: From package.json
- `device.model`: Device identifier (mobile only)
- `user.role`: sponsor, sponsee, or both

## Performance Monitoring

### Automatic Instrumentation

Captured automatically at 100% sampling:

- **Screen Navigation**: Every Expo Router route change (e.g., "/(tabs)/index", "/login")
- **Initial App Load**: Time from app launch to first interactive screen
- **API Calls**: All Supabase queries with duration and status
- **User Interactions**: Button taps, form submissions (tap to completion timing)
- **Network Requests**: HTTP request duration, size, status codes

### Custom Instrumentation

Create manual spans for critical operations:

```typescript
// Authentication flow
const transaction = Sentry.startTransaction({
  name: 'user-login',
  op: 'auth.login',
});

const authSpan = transaction.startChild({
  op: 'supabase.auth',
  description: 'Supabase authentication',
});
// ... auth logic
authSpan.finish();

const profileSpan = transaction.startChild({
  op: 'supabase.query',
  description: 'Load user profile',
});
// ... profile load
profileSpan.finish();

transaction.finish();
```

**Critical Operations to Instrument**:

- Authentication flow (login → profile load → redirect)
- Task loading (sponsor viewing sponsees' tasks)
- Message thread loading with pagination
- Step content rendering with reflections
- Relapse recovery flow

### Performance Budgets

Set alerts for:

- Screen load > 2 seconds (p95)
- Supabase query > 500ms (p95)
- App startup > 3 seconds (p95)
- User interaction response > 100ms (p75)

### Database Query Tracking

Wrap Supabase client to add performance spans:

```typescript
// lib/supabase-instrumented.ts
import * as Sentry from '@sentry/react-native';
import { supabase } from './supabase';

export function instrumentedQuery(table: string, operation: string) {
  const span = Sentry.getCurrentHub()
    .getScope()
    ?.getTransaction()
    ?.startChild({
      op: 'db.query',
      description: `${operation} ${table}`,
      data: { table, operation },
    });

  // Return wrapped Supabase query builder
  // that finishes span on completion
}
```

### Metrics to Monitor

**Key Performance Indicators**:

- **Time to Interactive (TTI)**: App launch to usable state
- **Navigation Speed**: Tab switches and screen transitions
- **Data Fetching**: Supabase query performance by table
- **Form Responsiveness**: Task creation, message sending
- **Cache Hit Rate**: AsyncStorage/SecureStore access patterns

## Session Replay and User Feedback

### Session Replay Configuration

**Web Only** (mobile not yet supported by Sentry):

- **Sampling**: 100% of error sessions, 0% of normal sessions
- **Canvas/WebGL**: Disabled for performance
- **Network Requests**: Captured
- **Console Logs**: Included

**Privacy Masking**:

```typescript
replaysSessionSampleRate: 0.0,
replaysOnErrorSampleRate: 1.0,
integrations: [
  new Sentry.Replay({
    maskAllText: false, // We'll use selective masking
    blockAllMedia: true, // Block images/videos
    maskAllInputs: true, // Mask all form inputs
    block: ['.message-thread', '.relapse-form'],
    mask: ['.sensitive-data', '[data-sentry-mask]'],
  }),
],
```

**Screens to Block/Mask**:

- Message threads (entire component blocked)
- Task descriptions (content masked)
- Onboarding free-text input (masked)
- Profile screen (sobriety dates, personal info masked)
- Step reflections (user-written content masked)

### Mobile Alternative - Enhanced Breadcrumbs

Since session replay isn't available on mobile:

**Screen Screenshots**:
Attach screenshot to error events with privacy mask overlay:

```typescript
Sentry.captureException(error, {
  attachments: [
    {
      filename: 'screenshot.png',
      data: await captureScreenWithMask(),
      contentType: 'image/png',
    },
  ],
});
```

**UI State Snapshot**:
Capture view hierarchy without sensitive text:

- Component tree structure
- Visible screen elements
- Layout positions
- Navigation state

**Touch Heatmap**:
Record tap locations for last 30 seconds before error.

**Navigation Path**:
Full screen navigation history (route names only, no params).

### User Feedback Widget

**Trigger Methods**:

- Shake gesture on mobile
- Keyboard shortcut (Cmd+K) on web
- "Report Bug" button in profile screen

**Implementation** (`components/SentryFeedback.tsx`):

```typescript
import * as Sentry from '@sentry/react-native';

export function SentryFeedback() {
  const handleSubmit = async (feedback: {
    message: string;
    email?: string;
    screenshot?: string;
  }) => {
    const eventId = Sentry.captureMessage(feedback.message);

    Sentry.captureUserFeedback({
      event_id: eventId,
      name: 'User',
      email: feedback.email,
      comments: feedback.message,
    });

    // Attach screenshot if provided
    if (feedback.screenshot) {
      Sentry.addAttachment({
        filename: 'user-screenshot.png',
        data: feedback.screenshot,
      });
    }
  };

  // ... UI implementation
}
```

**Pre-filled Context**:

- Device info (platform, OS version)
- App version
- Current route
- Last error ID (if within 5 minutes)

**Platform-Native UI**:

- iOS: Bottom sheet modal
- Android: Material dialog
- Web: Center modal overlay

## Error Boundaries and Context

### Root Error Boundary

```typescript
// components/ErrorBoundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react-native';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    return (
      <Sentry.ErrorBoundary
        fallback={({ error, resetError }) => (
          <ErrorFallback error={error} onReset={resetError} />
        )}
      >
        {this.props.children}
      </Sentry.ErrorBoundary>
    );
  }
}
```

**Fallback UI** (`components/ErrorFallback.tsx`):

- User-friendly error message
- "Restart App" button (calls `resetError`)
- "Report Issue" button (opens feedback widget)
- Themed (respects light/dark mode)
- Platform-specific styling

### Strategic Error Boundaries

Place boundaries at critical junctions:

1. **Auth Flow** (`app/_layout.tsx`):
   - Catches auth provider errors
   - Fallback to login screen

2. **Tab Navigation** (`app/(tabs)/_layout.tsx`):
   - Isolates tab errors
   - Prevents full app crash

3. **Screen-Level**:
   - Each major screen has own boundary
   - Graceful degradation to error state

4. **Component-Level**:
   - Expensive components (message threads, task lists)
   - Individual error recovery

### Context Enrichment

Automatically added to every event:

**User Context**:

```typescript
Sentry.setUser({
  id: user.id,
  role: profile.role,
  account_age_days: calculateAccountAge(user.created_at),
});
```

**App Context**:

```typescript
Sentry.setContext('app', {
  current_route: router.pathname,
  auth_state: session ? 'authenticated' : 'unauthenticated',
  onboarding_complete: !!profile?.role,
});
```

**Device Context** (automatic):

- Platform, OS version
- Device model, screen size
- Memory usage, battery level
- Network type (wifi/cellular)

**Custom Tags**:

```typescript
Sentry.setTag('oauth_provider', 'google'); // or 'facebook', 'email'
Sentry.setTag('user_role', profile.role);
Sentry.setTag('has_sponsees', sponseeCount > 0);
```

### Route Context Integration

Hook into Expo Router:

```typescript
// app/_layout.tsx
import { usePathname, useSegments } from 'expo-router';

useEffect(() => {
  const pathname = usePathname();

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${pathname}`,
    level: 'info',
    data: { pathname },
  });

  // Update context
  Sentry.setContext('navigation', {
    current_route: pathname,
    segments: useSegments(),
  });
}, [usePathname()]);
```

### Supabase Context

Track database interaction context:

```typescript
Sentry.setContext('supabase', {
  active_queries: queryCount,
  auth_state: session ? 'authenticated' : 'unauthenticated',
  connection_state: isOnline ? 'online' : 'offline',
  last_sync: lastSyncTimestamp,
});
```

## Testing Strategy

### Mocking Sentry in Tests

```typescript
// __mocks__/@sentry/react-native.ts
export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const addBreadcrumb = jest.fn();
export const setUser = jest.fn();
export const setContext = jest.fn();
export const setTag = jest.fn();

export const ErrorBoundary = ({ children }: any) => children;
```

### Privacy Scrubbing Tests

```typescript
// lib/__tests__/sentry-privacy.test.ts
describe('privacyBeforeSend', () => {
  it('should strip message content from error events', () => {
    const event = {
      request: {
        data: {
          message: 'Sensitive recovery message',
          user_id: '123',
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed.request.data.message).toBe('[Filtered]');
    expect(scrubbed.request.data.user_id).toBe('123');
  });

  it('should redact email addresses from error messages', () => {
    const event = {
      message: 'Error for user test@example.com',
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed.message).toBe('Error for user [email]');
  });
});
```

### Error Boundary Tests

```typescript
// components/__tests__/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react-native';
import * as Sentry from '@sentry/react-native';

const ThrowError = () => {
  throw new Error('Test error');
};

it('should capture errors and show fallback UI', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(Sentry.captureException).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Test error' })
  );

  expect(screen.getByText(/something went wrong/i)).toBeTruthy();
});
```

### Pre-Production Checklist

Before enabling in production:

- [ ] Test DSN works in preview build
- [ ] Privacy scrubbing verified with real data scenarios
- [ ] Error boundaries tested on all platforms
- [ ] Source maps upload successfully
- [ ] Performance overhead acceptable (<50ms startup)
- [ ] User feedback widget works on all platforms
- [ ] Session replay privacy masking validated on web
- [ ] Alert rules configured in Sentry dashboard
- [ ] Team has access to Sentry project
- [ ] Documentation updated with troubleshooting guide

## Monitoring and Alerting

### Critical Error Alerts

Configure in Sentry dashboard:

**Crash Rate Alert**:

- Condition: Crash rate >1% of sessions
- Window: 1 hour
- Action: Immediate Slack notification + email

**New Error Type**:

- Condition: First occurrence of new error fingerprint
- Window: Immediate
- Action: Slack notification to #app-errors

**Authentication Failures**:

- Condition: >10 auth errors in 5 minutes
- Window: 5 minutes
- Action: Page on-call engineer (if configured)

**Native Crashes**:

- Condition: Any iOS/Android native crash
- Window: Immediate
- Action: High-priority alert

### Performance Alerts

**Slow Startup**:

- Condition: App TTI >5 seconds (p90)
- Window: 1 hour
- Action: Email notification

**Database Timeouts**:

- Condition: Supabase query >2 seconds
- Window: 15 minutes
- Action: Slack notification

**Screen Load Degradation**:

- Condition: Screen load time 2x baseline
- Window: 1 hour
- Action: Warning alert

### Issue Management Workflow

**Auto-Assignment Rules**:

- Auth errors → Backend team
- UI crashes → Frontend team
- Performance issues → DevOps team
- Supabase errors → Backend team

**Priority Levels**:

- **P0**: Crashes, authentication failures
- **P1**: Data loss, critical feature broken
- **P2**: Performance degradation, minor bugs
- **P3**: Visual issues, low-impact bugs

**Resolution Workflow**:

1. Issue reported → Auto-assigned
2. Team investigates → Add comments
3. Fix deployed → Mark as resolved in release
4. Monitor for regression → Auto-reopen if recurs

### Dashboard Configuration

Create custom dashboards in Sentry:

**Health Dashboard**:

- Crash-free users percentage
- Error rate (errors per session)
- Performance scores (Apdex)
- Session count and duration

**Platform Comparison**:

- iOS vs Android vs Web error rates
- Platform-specific performance metrics
- Adoption rate by platform

**User Journey Funnel**:

- Signup → Onboarding → First task → First message
- Drop-off points with error correlation
- Conversion rates by platform

**Release Health**:

- Current release vs previous comparison
- Adoption rate
- Crash-free sessions
- New errors introduced

### Release Tracking

For each production release:

**Health Metrics**:

- Crash-free sessions: Target >99.5%
- Error count: Should decrease over time
- Performance regression: Compare to previous release
- Adoption rate: % of users on latest version

**Rollback Decision Criteria**:

- Crash rate >2% → Immediate rollback
- Critical auth error >5% of users → Rollback
- Performance degradation >50% → Investigate/rollback
- Data loss reported → Immediate rollback

### Integration Points

**GitHub Integration**:

- Link commits to releases
- Create GitHub issues from Sentry errors
- PR annotations with error tracking

**Slack Integration**:

- Real-time alerts to #app-errors channel
- Daily digest of new issues
- Release notifications

**Supabase Correlation**:

- Cross-reference Sentry errors with Supabase logs
- Match error timestamps to database queries
- Identify RLS policy failures

### Weekly Review Process

**Monday - Weekend Review**:

- Check for any critical errors over weekend
- Prioritize urgent fixes
- Update on-call rotation if needed

**Thursday - Performance Review**:

- Identify slow transactions from the week
- Review performance budget violations
- Plan optimization work

**Release Day - Release Monitoring**:

- Monitor new release for 48 hours
- Watch for error rate spikes
- Track adoption rate
- Review user feedback

**Monthly - Quota & Tuning**:

- Review Sentry usage vs quota
- Adjust sampling rates if needed
- Fine-tune alert thresholds
- Review and update ignore rules

### Quota Management

**Sentry Free Tier Limits**:

- 5,000 errors/month
- 10,000 transactions/month
- 50 replays/month

**Monitoring Strategy**:

- Set quota alerts at 80% usage
- Enable spike protection
- Client-side rate limiting if needed
- Plan upgrade path to Team plan (~$26/month)

**Optimization If Hitting Limits**:

- Reduce traces sample rate (from 100% to 20%)
- Add client-side error rate limiting
- Filter common errors (e.g., network timeouts)
- Adjust replay sampling (errors only)

## Implementation Phases

### Phase 1: Core Setup (Week 1)

- Install dependencies
- Configure Sentry initialization
- Set up privacy scrubbing
- Add root error boundary
- Test in development

### Phase 2: EAS Integration (Week 1)

- Update eas.json with Sentry plugin
- Configure app.config.ts
- Set up EAS secrets
- Test source map upload
- Verify release creation

### Phase 3: Platform Integration (Week 2)

- iOS native integration
- Android native integration
- Web monitoring setup
- Test on all platforms
- Verify crash reporting

### Phase 4: Performance & Features (Week 2)

- Custom performance instrumentation
- User feedback widget
- Session replay (web)
- Enhanced breadcrumbs
- Context enrichment

### Phase 5: Testing & Validation (Week 3)

- Write comprehensive tests
- Privacy scrubbing validation
- Performance impact testing
- E2E testing with test project
- Pre-production checklist

### Phase 6: Production Rollout (Week 3)

- Deploy to production
- Monitor for 48 hours
- Set up alerts and dashboards
- Train team on Sentry usage
- Document troubleshooting

## Success Metrics

**Technical Metrics**:

- Crash-free users >99%
- Error detection time <5 minutes
- Mean time to resolution <24 hours
- Performance overhead <50ms
- Source map upload success rate 100%

**Business Metrics**:

- User-reported bugs decrease by 30%
- Critical bug detection before user reports
- Faster release cycles with confidence
- Reduced support tickets from crashes

## Risks and Mitigations

**Risk: Privacy data leak**

- Mitigation: Comprehensive privacy scrubbing tests
- Mitigation: Manual validation with real data
- Mitigation: Regular audit of Sentry events

**Risk: Performance impact**

- Mitigation: Benchmark startup time before/after
- Mitigation: Monitor memory usage in production
- Mitigation: Adjust sampling if needed

**Risk: Quota overages**

- Mitigation: Production-only monitoring
- Mitigation: Quota alerts at 80%
- Mitigation: Client-side rate limiting

**Risk: False positive alerts**

- Mitigation: Start with conservative thresholds
- Mitigation: Tune based on baseline data
- Mitigation: Monthly alert review

## References

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)
- [EAS Build Configuration](https://docs.expo.dev/build/introduction/)
- [Sentry Privacy Guide](https://docs.sentry.io/platforms/react-native/data-management/)

## Appendix

### Environment Variable Summary

```bash
# Production (required)
EXPO_PUBLIC_SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"
SENTRY_AUTH_TOKEN="sntrys_[token]"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="12-step-tracker"
APP_ENV="production"

# Optional
SENTRY_ENVIRONMENT="production"
SENTRY_RELEASE="1.0.0"
```

### Key Files Summary

| File                                | Purpose                               |
| ----------------------------------- | ------------------------------------- |
| `lib/sentry.ts`                     | Main configuration and initialization |
| `lib/sentry-privacy.ts`             | Privacy scrubbing rules               |
| `lib/sentry-performance.ts`         | Custom performance instrumentation    |
| `components/ErrorBoundary.tsx`      | React error boundary                  |
| `components/SentryFeedback.tsx`     | User feedback widget                  |
| `__mocks__/@sentry/react-native.ts` | Jest mocks                            |

### Tag Strategy Reference

| Tag                | Values                  | Usage                 |
| ------------------ | ----------------------- | --------------------- |
| `platform`         | ios, android, web       | Filter by platform    |
| `platform.version` | 17.5, 14, etc.          | OS version filtering  |
| `user.role`        | sponsor, sponsee, both  | User type analysis    |
| `oauth_provider`   | google, facebook, email | Auth method tracking  |
| `app.version`      | 1.0.0, 1.1.0, etc.      | Version comparison    |
| `environment`      | production              | Environment filtering |

---

**Next Steps**: Ready to set up for implementation?
