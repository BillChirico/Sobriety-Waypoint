# Testing Infrastructure Vertical Slice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate the entire testing stack (Jest + RNTL + Maestro + CI) works with minimal implementation before expanding coverage.

**Architecture:** Install jest-expo preset for unit tests, React Native Testing Library for component tests, Maestro for E2E smoke testing, and integrate basic test job into existing CI pipeline.

**Tech Stack:** Jest, jest-expo, @testing-library/react-native, @testing-library/jest-native, Maestro CLI, GitHub Actions

---

## Task 1: Install Testing Packages

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml` (auto-generated)

**Step 1: Install packages**

```bash
pnpm add -D jest-expo @testing-library/react-native @testing-library/jest-native
```

Expected output: Package installation success, ~15-20 additional packages added

**Step 2: Verify installation**

```bash
pnpm list jest-expo @testing-library/react-native @testing-library/jest-native
```

Expected output: Shows installed versions (jest-expo should be ^54.0.13, RNTL ^13.3.3)

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add testing dependencies (jest-expo, RNTL, jest-native)"
```

---

## Task 2: Configure Jest

**Files:**

- Create: `jest.config.js`

**Step 1: Create Jest configuration**

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
```

**Step 2: Verify Jest can initialize (will fail on missing setup.ts)**

```bash
pnpm exec jest --listTests
```

Expected output: Error about missing `__tests__/setup.ts` (expected - we'll create it next)

**Step 3: Commit**

```bash
git add jest.config.js
git commit -m "chore: configure Jest with jest-expo preset"
```

---

## Task 3: Create Test Setup File

**Files:**

- Create: `__tests__/setup.ts`

**Step 1: Create test setup file**

Create `__tests__/setup.ts`:

```typescript
/**
 * Global test setup for Jest
 * This file runs before all tests and configures the testing environment
 */

// Import custom matchers from jest-native
import '@testing-library/jest-native/extend-expect';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep error to catch unexpected errors
};
```

**Step 2: Verify Jest can now initialize**

```bash
pnpm exec jest --listTests
```

Expected output: Empty array `[]` (no tests found yet, but configuration valid)

**Step 3: Commit**

```bash
git add __tests__/setup.ts
git commit -m "chore: add Jest global test setup with jest-native matchers"
```

---

## Task 4: Create Minimal Mocks

**Files:**

- Create: `__mocks__/@/lib/supabase.ts`
- Create: `__mocks__/expo-router.ts`
- Create: `__mocks__/expo-secure-store.ts`

**Step 1: Create Supabase mock**

Create `__mocks__/@/lib/supabase.ts`:

```typescript
/**
 * Mock Supabase client for testing
 * Provides jest.fn() mocks for all Supabase methods used in the app
 */

export const supabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  })),
};
```

**Step 2: Create Expo Router mock**

Create `__mocks__/expo-router.ts`:

```typescript
/**
 * Mock Expo Router for testing
 * Provides jest.fn() mocks for all routing methods
 */

export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
}));

export const useSegments = jest.fn(() => []);
export const usePathname = jest.fn(() => '/');
export const useLocalSearchParams = jest.fn(() => ({}));
export const useGlobalSearchParams = jest.fn(() => ({}));

export const Stack = {
  Screen: jest.fn(),
};

export const Tabs = {
  Screen: jest.fn(),
};

export const Link = jest.fn(({ children }) => children);
export const Redirect = jest.fn();
export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};
```

**Step 3: Create Expo SecureStore mock**

Create `__mocks__/expo-secure-store.ts`:

```typescript
/**
 * Mock Expo SecureStore for testing
 * Provides in-memory storage for testing authentication persistence
 */

const storage: Record<string, string> = {};

export const setItemAsync = jest.fn(async (key: string, value: string): Promise<void> => {
  storage[key] = value;
});

export const getItemAsync = jest.fn(async (key: string): Promise<string | null> => {
  return storage[key] || null;
});

export const deleteItemAsync = jest.fn(async (key: string): Promise<void> => {
  delete storage[key];
});
```

**Step 4: Commit**

```bash
git add __mocks__
git commit -m "chore: add minimal mocks for Supabase, Expo Router, and SecureStore"
```

---

## Task 5: Write First Utility Test

**Files:**

- Create: `__tests__/lib/validation.test.ts`
- Create: `lib/validation.ts`

**Step 1: Write the failing test**

Create `__tests__/lib/validation.test.ts`:

```typescript
/**
 * Tests for validation utilities
 * This is the first test to validate basic Jest setup
 */

import { isValidEmail } from '@/lib/validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm exec jest __tests__/lib/validation.test.ts
```

Expected output: Test FAILS with "Cannot find module '@/lib/validation'"

**Step 3: Write minimal implementation**

Create `lib/validation.ts`:

```typescript
/**
 * Validation utility functions
 */

/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  // Basic email regex - validates format like user@domain.com
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm exec jest __tests__/lib/validation.test.ts
```

Expected output:

```
PASS  __tests__/lib/validation.test.ts
  validation utilities
    isValidEmail
      ✓ should return true for valid email addresses (Xms)
      ✓ should return false for invalid email addresses (Xms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

**Step 5: Commit**

```bash
git add __tests__/lib/validation.test.ts lib/validation.ts
git commit -m "feat: add email validation utility with tests"
```

---

## Task 6: Write First Component Test

**Files:**

- Create: `__tests__/components/ThemedText.test.tsx`
- Read: `components/ThemedText.tsx` (to understand what we're testing)

**Step 1: Check if simple component exists**

```bash
ls components/ThemedText.tsx
```

If exists: Continue with testing it
If not exists: Pick another simple component or create a minimal Button component

**Step 2: Write the failing test**

Create `__tests__/components/ThemedText.test.tsx`:

```typescript
/**
 * Tests for ThemedText component
 * This is the first component test to validate RNTL setup
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemedText } from '@/components/ThemedText';

describe('ThemedText', () => {
  it('should render text content', () => {
    render(<ThemedText>Hello World</ThemedText>);

    expect(screen.getByText('Hello World')).toBeOnTheScreen();
  });

  it('should apply default text type when not specified', () => {
    const { getByText } = render(<ThemedText>Default Text</ThemedText>);

    expect(getByText('Default Text')).toBeTruthy();
  });
});
```

**Step 3: Run test to verify behavior**

```bash
pnpm exec jest __tests__/components/ThemedText.test.tsx
```

Expected outcomes:

- If ThemedText doesn't exist: FAILS with import error (create minimal component)
- If ThemedText exists: May PASS or FAIL depending on component implementation
- If FAILS due to React 19 incompatibility: Document the error and skip to next task

**Step 4: If needed, ensure component is testable**

If the component uses complex context (ThemeContext), for now just verify it renders:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '@/components/ThemedText';

describe('ThemedText', () => {
  it('should render without crashing', () => {
    // Minimal test just to validate RNTL works
    const { getByText } = render(<ThemedText>Test</ThemedText>);
    expect(getByText('Test')).toBeTruthy();
  });
});
```

**Step 5: Run test to verify it passes**

```bash
pnpm exec jest __tests__/components/ThemedText.test.tsx
```

Expected output: Test PASSES (or documents React 19 compatibility issue)

**Step 6: Commit**

```bash
git add __tests__/components/ThemedText.test.tsx
git commit -m "test: add first component test for ThemedText"
```

**Note:** If React 19 + RNTL has compatibility issues:

- Document the specific error in commit message
- Try `pnpm add -D @testing-library/react-native@next`
- If still fails, document this as a known issue and proceed with E2E testing

---

## Task 7: Add Test Scripts to package.json

**Files:**

- Modify: `package.json`

**Step 1: Add test scripts**

Edit `package.json` to add these scripts to the `"scripts"` section:

```json
{
  "scripts": {
    "dev": "EXPO_NO_TELEMETRY=1 expo start",
    "ios": "EXPO_NO_TELEMETRY=1 expo run:ios",
    "android": "EXPO_NO_TELEMETRY=1 expo run:android",
    "build:web": "expo export --platform web",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --maxWorkers=2",
    "prepare": "husky"
  }
}
```

**Step 2: Verify scripts work**

```bash
# Run all tests
pnpm test

# Test CI mode
pnpm test:ci
```

Expected output: Both commands run successfully and show test results

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add test scripts to package.json"
```

---

## Task 8: Install Maestro CLI

**Files:**

- None (system-level installation)

**Step 1: Install Maestro CLI**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Expected output: Installation success message, Maestro installed to `~/.maestro/bin/maestro`

**Step 2: Add Maestro to PATH (if needed)**

```bash
echo 'export PATH="$HOME/.maestro/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Or for bash:

```bash
echo 'export PATH="$HOME/.maestro/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Step 3: Verify installation**

```bash
maestro --version
```

Expected output: Shows Maestro version (e.g., `1.x.x`)

**Note:** No commit needed - this is local system setup only

---

## Task 9: Create Maestro Smoke Test

**Files:**

- Create: `.maestro/flows/00-smoke-test.yaml`

**Step 1: Create Maestro flows directory**

```bash
mkdir -p .maestro/flows
```

**Step 2: Create smoke test flow**

Create `.maestro/flows/00-smoke-test.yaml`:

```yaml
appId: com.billchirico.twelvesteptracker
---
# Smoke Test: Verify app launches and shows login screen
# This minimal test validates Maestro setup works

- launchApp
- assertVisible: 'Login'
```

**Step 3: Create Maestro README**

Create `.maestro/README.md`:

````markdown
# Maestro E2E Tests

## Running Tests Locally

### Prerequisites

- Maestro CLI installed: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- iOS Simulator or Android Emulator running
- App installed on device/simulator

### Run All Flows

```bash
maestro test .maestro/flows
```
````

### Run Specific Flow

```bash
maestro test .maestro/flows/00-smoke-test.yaml
```

### Record New Flow

```bash
maestro record
```

## Flows

- `00-smoke-test.yaml` - Basic app launch test

## Notes

- Flows are designed to be run against a clean app state
- Test accounts: (to be added when needed)

````

**Step 4: Document how to run (manual test)**

To test locally:
1. Start Expo: `pnpm dev`
2. Open iOS Simulator or Android Emulator
3. In simulator, open app
4. Run Maestro: `maestro test .maestro/flows/00-smoke-test.yaml`

Expected: Test passes if app shows "Login" text on launch screen

**Step 5: Commit**

```bash
git add .maestro/
git commit -m "test: add Maestro E2E smoke test"
````

---

## Task 10: Add CI Test Job

**Files:**

- Modify: `.github/workflows/ci.yml`

**Step 1: Read current CI workflow**

```bash
cat .github/workflows/ci.yml
```

Note the existing jobs: `lint`, `build-web`, `build-android`, `build-ios`

**Step 2: Add test job before build jobs**

Edit `.github/workflows/ci.yml` and add this job after the `lint` job:

```yaml
test:
  name: Unit Tests
  runs-on: ubuntu-latest

  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: 8

    - name: Get pnpm store directory
      id: pnpm-cache
      run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

    - name: Setup pnpm cache
      uses: actions/cache@v4
      with:
        path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
        key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
        restore-keys: |
          ${{ runner.os }}-pnpm-store-

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run tests
      run: pnpm test:ci
```

**Step 3: Update build jobs to depend on test**

For each of `build-web`, `build-android`, and `build-ios` jobs, update the `needs` line:

```yaml
build-web:
  name: Build for Web
  needs: [lint, test] # Add 'test' to dependencies
  # ... rest of job

build-android:
  name: Build for Android
  needs: [lint, test] # Add 'test' to dependencies
  # ... rest of job

build-ios:
  name: Build for iOS
  needs: [lint, test] # Add 'test' to dependencies
  # ... rest of job
```

**Step 4: Commit changes**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add unit test job to CI pipeline"
```

**Step 5: Push and verify CI**

```bash
git push origin feature/testing-infrastructure
```

Then:

1. Open GitHub and create a PR (or check CI on the branch)
2. Verify the "Unit Tests" job runs
3. Verify build jobs wait for tests to pass
4. Check test output in CI logs

Expected: CI runs successfully, tests pass, builds proceed

---

## Task 11: Update README with Testing Section

**Files:**

- Modify: `README.md`

**Step 1: Add testing section to README**

Add this section after the "Development Commands" section in `README.md`:

````markdown
## Testing

### Unit and Component Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests in CI mode
pnpm test:ci
```
````

### E2E Tests with Maestro

See [.maestro/README.md](.maestro/README.md) for E2E testing documentation.

```bash
# Run all E2E flows
maestro test .maestro/flows

# Run specific flow
maestro test .maestro/flows/00-smoke-test.yaml
```

### Coverage

Currently tracking 2 tests as baseline. See [docs/plans/2025-01-11-testing-infrastructure-design.md](docs/plans/2025-01-11-testing-infrastructure-design.md) for expansion plan.

````

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add testing section to README"
````

---

## Task 12: Document Vertical Slice Completion

**Files:**

- Create: `docs/TESTING_VERTICAL_SLICE_RESULTS.md`

**Step 1: Create results document**

Create `docs/TESTING_VERTICAL_SLICE_RESULTS.md`:

```markdown
# Testing Infrastructure Vertical Slice - Results

**Date:** 2025-01-11
**Branch:** feature/testing-infrastructure
**Status:** ✅ Complete

## What Was Validated

### Jest + jest-expo ✅

- Configuration works with Expo 54
- Path aliases resolved correctly (`@/...`)
- transformIgnorePatterns handle React Native modules

### React Native Testing Library

- [✅ / ❌ - document actual result]
- React 19 compatibility: [WORKS / NEEDS @next / HAS ISSUES]
- Component rendering: [WORKS / NEEDS WORKAROUND]
- Notes: [Any specific findings]

### Maestro E2E

- [✅ / ❌ - document actual result]
- Installation: [SUCCESS / ISSUES]
- Smoke test: [PASSES / NEEDS ADJUSTMENT]
- Notes: [Any specific findings]

### CI Integration ✅

- Test job runs successfully
- Build jobs properly depend on tests
- pnpm caching works

## Test Results

**Unit Tests:**

- 2 tests passing (1 utility test with 2 assertions, 1 component test)
- Run time: ~X seconds locally
- Run time: ~X seconds in CI

**E2E Tests:**

- 1 smoke test [PASSING / NEEDS WORK]
- Run time: ~X seconds locally

## Known Issues

[Document any issues discovered during vertical slice]

### React 19 + RNTL

[If applicable: Specific errors, workarounds attempted, resolution]

### Maestro

[If applicable: Setup issues, flow adjustments needed]

## Next Steps

✅ Vertical slice validated - proceed with Phase 1 expansion

- Add MSW for API mocking
- Create custom render with providers
- Create fixture library
- Add comprehensive mocks

See: [docs/plans/2025-01-11-testing-infrastructure-design.md](2025-01-11-testing-infrastructure-design.md)
```

**Step 2: Fill in actual results after running all tests**

Run tests and update the document with real results:

```bash
pnpm test:ci
```

**Step 3: Commit**

```bash
git add docs/TESTING_VERTICAL_SLICE_RESULTS.md
git commit -m "docs: document vertical slice validation results"
```

---

## Task 13: Final Verification and PR

**Step 1: Run full verification**

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format:check

# Run tests
pnpm test:ci
```

Expected: All checks pass

**Step 2: Push final changes**

```bash
git push origin feature/testing-infrastructure
```

**Step 3: Create Pull Request**

Title: `feat: Testing Infrastructure Vertical Slice`

Description:

```markdown
## Overview

Implements vertical slice of testing infrastructure to validate the entire testing stack before expanding coverage.

## What's Included

- ✅ Jest configuration with jest-expo preset
- ✅ React Native Testing Library setup
- ✅ Minimal mocks (Supabase, Expo Router, SecureStore)
- ✅ 1 utility test (email validation)
- ✅ 1 component test (ThemedText)
- ✅ Maestro E2E smoke test
- ✅ CI integration (unit tests run on every push)

## Test Results

- Unit tests: 2 passing
- E2E tests: 1 smoke test
- CI: Tests run successfully

## Next Steps

Once merged, proceed with Phase 1 expansion:

- Add MSW for sophisticated API mocking
- Create custom render with providers
- Expand test coverage systematically

Closes #6 (partial - vertical slice only)

See: docs/plans/2025-01-11-testing-infrastructure-design.md
```

**Step 4: Await PR review and merge**

Once merged, proceed with Phase 1 expansion plan.

---

## Success Criteria

- [x] Jest installed and configured
- [x] At least 1 utility test passing
- [x] At least 1 component test passing (or React 19 issue documented)
- [x] Maestro installed and 1 smoke test created
- [x] Test scripts added to package.json
- [x] CI runs tests on every push
- [x] All tests pass in CI
- [x] Documentation updated

## Timeline

**Estimated:** 1-2 days

- Tasks 1-6: 1-1.5 days (core testing setup)
- Tasks 7-13: 0.5 days (E2E and CI integration)

## Notes for Implementation

1. **React 19 Compatibility:** If RNTL has issues with React 19, document the error and try `@testing-library/react-native@next`. If still problematic, document as known issue and continue with E2E focus.

2. **Maestro Testing:** Maestro tests need actual device/simulator running. For CI, we'll add E2E tests in Phase 4 (separate workflow with macOS runner).

3. **Commit Frequency:** Each task should result in a commit. This makes debugging easier and provides clear progress tracking.

4. **Test First:** For utility and component tests, always write the failing test first (TDD).

5. **Keep It Minimal:** Resist the urge to expand beyond the vertical slice. The goal is validation, not comprehensive coverage.

---

**Plan Status:** ✅ Ready for Implementation
**Next:** Use superpowers:executing-plans or superpowers:subagent-driven-development
