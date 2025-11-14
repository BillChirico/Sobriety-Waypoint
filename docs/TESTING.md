# Testing Guide

This document describes the testing infrastructure and patterns for the Sobriety Waypoint application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Testing Stack](#testing-stack)
3. [Test Utilities](#test-utilities)
4. [Fixtures](#fixtures)
5. [API Mocking with MSW](#api-mocking-with-msw)
6. [Writing Tests](#writing-tests)
7. [Running Tests](#running-tests)
8. [Best Practices](#best-practices)

## Quick Start

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage

# Run a specific test file
pnpm test path/to/test.test.ts
```

## Testing Stack

### Core Technologies

- **Jest** (v29) - Test runner and assertion library
- **React Native Testing Library** (v13.3.3) - Component testing with user-centric queries
- **MSW** (Mock Service Worker v2) - API mocking for Supabase calls
- **Maestro** - E2E testing framework (configured but not yet fully implemented)

### Compatibility

- ✅ React 19 fully supported
- ✅ React Native 0.81.5 compatibility resolved
- ✅ Expo 54 with New Architecture

## Test Utilities

The project includes custom testing utilities in `test-utils/` that simplify component testing.

### Custom Render Function

The `renderWithProviders` function automatically wraps components with necessary context providers:

```typescript
import { render } from '@/test-utils';

// Render with ThemeProvider (default)
const { getByText } = render(<MyComponent />);

// Render with dark theme
const { getByText } = render(<MyComponent />, { themeMode: 'dark' });

// Render with AuthContext (when needed)
const { getByText } = render(<MyComponent />, {
  withAuth: true,
  authState: { profile: mockProfile }
});
```

### Helper Functions

```typescript
import { flushPromises, wait, createDeferred, generateTestId, suppressConsole } from '@/test-utils';

// Wait for async operations
await flushPromises();

// Wait for specific time
await wait(100);

// Create deferred promise for testing
const { promise, resolve, reject } = createDeferred();

// Suppress console output during error tests
const restore = suppressConsole(['error', 'warn']);
// ... test code ...
restore();
```

## Fixtures

Fixtures provide reusable test data with sensible defaults and easy customization.

### Using Fixtures

```typescript
import {
  createProfile,
  createSponsor,
  createSponsee,
  createTask,
  createMessage,
  createRelationship,
} from '@/__tests__/fixtures';

// Create a basic profile
const profile = createProfile();

// Create a profile with overrides
const sponsor = createSponsor({
  first_name: 'John',
  sobriety_date: '2020-01-01',
});

// Create related entities
const task = createTask({
  sponsor_id: sponsor.id,
  sponsee_id: sponsee.id,
  title: 'Complete Step 1',
});
```

### Available Fixture Factories

**Profiles:**

- `createProfile()` - Basic profile
- `createSponsor()` - Profile with sponsor role
- `createSponsee()` - Profile with sponsee role
- `createBothRoleProfile()` - Profile with both roles
- `createNewUserProfile()` - Profile without role set

**Tasks:**

- `createTask()` - Basic task
- `createAssignedTask()` - Task with 'assigned' status
- `createInProgressTask()` - Task with 'in_progress' status
- `createCompletedTask()` - Task with 'completed' status
- `createTaskWithProfiles()` - Task with sponsor/sponsee profiles included

**Messages:**

- `createMessage()` - Basic message
- `createUnreadMessage()` - Unread message
- `createReadMessage()` - Read message
- `createMessageWithProfiles()` - Message with sender/recipient profiles
- `createConversation()` - Array of messages forming a conversation

**Relationships:**

- `createRelationship()` - Basic relationship
- `createActiveRelationship()` - Active relationship
- `createPendingRelationship()` - Pending relationship
- `createInactiveRelationship()` - Inactive relationship
- `createSponsorSponeePair()` - Complete sponsor-sponsee setup

**Other:**

- `createNotification()` - Notification
- `createStepContent()` - Step content
- `createInviteCode()` - Invite code
- `createSlipUp()` - Slip-up record
- `createUserStepProgress()` - User progress on steps

## API Mocking with MSW

MSW (Mock Service Worker) mocks Supabase API calls for isolated testing.

### Enabling MSW in Tests

MSW is configured but not globally enabled due to ESM compatibility. Enable it per test file:

```typescript
import { server } from '@/mocks/server';
import { resetDb, seedDb } from '@/mocks/db';

describe('My Test Suite', () => {
  // Start server before tests
  beforeAll(() => server.listen());

  // Reset handlers and database after each test
  afterEach(() => {
    server.resetHandlers();
    resetDb();
  });

  // Stop server after tests
  afterAll(() => server.close());

  it('should fetch profiles', async () => {
    // Seed the mock database
    seedDb({
      profiles: new Map([[profile.id, profile]]),
    });

    // Make API calls - they'll be intercepted by MSW
    const { data } = await supabase.from('profiles').select('*');

    expect(data).toEqual([profile]);
  });
});
```

### Mock Database Operations

```typescript
import { db, seedDb, resetDb } from '@/mocks/db';

// Seed database with test data
seedDb({
  profiles: new Map([
    [profile1.id, profile1],
    [profile2.id, profile2],
  ]),
  tasks: new Map([[task.id, task]]),
});

// Access data directly (for verification)
expect(db.profiles.size).toBe(2);
expect(db.tasks.get(task.id)).toBeDefined();

// Reset database (do this after each test)
resetDb();
```

### Supported Operations

MSW handlers support:

- ✅ GET requests with filtering (eq, neq, gt, lt, like, etc.)
- ✅ POST (create)
- ✅ PATCH (update)
- ✅ DELETE
- ✅ Authentication operations (sign up, sign in, sign out)

## Writing Tests

### Unit Tests

Test individual functions or utilities:

```typescript
// __tests__/lib/validation.test.ts
describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });
});
```

### Component Tests

Test React components with user interactions:

```typescript
// __tests__/components/MyComponent.test.tsx
import { render, screen, fireEvent } from '@/test-utils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render with text', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('should handle button click', () => {
    const onPress = jest.fn();
    render(<MyComponent onPress={onPress} />);

    fireEvent.press(screen.getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Test multiple components or data flows together:

```typescript
import { server } from '@/mocks/server';
import { seedDb, resetDb } from '@/mocks/db';
import { createSponsor, createSponsee, createTask } from '@/__tests__/fixtures';

describe('Task Assignment Flow', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    resetDb();
  });
  afterAll(() => server.close());

  it('should assign task and notify sponsee', async () => {
    const sponsor = createSponsor();
    const sponsee = createSponsee();

    seedDb({
      profiles: new Map([
        [sponsor.id, sponsor],
        [sponsee.id, sponsee],
      ]),
    });

    // Test the complete flow
    // 1. Sponsor creates task
    // 2. Task is saved
    // 3. Notification is created
    // 4. Sponsee receives notification
  });
});
```

## Running Tests

### Commands

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test path/to/file.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="should create profile"

# Run tests for changed files only
pnpm test --onlyChanged
```

### Coverage Thresholds

The project enforces 80% coverage thresholds:

```javascript
coverageThresholds: {
  global: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
}
```

## Best Practices

### General

1. **Test Behavior, Not Implementation** - Focus on what the component/function does, not how it does it
2. **Arrange-Act-Assert Pattern** - Structure tests clearly (setup, execute, verify)
3. **One Assertion Per Test** - Keep tests focused on a single behavior
4. **Descriptive Test Names** - Use `it('should...')` pattern
5. **Test Edge Cases** - Don't just test happy paths
6. **Keep Tests Fast** - Mock external dependencies
7. **Independent Tests** - No shared state between tests

### React Native Specific

1. **Use `testID`** - Add `testID` prop to elements for reliable selection
2. **Avoid Implementation Details** - Don't test internal state directly
3. **User-Centric Queries** - Prefer `getByText`, `getByRole`, `getByLabelText`
4. **Test Accessibility** - Ensure proper labels, roles, and hints
5. **Mock Platform APIs** - Mock platform-specific features (Camera, SecureStore, etc.)

### Fixtures and Mocking

1. **Use Fixtures for Data** - Don't create test data manually
2. **Reset After Each Test** - Always call `resetDb()` in `afterEach`
3. **Seed What You Need** - Only seed data required for the specific test
4. **Use Factory Overrides** - Customize fixtures for specific test cases
5. **Test with Realistic Data** - Avoid `admin@admin.com` type data

### Example Test Structure

```typescript
import { server } from '@/mocks/server';
import { seedDb, resetDb } from '@/mocks/db';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { createProfile } from '@/__tests__/fixtures';

describe('MyFeature', () => {
  // Setup MSW if needed
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    resetDb();
  });
  afterAll(() => server.close());

  describe('when user is authenticated', () => {
    it('should display user profile', () => {
      const profile = createProfile({ first_name: 'John' });

      seedDb({
        profiles: new Map([[profile.id, profile]]),
      });

      render(<MyComponent />, {
        withAuth: true,
        authState: { profile },
      });

      expect(screen.getByText('John')).toBeTruthy();
    });
  });

  describe('when user is not authenticated', () => {
    it('should show login prompt', () => {
      render(<MyComponent />);
      expect(screen.getByText('Please log in')).toBeTruthy();
    });
  });
});
```

## Troubleshooting

### Common Issues

**Issue: Tests fail with "Cannot find module 'msw/node'"**

Solution: MSW is configured for opt-in usage. Import and set up the server manually in your test file.

**Issue: AsyncStorage errors**

Solution: AsyncStorage is mocked globally. If you need custom behavior, mock it in your test file.

**Issue: useColorScheme is not a function**

Solution: This is mocked in `__mocks__/react-native.js`. Ensure the mock is being applied.

**Issue: Tests are slow**

Solution:

- Use MSW to mock API calls instead of real requests
- Avoid unnecessary `waitFor` calls
- Use fixtures instead of creating data manually

### Getting Help

1. Check existing test files for examples
2. Review fixture factories in `__tests__/fixtures/`
3. Look at `__tests__/examples/` for common patterns
4. Check the vertical slice results: `docs/TESTING_VERTICAL_SLICE_RESULTS.md`

## E2E Testing with Maestro

### Overview

Maestro is a mobile UI testing framework that allows you to write E2E tests in simple YAML format. Tests run on real devices or simulators.

### Running Maestro Tests

```bash
# Run all flows
pnpm maestro

# Run specific flow
maestro test .maestro/flows/01-authentication.yaml

# Record new flow interactively
pnpm maestro:record

# Debug flow with detailed output
maestro test --debug .maestro/flows/01-authentication.yaml

# Test on specific device
maestro test --device "iPhone 15 Pro" .maestro/flows/01-authentication.yaml
```

### Maestro Flow Structure

Basic flow structure:

```yaml
appId: com.billchirico.twelvesteptracker
---
# Flow steps
- launchApp
- tapOn: 'Sign In'
- inputText: 'test@example.com'
- assertVisible: 'Welcome'
```

### Best Practices for E2E Tests

1. **Use testID for Reliability** - Add `testID` props to components for consistent selection
2. **Avoid Hardcoded Waits** - Use `assertVisible` instead of fixed delays
3. **Keep Flows Focused** - One user journey per flow
4. **Use Test Data** - Document test accounts in `.maestro/README.md`
5. **Clean Up State** - Reset app state between flows when needed
6. **Handle Async Operations** - Wait for loading states to complete

### Available Flows

- `00-smoke-test.yaml` - Basic app launch and login screen validation
- `01-authentication.yaml` - Sign up and sign in flows
- `02-onboarding.yaml` - New user onboarding process
- More flows coming in Phase 4 implementation

### Test Data Setup

Create dedicated test accounts in Supabase for E2E testing. See `.maestro/README.md` for credentials and setup instructions.

## CI/CD Integration

### Automated Testing

Tests run automatically on:

- Every push to `main` or `develop` branches
- Every pull request
- Manual workflow dispatch

### GitHub Actions Workflows

**Unit Tests** (`.github/workflows/ci.yml`):

```yaml
test:
  name: Unit Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - uses: pnpm/action-setup@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm test:ci --coverage
    - uses: codecov/codecov-action@v4
```

**E2E Tests** (`.github/workflows/e2e-tests.yml`):

- Runs on macOS runners for iOS simulator access
- Installs Maestro CLI
- Starts Expo development server
- Executes all Maestro flows
- Uploads test results as artifacts

### Coverage Requirements

The project enforces minimum 80% code coverage:

```javascript
coverageThresholds: {
  global: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
}
```

Coverage reports are:

- Generated on every test run
- Uploaded to Codecov for tracking
- Available as CI artifacts for 7 days
- Enforced by branch protection rules

### Branch Protection

Main and develop branches require:

- ✅ Unit tests passing
- ✅ E2E tests passing (when enabled)
- ✅ 80% code coverage maintained
- ✅ At least 1 approval before merge
- ✅ Linting and type checks passing

### Monitoring Test Results

**GitHub Actions**:

- View workflow runs in the Actions tab
- Download test artifacts for debugging
- Check coverage trends over time

**Codecov Dashboard**:

- Track coverage changes per PR
- View detailed coverage reports
- Identify untested code paths
- Set up notifications for coverage drops

## Test Structure and Organization

### Directory Layout

```
__tests__/
  setup.ts                    # Global test configuration
  examples/                   # Example test patterns
    component.test.tsx        # Component testing example
    integration.test.tsx      # Integration testing example
  fixtures/                   # Test data factories
    profiles.ts
    tasks.ts
    messages.ts
    relationships.ts
  lib/                        # Utility tests
    validation.test.ts
  components/                 # Component tests
    Button.test.tsx

__mocks__/                    # Module mocks
  @/lib/supabase.ts
  expo-router.ts
  react-native.js

mocks/                        # MSW configuration
  server.ts                   # MSW server setup
  db.ts                       # Mock database
  handlers/                   # API endpoint handlers
    auth.ts
    profiles.ts
    tasks.ts

test-utils/                   # Testing utilities
  index.ts                    # Re-exports all utilities
  render.tsx                  # Custom render function
  helpers.ts                  # Test helper functions

.maestro/                     # E2E tests
  flows/                      # Test flows
    00-smoke-test.yaml
    01-authentication.yaml
  README.md                   # E2E test documentation
```

### Naming Conventions

**Test Files**:

- Unit tests: `[filename].test.ts`
- Component tests: `[ComponentName].test.tsx`
- Integration tests: `[feature].integration.test.tsx`
- E2E tests: `[flow-number]-[flow-name].yaml`

**Test Descriptions**:

```typescript
// Good
it('should create task when sponsor submits form', () => {});
it('should display error when email is invalid', () => {});

// Avoid
it('works', () => {});
it('test task creation', () => {});
```

## Mocking Strategy

### When to Use Module Mocks

Use module mocks (`__mocks__/`) for:

- Platform-specific APIs (SecureStore, AsyncStorage)
- Navigation (Expo Router)
- Native modules (Camera, Haptics)
- External libraries with complex setup

### When to Use MSW

Use MSW (`mocks/`) for:

- Supabase API calls
- Integration tests with realistic data
- Testing error scenarios
- Testing network failures

### Mock Priority

1. **Module mocks** are applied globally via Jest configuration
2. **MSW handlers** intercept network requests when server is running
3. **Inline mocks** (`jest.fn()`) for specific test cases

## Troubleshooting

### Common Issues

**Issue: Tests fail with "Cannot find module 'msw/node'"**

Solution: MSW is configured for opt-in usage. Import and set up the server manually in your test file.

**Issue: AsyncStorage errors**

Solution: AsyncStorage is mocked globally. If you need custom behavior, mock it in your test file.

**Issue: useColorScheme is not a function**

Solution: This is mocked in `__mocks__/react-native.js`. Ensure the mock is being applied.

**Issue: Tests are slow**

Solution:

- Use MSW to mock API calls instead of real requests
- Avoid unnecessary `waitFor` calls
- Use fixtures instead of creating data manually

**Issue: Maestro flow fails on CI but works locally**

Solution:

- Check device/simulator availability on CI runner
- Verify environment variables are set correctly
- Ensure test data exists in test environment
- Check Maestro logs in CI artifacts

**Issue: Coverage threshold not met**

Solution:

- Run `pnpm test -- --coverage` to see uncovered lines
- Add tests for uncovered branches and statements
- Focus on critical paths first
- Use coverage report to identify gaps

### Getting Help

1. Check existing test files for examples
2. Review fixture factories in `__tests__/fixtures/`
3. Look at `__tests__/examples/` for common patterns
4. Check the vertical slice results: `docs/TESTING_VERTICAL_SLICE_RESULTS.md`
5. Review test templates in `docs/templates/`
6. See CI workflow definitions in `.github/workflows/`

## Test Templates

Pre-built templates are available in `docs/templates/`:

- `component.test.template.tsx` - Component testing template
- `hook.test.template.ts` - Custom hook testing template
- `integration.test.template.tsx` - Integration test template
- `maestro-flow.template.yaml` - Maestro E2E flow template

## Next Steps

See [Issue #6](https://github.com/BillChirico/12-Step-Tracker/issues/6) for the complete implementation plan and current progress.
