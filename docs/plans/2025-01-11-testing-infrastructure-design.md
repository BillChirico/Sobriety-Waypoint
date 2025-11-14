# Testing Infrastructure Implementation Design

**Date:** 2025-01-11
**Issue:** #6 - Implement Comprehensive Unit and End-to-End Testing
**Approach:** Vertical Slice with Full Expansion
**Timeline:** 14-18 days (1-2 days validation + 12-16 days expansion)

## Overview

This design implements comprehensive testing infrastructure for the Sobriety Waypoint application using a vertical slice approach. We'll first validate the entire testing stack works (1-2 days), then systematically expand coverage across all phases (12-16 days).

## Strategy Rationale

### Why Vertical Slice?

**Solo Implementation Context:**

- Validates entire stack early (Jest + RNTL + Maestro + CI)
- Discovers blockers before heavy investment
- Provides fast feedback on React 19 compatibility
- Allows course correction if needed

**Risk Mitigation:**
The project uses React 19 (bleeding edge), which may have compatibility issues with React Native Testing Library. The vertical slice discovers this within 1-2 days rather than after writing 100+ tests.

## Vertical Slice (Days 1-2)

### Goal

Prove the entire testing stack works with minimal implementation.

### Deliverables

**1. Jest Setup**

- Install packages: `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`
- Create `jest.config.js` with jest-expo preset
- Configure path aliases and transformIgnorePatterns
- Create `__tests__/setup.ts` for global test setup

**2. Minimal Test Infrastructure**

```
__tests__/
  setup.ts                    # Global setup, import jest-native matchers
  lib/
    validation.test.ts        # Simple utility test
  components/
    Button.test.tsx           # Simple component test
__mocks__/
  @/lib/supabase.ts          # Mock Supabase client
  expo-router.ts              # Mock Expo Router
  expo-secure-store.ts        # Mock SecureStore
```

**3. Example Tests**

_Utility Test (simplest):_

```typescript
describe('validation utilities', () => {
  it('should validate email format', () => {
    const validEmail = 'user@example.com';
    expect(validEmail).toContain('@');
  });
});
```

_Component Test:_

```typescript
import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button title="Click Me" />);
    expect(screen.getByText('Click Me')).toBeOnTheScreen();
  });
});
```

**4. Maestro E2E Setup**

- Install Maestro CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Create `.maestro/flows/00-smoke-test.yaml`:

```yaml
appId: com.billchirico.twelvesteptracker
---
- launchApp
- assertVisible: 'Login'
```

**5. Package.json Scripts**

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:ci": "jest --ci --maxWorkers=2"
}
```

**6. CI Integration**
Add test job to `.github/workflows/ci.yml`:

```yaml
test:
  name: Unit Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - uses: pnpm/action-setup@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm test:ci
```

Update build jobs to depend on tests:

```yaml
build-web:
  needs: [lint, test] # Add 'test' dependency
```

### Success Criteria

- ✅ Jest runs and passes utility test
- ✅ React Native Testing Library renders component successfully
- ✅ Maestro launches app and validates login screen
- ✅ CI runs tests on push
- ✅ No React 19 compatibility blockers (or documented workarounds)

### Known Risks

**Risk 1: React 19 + RNTL Compatibility**

- _Probability:_ Medium-High
- _Impact:_ Blocks component testing
- _Mitigation:_ Discovered immediately in vertical slice
- _Fallback:_ Use `@testing-library/react-native@next` or `react-test-renderer`

**Risk 2: Maestro Setup Issues**

- _Probability:_ Low-Medium
- _Impact:_ Delays E2E testing
- _Mitigation:_ Good documentation, active community
- _Fallback:_ Defer E2E to later, focus on unit tests first

## Post-Vertical-Slice Expansion

Once the vertical slice validates (1-2 days), expand systematically:

### Phase 1: Complete Unit Test Infrastructure (Days 3-5)

**Goal:** Build robust foundation for all testing

**Add MSW for API Mocking:**

```bash
pnpm add -D msw @mswjs/interceptors
```

**Create:**

- `mocks/server.ts` - MSW server setup for Node environment
- `mocks/handlers/` - REST API handlers for Supabase endpoints
  - `auth.ts` - Authentication endpoints
  - `profiles.ts` - Profile CRUD operations
  - `tasks.ts` - Task management
  - `messages.ts` - Messaging endpoints
- `test-utils/render.tsx` - Custom render with providers:
  ```typescript
  export function renderWithProviders(
    ui: React.ReactElement,
    { initialAuth, initialTheme, ...options } = {}
  ) {
    return render(
      <AuthProvider initialValue={initialAuth}>
        <ThemeProvider initialTheme={initialTheme}>
          {ui}
        </ThemeProvider>
      </AuthProvider>,
      options
    );
  }
  ```
- `test-utils/fixtures/` - Test data fixtures
  - `users.ts` - Mock user data
  - `profiles.ts` - Mock profile data
  - `tasks.ts` - Mock task data
  - `messages.ts` - Mock message data

**Update Jest Configuration:**

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
```

**Comprehensive Platform Mocks:**

- expo-camera
- expo-haptics
- expo-linking
- @react-native-async-storage/async-storage
- react-native-reanimated

**Deliverables:**

- MSW server with all Supabase endpoints mocked
- Custom render function for components with context
- Fixture library for consistent test data
- 80% coverage thresholds configured
- Complete platform-specific mocks

### Phase 2: Component Testing (Days 6-9)

**Goal:** Test all critical components with user behavior focus

**Priority Order:**

1. **Context Providers (Day 6)**
   - `AuthContext.test.tsx`
     - Sign in/up/out methods
     - Session persistence
     - Profile loading
     - Error handling
   - `ThemeContext.test.tsx`
     - Theme switching (light/dark/system)
     - Theme persistence
     - Color scheme updates

2. **Authentication Screens (Day 7)**
   - `login.test.tsx`
     - Form rendering
     - Input validation
     - Submit handling
     - Loading states
     - Google OAuth button
   - `signup.test.tsx`
     - Password confirmation
     - Validation errors
     - Account creation flow
   - `onboarding.test.tsx`
     - Role selection
     - Profile completion
     - Navigation after completion

3. **Tab Screens (Days 8-9)**
   - `index.test.tsx` (Home/Dashboard)
     - Renders dashboard
     - Shows role-specific content
     - Loading states
   - `tasks.test.tsx`
     - Displays task list
     - Creates tasks (sponsor)
     - Completes tasks (sponsee)
     - Filters by status
   - `messages.test.tsx`
     - Displays messages
     - Sends messages
     - Real-time updates (mocked)
   - `steps.test.tsx`
     - Displays recovery steps
     - Shows step content
     - Tracks progress
   - `profile.test.tsx`
     - Displays profile
     - Edits profile
     - Theme settings
     - Sign out

4. **Reusable Components (Day 9)**
   - Test all components in `components/`
   - Button variants and states
   - Input fields with validation
   - Cards and lists
   - Modals and overlays
   - Loading/error states

**Testing Patterns:**

- Use custom `renderWithProviders` for screens
- Test user interactions with `fireEvent` and `userEvent`
- Mock navigation with `useRouter` mock
- Assert accessibility (labels, roles, hints)

**Deliverables:**

- All critical components have tests
- 80%+ coverage for components, contexts, and screens
- Consistent testing patterns documented in test files

### Phase 3: Integration Testing (Days 10-12)

**Goal:** Test complete user workflows with realistic API interactions

**Test Workflows:**

1. **Sponsor-Sponsee Relationship Flow**

   ```typescript
   describe('Relationship establishment', () => {
     it('should create and accept invitation', async () => {
       // Sponsor creates invite
       // Sponsee uses invite code
       // Relationship established
       // Both users see connection
     });
   });
   ```

2. **Task Management Flow**
   - Sponsor assigns task
   - Sponsee receives notification
   - Sponsee completes task
   - Sponsor sees completion

3. **Messaging Flow**
   - Send message
   - Receive message
   - Message history displays

4. **Step Progression Flow**
   - Complete step
   - Unlock next step
   - Progress updates

**Error Scenario Testing:**

1. **Network Errors**
   - MSW returns 500 errors
   - Timeout errors
   - Offline mode

2. **Authentication Errors**
   - Invalid credentials
   - Expired session
   - Unauthorized access

3. **Validation Errors**
   - Invalid input
   - Missing required fields
   - Database constraint violations

**Deliverables:**

- All critical user workflows have integration tests
- Error scenarios comprehensively tested
- MSW handlers cover all Supabase operations

### Phase 4: E2E Testing with Maestro (Days 13-16)

**Goal:** Automate critical user journeys on real devices/simulators

**Maestro Flow Creation:**

1. **01-authentication.yaml**

   ```yaml
   appId: com.billchirico.twelvesteptracker
   ---
   - launchApp
   - tapOn: 'Sign Up'
   - tapOn: 'Email'
   - inputText: 'test@example.com'
   - tapOn: 'Password'
   - inputText: 'SecurePass123!'
   - tapOn: 'Confirm Password'
   - inputText: 'SecurePass123!'
   - tapOn: 'Sign Up'
   - assertVisible: 'Onboarding'
   ```

2. **02-onboarding.yaml**
   - New user completes onboarding
   - Selects role
   - Sees appropriate home screen

3. **03-sponsor-flow.yaml**
   - Sign in as sponsor
   - Create invite code
   - Navigate to sponsees
   - Assign task
   - Send message

4. **04-sponsee-flow.yaml**
   - Sign in as sponsee
   - Use invite code
   - View tasks
   - Complete task
   - Reply to message

5. **05-step-progression.yaml**
   - View steps
   - Read step content
   - Complete step
   - Track progress

6. **06-profile-management.yaml**
   - Edit profile
   - Change theme
   - Update sobriety date

7. **07-task-management.yaml**
   - Create task
   - Edit task
   - Complete task
   - Delete task

8. **08-messaging.yaml**
   - Open messages
   - Send message
   - View history

**Test Data Setup:**

- Create dedicated test accounts in Supabase
- Use RLS to isolate test data
- Document test credentials in `.maestro/README.md`
- Create setup/teardown scripts if needed

**Local Testing Commands:**

```bash
# Run all flows
pnpm maestro

# Run specific flow
maestro test .maestro/flows/01-authentication.yaml

# Record new flow
maestro record

# Debug flow
maestro test --debug .maestro/flows/01-authentication.yaml
```

**Deliverables:**

- 8 comprehensive E2E flows covering critical paths
- Test accounts and data documented
- Flows pass consistently on iOS and Android
- Maestro integrated into development workflow

### Phase 5: Complete CI/CD Integration (Days 17-18)

**Goal:** Automate all testing in CI pipeline

**Add Coverage Reporting:**

Update test job in `.github/workflows/ci.yml`:

```yaml
test:
  name: Unit Tests
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - uses: pnpm/action-setup@v4
      with:
        version: 8
    - run: pnpm install --frozen-lockfile

    - name: Run tests with coverage
      run: pnpm test:ci --coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        files: ./coverage/coverage-final.json
        token: ${{ secrets.CODECOV_TOKEN }}

    - name: Upload coverage artifacts
      uses: actions/upload-artifact@v4
      with:
        name: coverage-report
        path: coverage/
        retention-days: 7
```

**Add E2E Tests Workflow:**

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  e2e-ios:
    name: E2E Tests (iOS)
    runs-on: macos-14
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: pnpm/action-setup@v4
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash

      - name: Add Maestro to PATH
        run: echo "$HOME/.maestro/bin" >> $GITHUB_PATH

      - name: Start Expo
        run: |
          pnpm dev &
          echo $! > expo.pid

      - name: Wait for Expo to be ready
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8081; do sleep 2; done'

      - name: Run Maestro tests
        run: maestro test .maestro/flows

      - name: Stop Expo
        if: always()
        run: |
          if [ -f expo.pid ]; then
            kill $(cat expo.pid) || true
          fi

      - name: Upload Maestro results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: maestro-results
          path: |
            ~/.maestro/tests/**/*
            maestro-logs/
          retention-days: 7
```

**Update package.json:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --maxWorkers=2",
    "test:coverage": "jest --coverage",
    "maestro": "maestro test .maestro/flows",
    "maestro:record": "maestro record"
  }
}
```

**Configure Branch Protection:**

- Require "Unit Tests" to pass
- Require "E2E Tests (iOS)" to pass
- Require 80% code coverage
- Require 1 approval before merge

**Setup Codecov:**

1. Create account at codecov.io
2. Add repository
3. Get token
4. Add `CODECOV_TOKEN` to GitHub secrets
5. Create `codecov.yml`:
   ```yaml
   coverage:
     status:
       project:
         default:
           target: 80%
           threshold: 2%
       patch:
         default:
           target: 80%
   ```

**Deliverables:**

- Unit tests run on every push/PR
- Coverage reported to Codecov
- E2E tests run on every push/PR (macOS runner)
- Branch protection enforces test requirements
- Test artifacts uploaded for debugging

### Phase 6: Documentation and Templates (Day 18)

**Goal:** Comprehensive testing documentation and templates

**Create docs/TESTING.md:**

```markdown
# Testing Guide

## Overview

This project uses Jest for unit/integration tests and Maestro for E2E tests.

## Running Tests

### Unit Tests

- `pnpm test` - Run all tests
- `pnpm test:watch` - Watch mode for development
- `pnpm test:coverage` - Generate coverage report

### E2E Tests

- `pnpm maestro` - Run all Maestro flows
- `maestro test .maestro/flows/01-authentication.yaml` - Run specific flow
- `pnpm maestro:record` - Record new flow interactively

## Writing Tests

### Unit Tests

[Detailed patterns with examples]

### Component Tests

[Custom render usage, provider setup, user event testing]

### Integration Tests

[MSW setup, fixture usage, workflow testing]

### E2E Tests

[Maestro YAML syntax, test data, best practices]

## Test Structure

[Directory organization, naming conventions]

## Mocking Strategy

[Module mocks vs MSW, when to use each]

## CI/CD

[How tests run in CI, coverage requirements]

## Troubleshooting

[Common issues and solutions]
```

**Create Test Templates:**

1. `docs/templates/component.test.template.tsx`
2. `docs/templates/hook.test.template.ts`
3. `docs/templates/integration.test.template.tsx`
4. `docs/templates/maestro-flow.template.yaml`

**Update Project Documentation:**

1. **README.md** - Add Testing section:

   ```markdown
   ## Testing

   [![Tests](https://github.com/BillChirico/12-Step-Tracker/workflows/CI/badge.svg)](https://github.com/BillChirico/12-Step-Tracker/actions)
   [![Coverage](https://codecov.io/gh/BillChirico/12-Step-Tracker/branch/main/graph/badge.svg)](https://codecov.io/gh/BillChirico/12-Step-Tracker)

   See [TESTING.md](docs/TESTING.md) for comprehensive testing guide.
   ```

2. **CLAUDE.md** - Add Testing section:

   ```markdown
   ## Testing Guidelines

   - Write tests for all new features
   - Maintain 80% code coverage
   - Use custom render for components with context
   - Mock Supabase with MSW for integration tests
   - Add E2E tests for critical user flows
   ```

3. **docs/CONTRIBUTING.md** - Update with testing requirements:

   ```markdown
   ## Testing Requirements

   All PRs must:

   - Include tests for new features/fixes
   - Maintain or improve code coverage (80% minimum)
   - Pass all unit and E2E tests
   - Follow testing patterns documented in TESTING.md
   ```

**Deliverables:**

- Comprehensive TESTING.md guide
- Test templates for all test types
- Updated project documentation
- Testing requirements in CONTRIBUTING.md

## Timeline Summary

| Phase          | Duration       | Focus                        |
| -------------- | -------------- | ---------------------------- |
| Vertical Slice | 1-2 days       | Validate entire stack        |
| Phase 1        | 2-3 days       | Complete test infrastructure |
| Phase 2        | 3-4 days       | Component testing            |
| Phase 3        | 2-3 days       | Integration testing          |
| Phase 4        | 3-4 days       | E2E testing with Maestro     |
| Phase 5        | 1-2 days       | Complete CI/CD integration   |
| Phase 6        | 1-2 days       | Documentation and templates  |
| **Total**      | **14-18 days** | Full implementation          |

## Success Metrics

- ✅ Unit test coverage ≥ 80%
- ✅ All critical user flows have E2E tests
- ✅ CI runs all tests on every PR
- ✅ Tests run in < 5 minutes locally
- ✅ Zero flaky tests
- ✅ Documentation complete and clear
- ✅ Consistent testing patterns across codebase

## Risk Mitigation Summary

| Risk                        | Mitigation                                                      |
| --------------------------- | --------------------------------------------------------------- |
| React 19 compatibility      | Vertical slice discovers early, fallback to react-test-renderer |
| Maestro setup issues        | Good docs, active community, can defer to CI-only               |
| CI timeout/performance      | Start simple, add parallelization if needed                     |
| Supabase mocking complexity | Start with module mocks, add MSW gradually                      |
| Timeline optimism           | Vertical slice reveals actual pace, can de-scope if needed      |

## Memory Keeper Integration

Throughout implementation:

- Create context session: `context_session_start` with project directory
- Save architectural decisions: `context_save` for key choices
- Create checkpoints: `context_checkpoint` before major changes
- Track findings: Document React 19 compatibility results, Maestro setup notes

## Implementation Notes

### React 19 Compatibility

If RNTL doesn't support React 19:

1. Try `@testing-library/react-native@next`
2. Check RNTL GitHub for React 19 support status
3. Fallback to `react-test-renderer` if needed
4. Document workaround in TESTING.md

### Maestro Best Practices

- Use `assertVisible` instead of hardcoded waits
- Add `testID` props to components for reliable selection
- Keep flows focused (one user journey per flow)
- Use YAML anchors for repeated steps

### MSW Best Practices

- Start with happy path handlers
- Add error scenarios gradually
- Use fixtures for consistent data
- Reset handlers between tests

## Next Steps After Design Approval

1. **Setup Git Worktree** (using `superpowers:using-git-worktrees`)
   - Create isolated workspace for testing implementation
   - Branch: `feature/testing-infrastructure`

2. **Create Implementation Plan** (using `superpowers:writing-plans`)
   - Break vertical slice into detailed tasks
   - Bite-sized tasks with exact file paths
   - Complete code examples for each change

3. **Begin Vertical Slice Implementation**
   - Follow plan systematically
   - Validate each step before proceeding
   - Document findings in memory keeper

---

**Design Status:** ✅ Validated and Ready for Implementation
**Next Action:** Await approval to proceed with git worktree setup and implementation planning
