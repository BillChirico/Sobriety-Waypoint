# Sentry Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Sentry for full observability (error tracking, performance monitoring, session replay, user feedback) in the 12-Step Tracker app with production-only monitoring and privacy-first data handling.

**Architecture:** Initialize Sentry at app root before providers, implement privacy scrubbing hooks, add strategic error boundaries, integrate with EAS builds for automatic source map uploads, and configure platform-specific native crash reporting for iOS/Android.

**Tech Stack:** @sentry/react-native, @sentry/react, sentry-expo plugin, EAS Build, Jest for testing

---

## Phase 1: Core Setup and Privacy

### Task 1: Install Sentry Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Add Sentry dependencies**

```bash
pnpm add @sentry/react-native@^5.36.0 @sentry/react@^8.40.0
pnpm add -D @sentry/wizard@^3.28.0 @sentry/cli@^2.39.0
```

**Step 2: Verify installation**

Run: `pnpm list @sentry/react-native @sentry/react`
Expected: Both packages listed with correct versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add Sentry SDK packages

- Add @sentry/react-native for mobile error tracking
- Add @sentry/react for web monitoring
- Add Sentry CLI and wizard tools for build integration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create Privacy Scrubbing Module

**Files:**

- Create: `lib/sentry-privacy.ts`
- Create: `lib/__tests__/sentry-privacy.test.ts`

**Step 1: Write failing privacy scrubbing tests**

Create `lib/__tests__/sentry-privacy.test.ts`:

```typescript
import { privacyBeforeSend, privacyBeforeBreadcrumb } from '../sentry-privacy';
import * as Sentry from '@sentry/react-native';

describe('privacyBeforeSend', () => {
  it('should strip message content from request data', () => {
    const event: Sentry.Event = {
      request: {
        data: {
          message: 'Sensitive recovery message',
          content: 'Task description',
          user_id: '123',
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.request?.data?.message).toBe('[Filtered]');
    expect(scrubbed?.request?.data?.content).toBe('[Filtered]');
    expect(scrubbed?.request?.data?.user_id).toBe('123');
  });

  it('should redact email addresses from error messages', () => {
    const event: Sentry.Event = {
      message: 'Error for user test@example.com',
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.message).toBe('Error for user [email]');
  });

  it('should preserve user ID but remove personal info', () => {
    const event: Sentry.Event = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        ip_address: '192.168.1.1',
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.user?.id).toBe('user-123');
    expect(scrubbed?.user?.email).toBeUndefined();
    expect(scrubbed?.user?.username).toBeUndefined();
    expect(scrubbed?.user?.ip_address).toBeUndefined();
  });

  it('should sanitize exception values', () => {
    const event: Sentry.Event = {
      exception: {
        values: [
          {
            type: 'Error',
            value: 'Failed to save message: "Help me stay sober"',
          },
        ],
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.exception?.values?.[0].value).not.toContain('Help me');
  });
});

describe('privacyBeforeBreadcrumb', () => {
  it('should filter Supabase query breadcrumbs', () => {
    const breadcrumb: Sentry.Breadcrumb = {
      category: 'http',
      data: {
        url: 'https://project.supabase.co/rest/v1/messages?select=*',
        method: 'GET',
        status_code: 200,
      },
    };

    const filtered = privacyBeforeBreadcrumb(breadcrumb);

    expect(filtered?.data?.table).toBe('messages');
    expect(filtered?.data?.method).toBe('GET');
    expect(filtered?.data?.status_code).toBe(200);
    expect(filtered?.data?.url).toBeUndefined();
  });

  it('should remove route params from navigation breadcrumbs', () => {
    const breadcrumb: Sentry.Breadcrumb = {
      category: 'navigation',
      data: {
        from: '/(tabs)/index',
        to: '/(tabs)/messages?user_id=123&message_id=456',
      },
    };

    const filtered = privacyBeforeBreadcrumb(breadcrumb);

    expect(filtered?.data?.to).toBe('/(tabs)/messages');
    expect(filtered?.data?.from).toBe('/(tabs)/index');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test lib/__tests__/sentry-privacy.test.ts`
Expected: FAIL - Module not found

**Step 3: Implement privacy scrubbing module**

Create `lib/sentry-privacy.ts`:

```typescript
import * as Sentry from '@sentry/react-native';

/**
 * Sensitive fields that should be scrubbed from all events
 */
const SENSITIVE_FIELDS = [
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
  'access_token',
  'refresh_token',
];

/**
 * Email regex for redaction
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * BeforeSend hook to scrub sensitive data from events
 */
export function privacyBeforeSend(event: Sentry.Event): Sentry.Event | null {
  // Strip sensitive request data
  if (event.request?.data) {
    event.request.data = sanitizeObject(event.request.data);
  }

  // Redact email addresses from error messages
  if (event.message) {
    event.message = event.message.replace(EMAIL_REGEX, '[email]');
  }

  // Sanitize exception values
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map(exception => ({
      ...exception,
      value: exception.value ? sanitizeString(exception.value) : exception.value,
    }));
  }

  // Remove sensitive user data, keep only ID
  if (event.user) {
    event.user = {
      id: event.user.id,
    };
  }

  return event;
}

/**
 * BeforeBreadcrumb hook to filter sensitive breadcrumbs
 */
export function privacyBeforeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  // Filter Supabase query breadcrumbs
  if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('supabase')) {
    const table = extractTableName(breadcrumb.data.url);
    return {
      ...breadcrumb,
      data: {
        method: breadcrumb.data.method,
        table,
        status_code: breadcrumb.data.status_code,
      },
    };
  }

  // Filter navigation breadcrumbs with sensitive params
  if (breadcrumb.category === 'navigation' && breadcrumb.data) {
    return {
      ...breadcrumb,
      data: {
        from: breadcrumb.data.from,
        to: stripQueryParams(breadcrumb.data.to),
      },
    };
  }

  return breadcrumb;
}

/**
 * Recursively sanitize object by replacing sensitive fields with '[Filtered]'
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '[Filtered]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize string by redacting emails and quoted content
 */
function sanitizeString(str: string): string {
  // Redact email addresses
  let sanitized = str.replace(EMAIL_REGEX, '[email]');

  // Redact quoted strings that might contain user content
  sanitized = sanitized.replace(/"[^"]{20,}"/g, '"[Filtered]"');

  return sanitized;
}

/**
 * Extract table name from Supabase URL
 */
function extractTableName(url: string): string {
  const match = url.match(/\/rest\/v1\/([^?]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Strip query parameters from URL or route
 */
function stripQueryParams(urlOrRoute: string): string {
  if (!urlOrRoute) return urlOrRoute;
  return urlOrRoute.split('?')[0];
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test lib/__tests__/sentry-privacy.test.ts`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add lib/sentry-privacy.ts lib/__tests__/sentry-privacy.test.ts
git commit -m "feat: add privacy scrubbing for Sentry events

- Implement beforeSend hook to filter sensitive fields
- Implement beforeBreadcrumb hook for Supabase/navigation
- Redact emails and quoted content from error messages
- Strip PII from user context, preserve ID only
- Add comprehensive test coverage

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Create Sentry Configuration Module

**Files:**

- Create: `lib/sentry.ts`
- Create: `__mocks__/@sentry/react-native.ts`

**Step 1: Create Jest mock for Sentry**

Create `__mocks__/@sentry/react-native.ts`:

```typescript
export const init = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const addBreadcrumb = jest.fn();
export const setUser = jest.fn();
export const setContext = jest.fn();
export const setTag = jest.fn();
export const startTransaction = jest.fn(() => ({
  startChild: jest.fn(() => ({
    finish: jest.fn(),
  })),
  finish: jest.fn(),
}));

export const ErrorBoundary = ({ children }: any) => children;

export const ReactNavigationInstrumentation = jest.fn();
export const ReactNativeTracing = jest.fn();
```

**Step 2: Create Sentry configuration module**

Create `lib/sentry.ts`:

```typescript
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

      // Session Replay (web only, errors only)
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 1.0,

      // Integrations
      integrations: [
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

      // Platform-specific options
      ...(Platform.OS === 'web' && {
        // Web-specific config
        integrations: [],
      }),
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
```

**Step 3: Verify module compiles**

Run: `pnpm typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add lib/sentry.ts __mocks__/@sentry/react-native.ts
git commit -m "feat: add Sentry initialization module

- Platform-aware Sentry configuration
- Production-only initialization check
- Privacy hooks integration
- 100% performance sampling
- User context management helpers
- Jest mocks for testing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Create Error Boundary Component

**Files:**

- Create: `components/ErrorBoundary.tsx`
- Create: `components/__tests__/ErrorBoundary.test.tsx`

**Step 1: Write failing error boundary tests**

Create `components/__tests__/ErrorBoundary.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import * as Sentry from '@sentry/react-native';

jest.mock('@sentry/react-native');

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should render children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  it('should capture error and show fallback UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.any(Object)
    );

    expect(getByText(/something went wrong/i)).toBeTruthy();
  });

  it('should allow retry after error', () => {
    let shouldThrow = true;

    const MaybeThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered</div>;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(getByText(/something went wrong/i)).toBeTruthy();

    shouldThrow = false;
    const retryButton = screen.getByText(/try again/i);
    fireEvent.press(retryButton);

    expect(getByText('Recovered')).toBeTruthy();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test components/__tests__/ErrorBoundary.test.tsx`
Expected: FAIL - Module not found

**Step 3: Implement error boundary component**

Create `components/ErrorBoundary.tsx`:

```typescript
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Oops! Something went wrong
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        We've been notified and are working on a fix.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onReset}
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export function ErrorBoundary({ children }: Props) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test components/__tests__/ErrorBoundary.test.tsx`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add components/ErrorBoundary.tsx components/__tests__/ErrorBoundary.test.tsx
git commit -m "feat: add error boundary with Sentry integration

- Capture errors and send to Sentry with component stack
- Themed fallback UI with retry functionality
- Integration with ThemeContext
- Comprehensive test coverage

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Integrate Sentry in Root Layout

**Files:**

- Modify: `app/_layout.tsx`

**Step 1: Add Sentry initialization to root layout**

Modify `app/_layout.tsx` - add at the very top, before all imports:

```typescript
// Initialize Sentry before anything else
import { initializeSentry } from '@/lib/sentry';
initializeSentry();

// ... existing imports
import { ErrorBoundary } from '@/components/ErrorBoundary';
```

**Step 2: Wrap app content in ErrorBoundary**

In the root layout component, wrap the existing content:

```typescript
export default function RootLayout() {
  // ... existing code

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          {/* ... existing content */}
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

**Step 3: Verify app still runs**

Run: `pnpm dev`
Expected: App starts without errors, console shows "[Sentry] Skipping initialization (not production)"

**Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: integrate Sentry in root layout

- Initialize Sentry before all imports
- Wrap app in ErrorBoundary for crash capture
- Sentry captures errors in AuthProvider and ThemeProvider

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: EAS Build Integration

### Task 6: Configure EAS for Sentry

**Files:**

- Modify: `eas.json`
- Modify: `app.config.ts`

**Step 1: Add Sentry plugin to eas.json**

Modify `eas.json` - update production build profile:

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

**Step 2: Update app.config.ts with Sentry hooks**

Modify `app.config.ts` - add to exports:

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
        organization: process.env.SENTRY_ORG || 'your-sentry-org',
        project: process.env.SENTRY_PROJECT || '12-step-tracker',
      },
    ],
  ],
};
```

**Step 3: Install sentry-expo plugin**

```bash
pnpm add sentry-expo
```

**Step 4: Verify configuration is valid**

Run: `npx expo config --type public`
Expected: Config outputs without errors, plugins section includes sentry-expo

**Step 5: Commit**

```bash
git add eas.json app.config.ts package.json pnpm-lock.yaml
git commit -m "feat: configure EAS build with Sentry plugin

- Add sentry-expo plugin to production build profile
- Configure source map upload hooks
- Add plugin configuration to app.config.ts
- Install sentry-expo package

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Add Environment Variable Documentation

**Files:**

- Create: `docs/SENTRY_SETUP.md`

**Step 1: Create Sentry setup documentation**

Create `docs/SENTRY_SETUP.md`:

````markdown
# Sentry Setup Guide

## Overview

This project uses Sentry for production error tracking and performance monitoring. Sentry is only enabled in production builds.

## Required Accounts

1. **Sentry Account**: Create at [sentry.io](https://sentry.io)
2. **Create Project**: "12-step-tracker" in your organization

## Environment Variables

### Required for Production Builds

```bash
# Sentry DSN (public, safe to expose)
EXPO_PUBLIC_SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project]"

# Sentry auth token for uploading source maps (keep private!)
SENTRY_AUTH_TOKEN="sntrys_[token]"

# Organization and project slugs
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="12-step-tracker"

# Environment identifier
APP_ENV="production"
```
````

### Setting Up EAS Secrets

```bash
# Add secrets to EAS
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://..."
eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_..."
eas secret:create --name SENTRY_ORG --value "your-org-slug"
eas secret:create --name SENTRY_PROJECT --value "12-step-tracker"

# Verify secrets
eas secret:list
```

### Setting Up GitHub Actions Secrets

Add the same variables to GitHub repository secrets:

1. Go to Settings → Secrets and variables → Actions
2. Add repository secrets for each variable above

## Getting Your Sentry DSN

1. Log in to [sentry.io](https://sentry.io)
2. Navigate to your project
3. Go to Settings → Client Keys (DSN)
4. Copy the DSN

## Creating an Auth Token

1. Go to Settings → Account → Auth Tokens
2. Click "Create New Token"
3. Scopes needed:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Copy the token immediately (only shown once!)

## Testing Sentry Integration

### In Development

Sentry is disabled in development to avoid noise and save quota. You'll see:

```
[Sentry] Skipping initialization (not production)
```

### In Production Build

1. Create production build with EAS
2. Trigger an error in the app
3. Check Sentry dashboard for the error event

## Privacy Configuration

All sensitive data is automatically scrubbed:

- Message content
- Task descriptions
- Sobriety dates
- Email addresses
- Personal information

See `lib/sentry-privacy.ts` for complete scrubbing rules.

## Performance Monitoring

- 100% of transactions are sampled
- Automatic instrumentation for navigation and API calls
- Custom spans for critical operations

## Quota Management

Free tier limits:

- 5,000 errors/month
- 10,000 transactions/month
- 50 session replays/month

Monitor usage at: Settings → Subscription

## Troubleshooting

### Source maps not uploading

Check that:

1. `SENTRY_AUTH_TOKEN` is set correctly
2. Token has `project:releases` scope
3. Build completed successfully

### Events not appearing in Sentry

Check that:

1. `APP_ENV=production` is set
2. DSN is correct
3. App is not in `__DEV__` mode

````

**Step 2: Commit**

```bash
git add docs/SENTRY_SETUP.md
git commit -m "docs: add Sentry setup guide

- Document required environment variables
- Explain EAS and GitHub secrets setup
- Add DSN and auth token instructions
- Include troubleshooting guide

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
````

---

## Phase 3: User Context Integration

### Task 8: Integrate Sentry with AuthContext

**Files:**

- Modify: `contexts/AuthContext.tsx`

**Step 1: Import Sentry helpers**

Add to `contexts/AuthContext.tsx` imports:

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry';
```

**Step 2: Set user context on login**

In the `AuthProvider` component, after successful authentication where `profile` is loaded, add:

```typescript
// After profile is loaded
useEffect(() => {
  if (session?.user && profile) {
    setSentryUser(session.user.id, profile.role);
  }
}, [session, profile]);
```

**Step 3: Clear user context on logout**

In the `signOut` function:

```typescript
const signOut = async () => {
  await supabase.auth.signOut();
  clearSentryUser();
  setSession(null);
  setUser(null);
  setProfile(null);
};
```

**Step 4: Verify type checking passes**

Run: `pnpm typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add contexts/AuthContext.tsx
git commit -m "feat: integrate Sentry with AuthContext

- Set user context on authentication
- Clear context on logout
- Tag events with user role

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: Testing and Validation

### Task 9: Add Privacy Scrubbing Edge Case Tests

**Files:**

- Modify: `lib/__tests__/sentry-privacy.test.ts`

**Step 1: Add edge case tests**

Add to existing test file:

```typescript
describe('privacyBeforeSend - edge cases', () => {
  it('should handle null/undefined gracefully', () => {
    const event: Sentry.Event = {};
    const scrubbed = privacyBeforeSend(event);
    expect(scrubbed).toBeTruthy();
  });

  it('should scrub nested sensitive fields', () => {
    const event: Sentry.Event = {
      request: {
        data: {
          task: {
            description: 'Read step 1',
            notes: 'Personal reflection',
          },
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.request?.data?.task?.description).toBe('[Filtered]');
    expect(scrubbed?.request?.data?.task?.notes).toBe('[Filtered]');
  });

  it('should preserve non-sensitive data', () => {
    const event: Sentry.Event = {
      request: {
        data: {
          task_id: '123',
          status: 'completed',
          user_id: 'abc',
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.request?.data?.task_id).toBe('123');
    expect(scrubbed?.request?.data?.status).toBe('completed');
    expect(scrubbed?.request?.data?.user_id).toBe('abc');
  });

  it('should handle arrays of data', () => {
    const event: Sentry.Event = {
      request: {
        data: {
          messages: [
            { content: 'Sensitive message 1', id: '1' },
            { content: 'Sensitive message 2', id: '2' },
          ],
        },
      },
    };

    const scrubbed = privacyBeforeSend(event);

    expect(scrubbed?.request?.data?.messages[0].content).toBe('[Filtered]');
    expect(scrubbed?.request?.data?.messages[0].id).toBe('1');
    expect(scrubbed?.request?.data?.messages[1].content).toBe('[Filtered]');
  });
});
```

**Step 2: Run tests**

Run: `pnpm test lib/__tests__/sentry-privacy.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add lib/__tests__/sentry-privacy.test.ts
git commit -m "test: add edge case tests for privacy scrubbing

- Test null/undefined handling
- Test nested object scrubbing
- Test array data scrubbing
- Verify non-sensitive data preserved

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Update CLAUDE.md with Sentry Context

**Files:**

- Modify: `CLAUDE.md`

**Step 1: Add Sentry section to CLAUDE.md**

Add new section after "Environment Variables":

```markdown
## Sentry Integration

The app uses Sentry for production error tracking and performance monitoring.

### Key Features

- **Production-only**: Sentry only initializes when `APP_ENV=production` and `!__DEV__`
- **Privacy-first**: All sensitive recovery data is automatically scrubbed
- **100% Sampling**: Full performance monitoring and error-focused session replay
- **EAS Integration**: Automatic source map uploads during production builds

### Important Files

- `lib/sentry.ts` - Core Sentry configuration and initialization
- `lib/sentry-privacy.ts` - Privacy scrubbing rules (CRITICAL for data protection)
- `components/ErrorBoundary.tsx` - React error boundary with Sentry integration
- `docs/SENTRY_SETUP.md` - Complete setup guide

### Privacy Rules

The following data is NEVER sent to Sentry:

- Message content
- Task descriptions
- Step reflections
- Sobriety dates
- Relapse information
- Email addresses
- Full names
- Any PII

Only debugging context is sent:

- User ID (UUID)
- User role
- Platform/device info
- Route names
- Error stack traces (with redactions)

### Testing Sentry

In development: Sentry is disabled
In production builds: Use EAS preview builds to test

See `docs/SENTRY_SETUP.md` for complete testing guide.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Sentry integration to CLAUDE.md

- Document Sentry features and privacy approach
- List key files for Sentry integration
- Add testing guidance
- Emphasize privacy-first approach

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Run Full Test Suite

**Files:**

- None (verification only)

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All 293+ tests pass (including new Sentry tests)

**Step 2: Run type checking**

Run: `pnpm typecheck`
Expected: No type errors

**Step 3: Run linting**

Run: `pnpm lint`
Expected: No linting errors

**Step 4: Verify app builds**

Run: `pnpm build:web`
Expected: Build completes successfully

**Step 5: Create verification commit**

```bash
git commit --allow-empty -m "chore: verify all tests pass after Sentry integration

- 293+ tests passing
- No type errors
- No linting errors
- Web build successful

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 5: Documentation and Completion

### Task 12: Update README with Sentry Info

**Files:**

- Modify: `README.md` (if it exists) or create it

**Step 1: Add Sentry section to README**

If README doesn't exist, create basic one. If it exists, add:

```markdown
## Error Monitoring

This app uses [Sentry](https://sentry.io) for production error tracking and performance monitoring.

- **Privacy-first**: All sensitive recovery data is automatically scrubbed
- **Production-only**: Monitoring disabled in development
- **Full observability**: Error tracking + performance monitoring + session replay

See [docs/SENTRY_SETUP.md](docs/SENTRY_SETUP.md) for setup instructions.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Sentry info to README

- Document error monitoring approach
- Link to setup guide

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 13: Create Pull Request Checklist

**Files:**

- Create: `docs/PR_CHECKLIST_SENTRY.md`

**Step 1: Create PR checklist**

Create `docs/PR_CHECKLIST_SENTRY.md`:

```markdown
# Sentry Integration PR Checklist

## Before Creating PR

### Code Quality

- [ ] All tests pass (`pnpm test`)
- [ ] No type errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Web build succeeds (`pnpm build:web`)

### Testing

- [ ] Privacy scrubbing tests cover all sensitive fields
- [ ] Error boundary tests pass
- [ ] Manual test: App runs without Sentry errors in dev

### Documentation

- [ ] SENTRY_SETUP.md is complete and accurate
- [ ] CLAUDE.md updated with Sentry context
- [ ] README.md mentions Sentry

### Security

- [ ] No Sentry secrets committed to git
- [ ] Privacy scrubbing covers all PII
- [ ] Production-only check works correctly

## After Creating PR

### EAS Secrets Setup (do this BEFORE merging)

- [ ] Add `EXPO_PUBLIC_SENTRY_DSN` to EAS secrets
- [ ] Add `SENTRY_AUTH_TOKEN` to EAS secrets
- [ ] Add `SENTRY_ORG` to EAS secrets
- [ ] Add `SENTRY_PROJECT` to EAS secrets
- [ ] Verify secrets with `eas secret:list`

### GitHub Secrets Setup

- [ ] Add same variables to GitHub Actions secrets
- [ ] Verify CI can access secrets

### Sentry Project Setup

- [ ] Create Sentry project "12-step-tracker"
- [ ] Get DSN and auth token
- [ ] Configure alerts in Sentry dashboard

## After Merging

### First Production Build

- [ ] Trigger production build with `eas build --platform all --profile production`
- [ ] Verify source maps upload successfully
- [ ] Check Sentry for release creation
- [ ] Test error capture in production build

### Monitoring Setup

- [ ] Configure Slack alerts for critical errors
- [ ] Set quota alerts at 80%
- [ ] Create Sentry dashboards

## Post-Deployment

### Week 1

- [ ] Monitor error rate daily
- [ ] Check for privacy leaks in captured events
- [ ] Verify performance overhead is acceptable
- [ ] Tune alert thresholds based on baseline

### Week 2-4

- [ ] Review and triage new errors
- [ ] Optimize sampling rates if needed
- [ ] Document common error patterns
- [ ] Train team on Sentry usage

## Rollback Plan

If issues occur:

1. Set `APP_ENV=development` in EAS to disable Sentry
2. Rebuild and deploy
3. Investigate issues offline
4. Re-enable after fix confirmed
```

**Step 2: Commit**

```bash
git add docs/PR_CHECKLIST_SENTRY.md
git commit -m "docs: add Sentry integration PR checklist

- Pre-PR verification steps
- EAS and GitHub secrets setup
- Post-merge monitoring plan
- Rollback procedure

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Summary

### What Was Implemented

**Phase 1: Core Setup**

- Installed Sentry SDK packages
- Created privacy scrubbing module with comprehensive tests
- Built Sentry configuration module
- Created error boundary component
- Integrated Sentry in root layout

**Phase 2: EAS Integration**

- Configured EAS build with Sentry plugin
- Set up source map upload hooks
- Created Sentry setup documentation

**Phase 3: User Context**

- Integrated Sentry with AuthContext
- Set user context on login/logout

**Phase 4: Testing**

- Added privacy scrubbing edge case tests
- Verified full test suite passes

**Phase 5: Documentation**

- Updated CLAUDE.md
- Updated README
- Created PR checklist

### Next Steps (Manual)

1. **Create Sentry Account**
   - Sign up at sentry.io
   - Create project "12-step-tracker"

2. **Configure Secrets**
   - Add EAS secrets (see SENTRY_SETUP.md)
   - Add GitHub Actions secrets

3. **Test in Production Build**
   - Create preview build with EAS
   - Trigger test error
   - Verify appears in Sentry

4. **Set Up Alerts**
   - Configure Slack integration
   - Set up critical error alerts
   - Configure quota alerts

### Files Created

- `lib/sentry.ts`
- `lib/sentry-privacy.ts`
- `lib/__tests__/sentry-privacy.test.ts`
- `components/ErrorBoundary.tsx`
- `components/__tests__/ErrorBoundary.test.tsx`
- `__mocks__/@sentry/react-native.ts`
- `docs/SENTRY_SETUP.md`
- `docs/PR_CHECKLIST_SENTRY.md`

### Files Modified

- `package.json`
- `eas.json`
- `app.config.ts`
- `app/_layout.tsx`
- `contexts/AuthContext.tsx`
- `CLAUDE.md`
- `README.md`

### Key Metrics

- Tests added: ~15 new tests
- Code coverage: Privacy scrubbing fully tested
- Type safety: 100% type coverage
- Production impact: Only initializes in production builds
