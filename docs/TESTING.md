# Testing Guide

This document describes the testing infrastructure and patterns for the 12-Step Tracker application.

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

## Next Steps

**Phase 2: Component Testing**

- Expand component test coverage
- Test all authentication screens
- Test main app screens (tasks, messages, steps, profile)

**Phase 3: Integration Testing**

- Test complete user flows
- Test error scenarios
- Test edge cases

**Phase 4: E2E Testing**

- Complete Maestro test flows
- Add CI integration for E2E tests
- Test on real devices

See [Issue #6](https://github.com/BillChirico/12-Step-Tracker/issues/6) for the complete implementation plan.
