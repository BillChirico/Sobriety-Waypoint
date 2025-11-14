# Maestro E2E Complete Test Suite Design

**Issue**: #29
**Date**: 2025-11-13
**Status**: Design Complete - Ready for Implementation
**Estimated Effort**: 7 weeks

## Overview

This design document outlines the complete implementation of GitHub Issue #29: a comprehensive end-to-end (E2E) test suite using Maestro for the Sobriety Waypoint app. The goal is to achieve 100% feature coverage with 36+ well-designed test flows covering all user journeys, features, and edge cases.

## Background

**Current State:**

- 21 high-quality Maestro test flows already exist
- Tests cover core functionality and advanced workflows
- Good testID usage in existing flows
- No config.yaml, shared subflows, or CI/CD integration

**Requirements from Issue #29:**

- 60+ comprehensive test scenarios
- Tag-based execution strategy
- Reusable subflows to reduce duplication
- testID props on all interactive components
- CI/CD integration with GitHub Actions
- Maestro Cloud setup for parallel execution
- Complete documentation

## Design Section 1: Foundation & Architecture

### Current State Analysis

✅ **Strengths:**

- 21 high-quality test flows covering core features
- Good testID usage in flows (login-email-input, signup-password-input, etc.)
- Comprehensive coverage of existing features

❌ **Gaps:**

- No config.yaml for tags and execution order
- No shared/ directory with reusable subflows (login logic repeated in each flow)
- No .env.test for centralized test data management
- Missing comprehensive testID audit across all app components

### Proposed Architecture

```
.maestro/
├── config.yaml                    # NEW: Tags, execution order, suite config
├── .env.test                      # NEW: Test credentials (gitignored)
├── TEST_ACCOUNTS.md              # NEW: Test account documentation (gitignored)
├── CONTRIBUTING.md               # NEW: Test writing guidelines
├── flows/
│   ├── 00-smoke-test.yaml        # EXISTING: Keep as is
│   ├── 01-authentication.yaml    # EXISTING: Keep as is
│   ├── 02-onboarding.yaml        # EXISTING: Keep as is
│   ├── 03-sponsor-flow.yaml      # EXISTING: Keep as is
│   ├── 04-sponsee-flow.yaml      # EXISTING: Keep as is
│   ├── 05-20*.yaml              # EXISTING: Keep all 21 flows
│   ├── auth/                     # NEW: Additional auth tests
│   │   ├── google-oauth.yaml
│   │   └── facebook-oauth.yaml
│   ├── features/                 # NEW: Feature-specific tests
│   │   ├── home/
│   │   │   ├── dashboard-overview.yaml
│   │   │   ├── quick-actions.yaml
│   │   │   └── notifications.yaml
│   │   ├── manage-tasks/
│   │   │   ├── create-task.yaml
│   │   │   ├── edit-task.yaml
│   │   │   ├── delete-task.yaml
│   │   │   └── bulk-operations.yaml
│   │   └── invite-codes/
│   │       ├── generate-invite-code.yaml
│   │       ├── use-invite-code.yaml
│   │       └── invite-code-expiry.yaml
│   ├── platform-specific/        # NEW: Platform tests
│   │   ├── ios-specific.yaml
│   │   ├── android-specific.yaml
│   │   └── web-specific.yaml
│   └── shared/                   # NEW: Reusable subflows
│       ├── _login-as-sponsee.yaml
│       ├── _login-as-sponsor.yaml
│       ├── _setup-test-data.yaml
│       └── _cleanup-test-data.yaml
└── README.md                     # UPDATED: Complete documentation
```

### Key Design Decisions

1. **Incremental Migration**: Keep existing 21 flows working while adding new structure (backward compatible)
2. **Tag-Based Execution**: Use config.yaml tags (smoke, critical, auth, sponsee, sponsor, features, full)
3. **Shared Subflows**: Extract repeated login/setup logic to reduce duplication and improve maintainability
4. **Environment-Based Config**: Use .env.test for sensitive data, never hardcode credentials
5. **Parallel Structure**: New tests go in subdirectories, existing tests stay at root level for compatibility

## Design Section 2: Test Organization & Tagging Strategy

### Tag System Design

The config.yaml will define tags for selective test execution based on use case:

```yaml
# .maestro/config.yaml
includeTags:
  - smoke
  - critical
  - auth
  - sponsee
  - sponsor
  - features
  - full

flows:
  # Smoke tests - <1 minute
  - file: flows/00-smoke-test.yaml
    tags: [smoke, critical, full]

  # Core authentication - existing
  - file: flows/01-authentication.yaml
    tags: [auth, critical, full]
  - file: flows/02-onboarding.yaml
    tags: [auth, critical, full]

  # New OAuth tests
  - file: flows/auth/google-oauth.yaml
    tags: [auth, full]
  - file: flows/auth/facebook-oauth.yaml
    tags: [auth, full]

  # Core user journeys
  - file: flows/03-sponsor-flow.yaml
    tags: [sponsor, critical, full]
  - file: flows/04-sponsee-flow.yaml
    tags: [sponsee, critical, full]

  # Feature tests
  - file: flows/features/home/*.yaml
    tags: [features, full]
  - file: flows/features/manage-tasks/*.yaml
    tags: [sponsor, features, full]
  - file: flows/features/invite-codes/*.yaml
    tags: [sponsor, features, full]

  # All existing advanced flows (05-20)
  - file: flows/05-task-management.yaml
    tags: [sponsee, features, full]
  # ... (all other existing flows)

  # Platform-specific
  - file: flows/platform-specific/*.yaml
    tags: [platform, full]
```

### Execution Strategy by Environment

| Environment           | Tests Run        | Duration   | Trigger                  | Tags Used                           |
| --------------------- | ---------------- | ---------- | ------------------------ | ----------------------------------- |
| **Local Development** | smoke            | <1 min     | Developer choice         | `--tag smoke`                       |
| **PR Checks**         | smoke + critical | ~6 min     | Every PR                 | `--tag critical`                    |
| **Nightly Builds**    | full             | ~45 min    | Scheduled (develop/main) | `--tag full`                        |
| **Pre-Release**       | full             | ~45 min    | Manual before production | `--tag full`                        |
| **Feature Testing**   | specific         | ~10-20 min | Developer choice         | `--tag sponsee` or `--tag features` |

### Test Numbering Convention

- `00-09`: Core smoke and authentication tests (root level)
- `10-20`: Advanced workflows and features (root level)
- `auth/`, `features/`, etc.: Organized by category (no numbers needed in subdirectories)

### Shared Subflow Design

Reusable flows will use underscore prefix (`_`) and accept environment variables:

```yaml
# shared/_login-as-sponsor.yaml
# Reusable subflow for sponsor login
# Environment variables required: SPONSOR_EMAIL, SPONSOR_PASSWORD

appId: com.volvoxllc.twelvesteptracker

---
- assertVisible: 'Login'

- tapOn:
    id: 'login-email-input'
- inputText: '${SPONSOR_EMAIL}'

- tapOn:
    id: 'login-password-input'
- inputText: '${SPONSOR_PASSWORD}'

- tapOn: 'Sign In'

- extendedWaitUntil:
    visible:
      text: 'Dashboard'
    timeout: 10000
```

**Usage in other flows:**

```yaml
# Any test that needs sponsor login
- runFlow: shared/_login-as-sponsor.yaml
  env:
    SPONSOR_EMAIL: e2e.sponsor@twelvesteptracker.app
    SPONSOR_PASSWORD: TestPassword123!
```

## Design Section 3: Gap Analysis & Missing Tests

### Current Coverage (21 flows)

✅ **Already Covered:**

- Authentication (partial - has signup, login, logout)
- Onboarding (complete)
- Sponsee journey (complete)
- Sponsor journey (complete)
- Task management (sponsee side - complete)
- Messaging (complete)
- Step progression (complete)
- Profile management (complete)
- Relapse tracking (complete)
- Journey/milestones (complete)
- Theme/dark mode (complete)
- Error handling (complete)
- Accessibility (complete)
- Performance (complete)

### Missing Tests (15 new flows needed)

#### 1. Authentication Gaps (2 flows)

**`auth/google-oauth.yaml`** - Google OAuth Flow

- Test web OAuth flow (redirect-based)
- Test native OAuth flow (expo-auth-session)
- Verify auto-profile creation
- Test redirect to onboarding for new users

**`auth/facebook-oauth.yaml`** - Facebook Sign In Flow

- Test web OAuth flow
- Test native flow (expo-facebook)
- Verify profile creation with Facebook data
- Test error handling (cancelled, denied permissions)

#### 2. Home/Dashboard Features (3 flows)

**`features/home/dashboard-overview.yaml`** - Dashboard Overview

- Verify welcome message displays user name
- Check quick stats (days sober, steps completed, tasks pending)
- Verify recent activity feed displays
- Check sponsor/sponsee connection info
- Test empty state handling (new users)

**`features/home/quick-actions.yaml`** - Quick Action Shortcuts

- Test "View Steps" quick action navigation
- Test "Check Tasks" quick action navigation
- Test "View Journey" quick action navigation
- Verify proper tab switching

**`features/home/notifications.yaml`** - Notification Management

- View notification list
- Mark individual notification as read
- Tap notification to navigate to related content
- Clear all notifications
- Test empty state

#### 3. Sponsor Manage Tasks (4 flows)

**`features/manage-tasks/create-task.yaml`** - Create Task

- Navigate to Manage Tasks tab
- Open create task form
- Fill title, description, select sponsee, set due date, assign step
- Submit and verify task appears in list
- Test validation (empty fields, invalid dates)

**`features/manage-tasks/edit-task.yaml`** - Edit Task

- Select existing task from list
- Modify details (title, description, due date, reassign)
- Save changes
- Verify updates reflected

**`features/manage-tasks/delete-task.yaml`** - Delete Task

- Select task from list
- Tap delete
- Confirm deletion dialog
- Verify task removed from list

**`features/manage-tasks/bulk-operations.yaml`** - Bulk Task Operations

- Multi-select tasks (checkboxes)
- Bulk assign to different sponsee
- Bulk delete with confirmation
- Bulk status update

#### 4. Invite Code System (3 flows)

**`features/invite-codes/generate-invite-code.yaml`** - Generate Invite Code

- Navigate to Profile → Invite Code section
- Tap "Generate Code"
- Verify code displayed
- Copy code to clipboard
- View active codes list

**`features/invite-codes/use-invite-code.yaml`** - Use Invite Code

- Login as sponsee
- Navigate to Profile → Connect with Sponsor
- Enter valid invite code
- Submit and establish connection
- Verify sponsor appears in profile

**`features/invite-codes/invite-code-expiry.yaml`** - Expired Code Handling

- Generate code with short expiry (or use pre-expired test code)
- Attempt to use expired code
- Verify error message
- Request new code from sponsor

#### 5. Platform-Specific Tests (3 flows)

**`platform-specific/ios-specific.yaml`** - iOS Platform Tests

- Test deep linking (12stepstracker:// scheme)
- Test iOS permissions (notifications, camera for profile photo)
- Verify native navigation patterns
- Test SecureStore integration
- Test iOS-specific UI elements

**`platform-specific/android-specific.yaml`** - Android Platform Tests

- Test Android back button behavior (navigation stack)
- Test Android permissions (notifications, storage)
- Verify app resumption after background
- Test storage integration
- Test Android-specific UI patterns

**`platform-specific/web-specific.yaml`** - Web Platform Tests

- Test browser navigation (back/forward buttons)
- Verify localStorage fallback (no SecureStore)
- Test responsive layouts (mobile, tablet, desktop widths)
- Test keyboard navigation (tab, enter)
- Verify web-specific UI adjustments

### Total Test Count

- **Existing**: 21 flows
- **New**: 15 flows (2 auth + 3 home + 4 manage-tasks + 3 invite-codes + 3 platform)
- **Total**: 36 comprehensive flows

**Note**: Each flow contains multiple test scenarios (assertions, validations, error cases), so 36 flows easily exceeds 60+ test scenarios as required by Issue #29.

## Design Section 4: CI/CD Integration Strategy

### GitHub Actions Workflow Design

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *' # Nightly at 2 AM UTC
  workflow_dispatch:
    inputs:
      tag:
        description: 'Test tag to run (smoke, critical, full)'
        required: false
        default: 'critical'

concurrency:
  group: e2e-${{ github.ref }}
  cancel-in-progress: true

jobs:
  smoke-and-critical:
    name: E2E Tests - Smoke & Critical
    if: github.event_name == 'pull_request' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    timeout-minutes: 15

    strategy:
      fail-fast: false
      matrix:
        platform: [ios, android]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build app with EAS
        run: |
          eas build --platform ${{ matrix.platform }} \
            --profile preview \
            --non-interactive \
            --wait

      - name: Install Maestro CLI
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> $GITHUB_PATH

      - name: Run smoke tests
        run: maestro test .maestro/flows --tag smoke

      - name: Run critical tests
        run: maestro test .maestro/flows --tag critical

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.platform }}
          path: |
            ~/.maestro/tests/
            .maestro/screenshots/
          retention-days: 7

      - name: Comment PR with results
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            // Read test results and post comment
            // (Implementation details omitted for brevity)

  full-suite:
    name: E2E Tests - Full Suite
    if: github.event_name == 'push' || github.event_name == 'schedule'
    runs-on: ubuntu-latest
    timeout-minutes: 60

    strategy:
      fail-fast: false
      matrix:
        platform: [ios, android, web]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build app with EAS
        run: |
          eas build --platform ${{ matrix.platform }} \
            --profile preview \
            --non-interactive \
            --wait

      - name: Install Maestro CLI
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> $GITHUB_PATH

      - name: Run full test suite
        run: maestro test .maestro/flows --tag full

      - name: Upload test results and screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: full-test-results-${{ matrix.platform }}
          path: |
            ~/.maestro/tests/
            .maestro/screenshots/
          retention-days: 30

      - name: Notify on failures
        if: failure()
        run: |
          # Send notification to Slack/email
          # (Implementation details omitted)
```

### Maestro Cloud Integration

For parallel execution and real device testing:

```bash
# Install Maestro Cloud CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Authenticate with Maestro Cloud
maestro cloud login

# Run tests on Maestro Cloud (parallel across devices)
maestro cloud \
  --app app.apk \
  --flows .maestro/flows \
  --tag critical \
  --devices "iPhone 15,Pixel 8,iPad Pro" \
  --async
```

**Maestro Cloud Benefits:**

- Parallel execution across multiple devices (3x+ faster)
- Real device testing (not just simulators/emulators)
- Automatic screenshot/video recordings on failures
- Test result dashboard with historical trends
- No need to maintain CI runner infrastructure

**Integration in CI:**

```yaml
# Modified CI step using Maestro Cloud
- name: Run tests on Maestro Cloud
  env:
    MAESTRO_CLOUD_API_KEY: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
  run: |
    maestro cloud \
      --app build/app.apk \
      --flows .maestro/flows \
      --tag critical \
      --devices "iPhone 15,Pixel 8" \
      --format junit \
      --output test-results.xml
```

### Test Execution Strategy

| Environment        | Tests            | Duration | Trigger   | Devices                          |
| ------------------ | ---------------- | -------- | --------- | -------------------------------- |
| **PR Checks**      | smoke + critical | ~6 min   | Every PR  | iOS Simulator + Android Emulator |
| **Nightly Builds** | full             | ~45 min  | Scheduled | iPhone 15, Pixel 8, iPad Pro     |
| **Pre-Release**    | full             | ~45 min  | Manual    | Real devices via Maestro Cloud   |
| **Local Dev**      | smoke            | <1 min   | Developer | Local simulator                  |

### Test Result Reporting

1. **JUnit XML Output**: For GitHub test reporting and trends
2. **Screenshot Artifacts**: Auto-captured on failures, uploaded as GitHub artifacts
3. **PR Comments**: Automated comment with test summary and failure details
4. **Maestro Cloud Dashboard**: Historical trends, flaky test detection
5. **Slack Notifications**: On nightly build failures

### Required GitHub Secrets

Add these to repository settings (Settings → Secrets and variables → Actions):

- `EXPO_TOKEN`: Existing (for EAS builds)
- `EXPO_PUBLIC_SUPABASE_URL`: Existing
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Existing
- `MAESTRO_CLOUD_API_KEY`: **NEW** - For Maestro Cloud integration

## Design Section 5: Documentation & Maintenance

### Documentation Updates Needed

#### 1. .maestro/README.md Enhancements

**Add sections:**

- Configuration section explaining config.yaml tags
- Shared subflow documentation with examples
- Expanded troubleshooting guide
- CI/CD integration documentation
- Test writing best practices
- Test data setup guide with scripts

**Structure:**

```markdown
# Maestro E2E Tests

## Quick Start

[Existing content]

## Configuration

### Tags and Selective Execution

[How to use config.yaml tags]

### Shared Subflows

[How to create and use reusable flows]

## Test Organization

[Directory structure explanation]

## Running Tests

### Locally

[Existing content enhanced]

### In CI/CD

[How tests run in GitHub Actions]

## Test Data Management

### Test Accounts

[Reference to TEST_ACCOUNTS.md]

### Setup and Cleanup

[Scripts and procedures]

## Writing New Tests

[Quick guide with reference to CONTRIBUTING.md]

## Troubleshooting

[Expanded with common issues]

## Test Coverage Matrix

[Enhanced with new tests]
```

#### 2. .maestro/TEST_ACCOUNTS.md (NEW - Gitignored)

````markdown
# Test Accounts

⚠️ **CONFIDENTIAL - DO NOT COMMIT THIS FILE** ⚠️

This file is gitignored. It contains test account credentials for E2E testing.

## Supabase Test Environment

- **URL**: https://your-test-project.supabase.co
- **Anon Key**: Stored in `.env.test`

## Test Account Credentials

All accounts use password: `TestPassword123!`

| Email                                | Role    | Purpose            | Setup Required               |
| ------------------------------------ | ------- | ------------------ | ---------------------------- |
| e2e.sponsor@twelvesteptracker.app    | Sponsor | Sponsor flow tests | Has invite codes, 2 sponsees |
| e2e.sponsee@twelvesteptracker.app    | Sponsee | Sponsee flow tests | Connected to e2e.sponsor     |
| e2e.newuser@twelvesteptracker.app    | None    | Signup/onboarding  | Clean slate (no profile)     |
| e2e.test@twelvesteptracker.app       | Both    | General tests      | Has both roles               |
| e2e.onboarding@twelvesteptracker.app | None    | Onboarding flow    | Clean slate                  |
| e2e.profile@twelvesteptracker.app    | Sponsee | Profile tests      | Complete profile data        |
| e2e.rel1@twelvesteptracker.app       | Sponsor | Relationship tests | Partner with e2e.rel2        |
| e2e.rel2@twelvesteptracker.app       | Sponsee | Relationship tests | Partner with e2e.rel1        |

## Test Data Requirements

Each test account should have:

### Sponsor Accounts

- Active invite codes (at least 1)
- Connected sponsees (1-2)
- Assigned tasks to sponsees (mix of statuses)
- Message history with sponsees

### Sponsee Accounts

- Connected to a sponsor
- Sobriety date at least 30 days in past
- 1-2 completed steps
- Assigned tasks (mix of pending, in-progress, completed)
- Message history with sponsor

### Setup Scripts

```bash
# Create and seed test accounts
pnpm maestro:setup-data

# Clean up test data
pnpm maestro:cleanup-data
```
````

## Maintenance

- **Weekly**: Verify all accounts are active and accessible
- **Monthly**: Reset passwords if needed
- **After major DB changes**: Re-seed test data

````

#### 3. .maestro/CONTRIBUTING.md (NEW - Test Writing Guidelines)

```markdown
# Contributing to E2E Tests

## Writing New Tests

### Before You Start

1. Check if similar test already exists
2. Identify which tag(s) your test belongs to
3. Determine if you need new test accounts or can use existing
4. Review existing flows for patterns and conventions

### Best Practices

#### 1. Use testID for All Interactive Elements

✅ **Good:**
```yaml
- tapOn:
    id: 'login-email-input'
````

❌ **Bad:**

```yaml
- tapOn: 'Email' # Text can change, testID is stable
```

#### 2. Add Explicit Waits for Async Operations

✅ **Good:**

```yaml
- tapOn: 'Sign In'
- extendedWaitUntil:
    visible:
      text: 'Dashboard'
    timeout: 10000
```

❌ **Bad:**

```yaml
- tapOn: 'Sign In'
- assertVisible: 'Dashboard' # May fail due to timing
```

#### 3. Assert State Changes After Every Action

✅ **Good:**

```yaml
- tapOn: 'Complete Task'
- assertVisible: 'Task completed successfully'
- assertVisible:
    id: 'task-status-completed'
```

❌ **Bad:**

```yaml
- tapOn: 'Complete Task'
# No verification - test passes even if action failed
```

#### 4. Use Shared Subflows to Reduce Duplication

✅ **Good:**

```yaml
- runFlow: shared/_login-as-sponsor.yaml
```

❌ **Bad:**

```yaml
# Copying login steps in every flow
- tapOn: { id: 'login-email-input' }
- inputText: '${SPONSOR_EMAIL}'
# ... repeated 20+ times
```

#### 5. Design Idempotent Tests

Tests should:

- Not depend on execution order
- Be able to run multiple times with same result
- Clean up after themselves or use isolated test accounts

✅ **Good:**

```yaml
# Uses unique test account that can be reset
env:
  TEST_EMAIL: e2e.isolated.test@twelvesteptracker.app
```

❌ **Bad:**

```yaml
# Modifies shared data that other tests depend on
- tapOn: 'Delete All Tasks' # Breaks other tests!
```

### Anti-Patterns to Avoid

#### ❌ Hardcoding Credentials in YAML

```yaml
# NEVER DO THIS
- inputText: 'mypassword123'
```

**Instead**: Use environment variables in .env.test

#### ❌ Relying on Test Execution Order

```yaml
# flow-1.yaml creates data
- tapOn: 'Create Task'

# flow-2.yaml assumes it exists
- assertVisible: 'Task from flow-1' # FRAGILE!
```

**Instead**: Each flow should set up its own data or use shared setup subflow

#### ❌ Using Brittle Text Selectors

```yaml
- tapOn: 'Click here to continue' # Text may change
```

**Instead**: Always use testID when available

#### ❌ Not Asserting State Changes

```yaml
- tapOn: 'Save'
# Missing: verification that save actually worked
```

**Instead**: Always verify the action succeeded

#### ❌ Creating Tests That Modify Shared Data

```yaml
# Deletes sponsor that other tests use
- tapOn: 'Delete Account'
```

**Instead**: Use isolated test accounts or cleanup/restore

### Test Template

```yaml
appId: com.volvoxllc.twelvesteptracker

# Define test-specific environment variables
env:
  TEST_EMAIL: e2e.feature@twelvesteptracker.app
  TEST_PASSWORD: TestPassword123!

---
# Feature Name: Brief Description
# Tests: Specific scenarios covered

- launchApp

# ============================================================================
# TEST SCENARIO 1: Description
# ============================================================================

- assertVisible: 'Expected Initial State'

# Perform action
- tapOn:
    id: 'specific-testid'

# Verify result
- extendedWaitUntil:
    visible:
      text: 'Expected Result'
    timeout: 5000
# ============================================================================
# TEST SCENARIO 2: Description
# ============================================================================

# ... more scenarios
```

## Adding testID to Components

When you need to add testID to a component:

```typescript
// Before
<TouchableOpacity onPress={handlePress}>
  <Text>Click Me</Text>
</TouchableOpacity>

// After
<TouchableOpacity
  testID="feature-action-button"
  onPress={handlePress}
>
  <Text>Click Me</Text>
</TouchableOpacity>
```

**Naming Convention**: `{screen}-{component}-{element}`

Examples:

- `login-email-input`
- `profile-edit-button`
- `task-create-form`
- `dashboard-quick-action-tasks`

## Submitting Your Test

1. Create test flow in appropriate directory
2. Update config.yaml with tags
3. Test locally: `maestro test .maestro/flows/your-test.yaml`
4. Verify test is idempotent (run 2-3 times)
5. Update .maestro/README.md test coverage matrix
6. Create PR with clear description of what's tested

````

#### 4. docs/TESTING.md Updates

Add comprehensive E2E Testing section:

```markdown
## E2E Testing with Maestro

### Overview

We use Maestro for end-to-end testing across iOS, Android, and Web platforms. Our test suite includes 36+ comprehensive flows covering all features, user journeys, and edge cases.

### Quick Start

#### Prerequisites

- Maestro CLI installed: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- iOS Simulator or Android Emulator running
- App installed on device/simulator

#### Running Tests Locally

```bash
# Run smoke tests (quick sanity check)
maestro test .maestro/flows --tag smoke

# Run critical tests (core user journeys)
maestro test .maestro/flows --tag critical

# Run all tests
maestro test .maestro/flows

# Run specific test
maestro test .maestro/flows/01-authentication.yaml
````

### Test Organization

Our tests are organized by feature area and use tags for selective execution:

- **smoke**: <1 minute sanity check
- **critical**: ~6 min core journeys (runs on every PR)
- **auth**: Authentication flows
- **sponsee**: Sponsee-specific features
- **sponsor**: Sponsor-specific features
- **features**: All feature tests
- **full**: Complete suite (~45 min)

See [.maestro/README.md](../.maestro/README.md) for complete documentation.

### CI/CD Integration

E2E tests run automatically in our GitHub Actions pipeline:

**On Pull Requests:**

- Smoke + critical tests (~6 minutes)
- Blocks merge if tests fail

**Nightly (Scheduled):**

- Full test suite (~45 minutes)
- Runs on develop and main branches
- Sends notifications on failures

**Pre-Release:**

- Full test suite with real devices via Maestro Cloud
- Manual trigger before production deployment

See [.github/CICD.md](../.github/CICD.md) for detailed CI/CD documentation.

### Adding New E2E Tests

When adding a new feature or modifying existing functionality:

1. **Check for existing tests**: Review `.maestro/flows/` to see if similar test exists
2. **Add testID props**: Ensure all interactive elements have `testID` props
3. **Write the test**: Follow patterns in [.maestro/CONTRIBUTING.md](../.maestro/CONTRIBUTING.md)
4. **Test locally**: Run test multiple times to verify idempotency
5. **Update config.yaml**: Add appropriate tags
6. **Update documentation**: Add test to coverage matrix in .maestro/README.md

**Test Writing Guidelines**: See [.maestro/CONTRIBUTING.md](../.maestro/CONTRIBUTING.md)

### Debugging Failed Tests

#### Common Issues

**Element Not Found:**

- Verify element has correct `testID` prop
- Check if element is visible on screen (may need to scroll)
- Use Maestro Studio for interactive debugging: `maestro studio`

**Timeout Errors:**

- Increase timeout values for slow operations
- Check network connectivity
- Verify Supabase is accessible
- Review app logs for errors

**Flaky Tests:**

- Add explicit waits for async operations
- Use `extendedWaitUntil` instead of `assertVisible` for dynamic content
- Check for race conditions in app code

#### Debugging Tools

```bash
# Interactive debugging with Maestro Studio
maestro studio

# Record a new flow interactively
maestro record

# View detailed logs
maestro test .maestro/flows/your-test.yaml --debug
```

### Test Data Management

Tests use dedicated test accounts in Supabase. See `.maestro/TEST_ACCOUNTS.md` (gitignored) for credentials.

**Setup test data:**

```bash
pnpm maestro:setup-data
```

**Cleanup test data:**

```bash
pnpm maestro:cleanup-data
```

### Best Practices

1. **Use testID**: Always prefer testID over text selectors
2. **Explicit waits**: Use `extendedWaitUntil` for async operations
3. **Assert changes**: Verify state changes after every action
4. **Idempotent**: Design tests that can run multiple times
5. **Isolated**: Don't depend on other tests or execution order
6. **Clean up**: Use isolated test accounts or cleanup subflows

For complete best practices, see [.maestro/CONTRIBUTING.md](../.maestro/CONTRIBUTING.md).

````

#### 5. .github/CICD.md Updates

Add E2E Testing section:

```markdown
## E2E Testing

### Workflow Overview

The E2E test suite runs automatically as part of our CI/CD pipeline using Maestro.

**Workflow File**: `.github/workflows/e2e-tests.yml`

### Test Execution Strategy

| Trigger | Tests Run | Duration | Platforms | Purpose |
|---------|-----------|----------|-----------|---------|
| **Pull Request** | smoke + critical | ~6 min | iOS, Android | Fast feedback, blocks merge on failure |
| **Push to main/develop** | full | ~45 min | iOS, Android, Web | Comprehensive validation |
| **Nightly (2 AM UTC)** | full | ~45 min | iOS, Android, Web | Catch regressions, verify stability |
| **Manual (workflow_dispatch)** | configurable | varies | configurable | On-demand testing |

### Job Breakdown

#### 1. smoke-and-critical (PR Checks)

**Trigger**: Pull requests, manual dispatch
**Timeout**: 15 minutes
**Matrix**: iOS, Android

**Steps:**
1. Checkout code
2. Setup Node.js with pnpm cache
3. Install dependencies
4. Setup Expo and authenticate with EAS
5. Build app with EAS (preview profile)
6. Install Maestro CLI
7. Run smoke tests (`--tag smoke`)
8. Run critical tests (`--tag critical`)
9. Upload test results as artifacts
10. Comment on PR with results

**Artifacts**: Test results and screenshots (7-day retention)

#### 2. full-suite (Nightly & Main/Develop Pushes)

**Trigger**: Push to main/develop, scheduled (nightly)
**Timeout**: 60 minutes
**Matrix**: iOS, Android, Web

**Steps:**
1. Checkout code
2. Setup Node.js with pnpm cache
3. Install dependencies
4. Setup Expo and authenticate with EAS
5. Build app with EAS (preview profile)
6. Install Maestro CLI
7. Run full test suite (`--tag full`)
8. Upload test results and screenshots
9. Notify on failures (Slack/email)

**Artifacts**: Test results and screenshots (30-day retention)

### Maestro Cloud Integration

For parallel execution and real device testing, we use Maestro Cloud on pre-release builds:

```bash
maestro cloud \
  --app build/app.apk \
  --flows .maestro/flows \
  --tag critical \
  --devices "iPhone 15,Pixel 8,iPad Pro" \
  --async
````

**Benefits:**

- Parallel execution across multiple devices (3x+ faster)
- Real device testing (more accurate than simulators)
- Automatic screenshot/video capture on failures
- Historical test results dashboard

### Required Secrets

Add these in repository settings (Settings → Secrets and variables → Actions):

- `EXPO_TOKEN` (existing): For EAS builds
- `EXPO_PUBLIC_SUPABASE_URL` (existing): Test Supabase instance
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (existing): Supabase anonymous key
- `MAESTRO_CLOUD_API_KEY` (new): For Maestro Cloud integration

### Monitoring Test Results

#### GitHub Actions

- Navigate to **Actions** tab in repository
- Select **E2E Tests** workflow
- View run details, logs, and artifacts

#### Maestro Cloud Dashboard

- Login to [Maestro Cloud](https://cloud.mobile.dev)
- View test run history
- Analyze flaky tests
- Download screenshots/videos

#### PR Comments

Failed tests automatically post comments on PRs with:

- Test summary (passed/failed counts)
- Failed test details
- Links to full logs and artifacts

### Local Development Workflow

Before pushing code:

```bash
# Quick sanity check
maestro test .maestro/flows --tag smoke

# If modifying auth or core features
maestro test .maestro/flows --tag critical
```

### Handling Test Failures

#### In CI

1. Review PR comment or workflow logs
2. Download test artifacts (screenshots, results)
3. Reproduce locally: `maestro test .maestro/flows/failed-test.yaml`
4. Fix issue in code or update test if behavior changed
5. Push fix and re-run tests

#### Flaky Tests

If a test fails intermittently:

1. Add explicit waits or increase timeouts
2. Check for race conditions in app code
3. Use `extendedWaitUntil` for dynamic content
4. Report persistent flakiness for investigation

### Skipping E2E Tests

To skip E2E tests on a PR (not recommended):

```
[skip e2e]
```

Add this to commit message. Only use for:

- Documentation-only changes
- CI configuration changes
- Emergency hotfixes (run tests post-merge)

### Performance Optimization

Current execution times:

- Smoke: <1 minute
- Critical: ~6 minutes
- Full: ~45 minutes

**Optimization strategies:**

- Use tags for selective execution
- Parallelize with Maestro Cloud
- Cache app builds between runs
- Run full suite nightly, not on every PR

### Troubleshooting

**Build timeouts:**

- Check EAS build queue status
- Increase job timeout if necessary
- Use cached builds when possible

**Test timeouts:**

- Check network connectivity to Supabase
- Verify test environment is accessible
- Review app logs for errors

**Maestro CLI issues:**

- Verify CLI version is latest
- Check simulator/emulator is running
- Try `maestro test --debug` for detailed logs

````

### Maintenance Guidelines

#### When Adding New Features

1. Add corresponding E2E test flow
2. Ensure all interactive elements have testID props
3. Update test coverage matrix in .maestro/README.md
4. Update config.yaml with appropriate tags

#### When Modifying UI

1. Update affected test flows
2. Update testID props if component structure changed
3. Run affected tests locally before pushing
4. Update screenshots in documentation if needed

#### Weekly Tasks

1. Review Maestro Cloud dashboard for flaky tests
2. Check test execution times (optimize if degrading)
3. Verify all test accounts are active

#### Monthly Tasks

1. Update test data (reset accounts, seed fresh data)
2. Review and update test coverage matrix
3. Archive old test results (GitHub artifacts auto-delete after retention period)
4. Update Maestro CLI if new version available

#### Quarterly Tasks

1. Comprehensive test suite audit
2. Remove deprecated tests
3. Refactor duplicated test logic into shared subflows
4. Update documentation with new patterns or best practices

## Design Section 6: testID Implementation & Rollout Plan

### testID Audit Strategy

We need to ensure all interactive components have testID props for reliable E2E testing.

#### Priority Components

**High Priority (Required for existing and new tests):**
- ✅ Login/Signup forms - Already has testID based on existing flows
- ✅ Navigation tabs - Already working in flows
- 🔍 Home/Dashboard components - Need audit for new tests
- 🔍 Task management forms (create, edit) - Need audit for new sponsor tests
- 🔍 Profile settings - Partial coverage, need completion
- 🔍 Messaging interface - Need audit
- 🔍 Invite code forms - Need testID for new flows

**Medium Priority:**
- Step progression UI elements
- Journey timeline components
- Notification list items

**Low Priority (Non-interactive or read-only):**
- Static text displays
- Read-only statistics
- Decorative elements

### Audit Process

1. **Use Serena** to find all components with interactive elements:
   - `Button`, `TouchableOpacity`, `Pressable`
   - `TextInput`
   - `Switch`, `Checkbox`
   - Custom interactive components

2. **Check for existing testID** props

3. **Add missing testID** props following naming convention

4. **Update test flows** to use testID instead of text selectors where possible

### testID Naming Convention

**Pattern**: `{screen}-{component}-{element}`

**Examples:**

```typescript
// Authentication screens
testID="login-email-input"
testID="login-password-input"
testID="login-submit-button"
testID="signup-email-input"
testID="signup-password-input"
testID="signup-confirm-password-input"
testID="signup-submit-button"

// Navigation
testID="tab-home"
testID="tab-steps"
testID="tab-journey"
testID="tab-tasks"
testID="tab-profile"

// Home/Dashboard
testID="dashboard-welcome-message"
testID="dashboard-stats-days-sober"
testID="dashboard-stats-steps-completed"
testID="dashboard-quick-action-steps"
testID="dashboard-quick-action-tasks"
testID="dashboard-quick-action-journey"
testID="dashboard-notifications-list"

// Tasks (Sponsee)
testID="tasks-list"
testID="tasks-filter-button"
testID="tasks-item-{id}"
testID="task-complete-button"
testID="task-notes-input"

// Manage Tasks (Sponsor)
testID="manage-tasks-create-button"
testID="task-form-title-input"
testID="task-form-description-input"
testID="task-form-sponsee-select"
testID="task-form-due-date-picker"
testID="task-form-step-select"
testID="task-form-submit-button"
testID="task-delete-button"
testID="task-delete-confirm-button"

// Profile
testID="profile-edit-button"
testID="profile-name-input"
testID="profile-theme-selector"
testID="profile-notifications-toggle"
testID="profile-save-button"

// Invite Codes
testID="invite-code-generate-button"
testID="invite-code-display"
testID="invite-code-copy-button"
testID="invite-code-input"
testID="invite-code-submit-button"

// Messages
testID="messages-list"
testID="message-compose-input"
testID="message-send-button"
testID="message-thread-{id}"
````

### Implementation Strategy

#### Phase 1: Audit Existing Components (1 day)

Use Serena to search for interactive components and create audit report:

```bash
# Find all Button components
# Find all TextInput components
# Find all TouchableOpacity/Pressable components
# Check for existing testID props
```

Create checklist of components needing testID.

#### Phase 2: Add Missing testID Props (2-3 days)

Work through checklist systematically by feature area:

- Authentication screens (login, signup)
- Home/Dashboard tab
- Manage Tasks tab (sponsor)
- Profile tab (invite codes section)
- Other tabs (verify existing coverage)

#### Phase 3: Update Test Flows (1 day)

Update existing and new test flows to prefer testID selectors:

```yaml
# Before (text-based)
- tapOn: 'Sign In'

# After (testID-based, more reliable)
- tapOn:
    id: 'login-submit-button'
```

### Implementation Rollout Plan

#### Week 1: Foundation

- **Day 1**: Create config.yaml with all tags
- **Day 2**: Create .env.test, TEST_ACCOUNTS.md, shared subflows
- **Day 3**: testID audit (create comprehensive checklist)
- **Day 4**: Add missing testID props (high priority components)
- **Day 5**: Add missing testID props (medium priority components)

#### Week 2: Authentication Tests

- **Day 1**: Create auth/google-oauth.yaml
- **Day 2**: Create auth/facebook-oauth.yaml
- **Day 3**: Test OAuth flows locally, debug issues
- **Day 4**: Update existing auth tests to use shared subflows
- **Day 5**: Documentation for authentication tests

#### Week 3: Home & Manage Tasks

- **Day 1**: Create features/home/dashboard-overview.yaml
- **Day 2**: Create features/home/quick-actions.yaml + notifications.yaml
- **Day 3**: Create features/manage-tasks/create-task.yaml + edit-task.yaml
- **Day 4**: Create features/manage-tasks/delete-task.yaml + bulk-operations.yaml
- **Day 5**: Test all new flows, refinement

#### Week 4: Invite Codes & Integration

- **Day 1**: Create features/invite-codes/generate-invite-code.yaml
- **Day 2**: Create features/invite-codes/use-invite-code.yaml
- **Day 3**: Create features/invite-codes/invite-code-expiry.yaml
- **Day 4**: Integration testing across all flows
- **Day 5**: Bug fixes and refinement

#### Week 5: Platform-Specific Tests

- **Day 1**: Create platform-specific/ios-specific.yaml
- **Day 2**: Create platform-specific/android-specific.yaml
- **Day 3**: Create platform-specific/web-specific.yaml
- **Day 4**: Test platform flows on actual platforms
- **Day 5**: Platform-specific bug fixes

#### Week 6: CI/CD Integration

- **Day 1**: Create .github/workflows/e2e-tests.yml
- **Day 2**: Test workflow on feature branch, refine
- **Day 3**: Set up Maestro Cloud account and API keys
- **Day 4**: Integrate Maestro Cloud in workflow, test
- **Day 5**: Final CI/CD testing and optimization

#### Week 7: Documentation & Finalization

- **Day 1**: Update .maestro/README.md with complete documentation
- **Day 2**: Create .maestro/CONTRIBUTING.md (test writing guidelines)
- **Day 3**: Update docs/TESTING.md with E2E section
- **Day 4**: Update .github/CICD.md with E2E testing documentation
- **Day 5**: Final review, acceptance criteria verification, create PR

### Acceptance Criteria Checklist

- [ ] **All 36+ flows implemented and passing**
  - [ ] 21 existing flows working with new structure
  - [ ] 2 OAuth flows (Google, Facebook)
  - [ ] 3 Home/Dashboard flows
  - [ ] 4 Manage Tasks flows (sponsor)
  - [ ] 3 Invite Code flows
  - [ ] 3 Platform-specific flows

- [ ] **100% feature coverage**
  - [ ] Every tab has dedicated test coverage
  - [ ] All user roles tested (sponsee, sponsor, both)
  - [ ] All CRUD operations covered
  - [ ] Error states and edge cases tested

- [ ] **All platforms tested**
  - [ ] iOS-specific flows
  - [ ] Android-specific flows
  - [ ] Web-specific flows

- [ ] **CI/CD integration complete**
  - [ ] GitHub Actions workflow created and tested
  - [ ] PR checks run smoke + critical tests (<10 min)
  - [ ] Nightly builds run full suite (<45 min)
  - [ ] Maestro Cloud integration configured
  - [ ] Test result reporting working

- [ ] **Test data management**
  - [ ] .env.test created (gitignored)
  - [ ] TEST_ACCOUNTS.md documented (gitignored)
  - [ ] Test accounts created in Supabase
  - [ ] Setup/cleanup scripts working

- [ ] **Documentation complete**
  - [ ] .maestro/README.md updated with complete guide
  - [ ] .maestro/CONTRIBUTING.md created with guidelines
  - [ ] .maestro/TEST_ACCOUNTS.md created
  - [ ] docs/TESTING.md updated with E2E section
  - [ ] .github/CICD.md updated with E2E section

- [ ] **Reusable subflows created**
  - [ ] shared/\_login-as-sponsee.yaml
  - [ ] shared/\_login-as-sponsor.yaml
  - [ ] shared/\_setup-test-data.yaml
  - [ ] shared/\_cleanup-test-data.yaml
  - [ ] No significant code duplication in flows

- [ ] **Test execution time acceptable**
  - [ ] Smoke tests: <1 minute
  - [ ] Smoke + critical: <10 minutes
  - [ ] Full suite: <45 minutes

- [ ] **All tests idempotent**
  - [ ] Can run in any order
  - [ ] Can run multiple times with same result
  - [ ] Don't interfere with each other
  - [ ] Use isolated test accounts or cleanup properly

- [ ] **testID coverage complete**
  - [ ] All interactive components have testID props
  - [ ] Naming convention followed consistently
  - [ ] Test flows prefer testID over text selectors

## Summary

This design provides a comprehensive plan to complete Issue #29 with all 6 phases:

1. **Foundation**: Config.yaml, shared subflows, .env.test, testID audit
2. **Critical Path Tests**: OAuth flows for authentication completion
3. **Feature-Specific Tests**: 10 new flows for home, manage-tasks, invite codes
4. **Edge Cases & Platform Tests**: 3 platform-specific flows
5. **CI/CD Integration**: GitHub Actions workflow with Maestro Cloud
6. **Documentation**: Complete updates to all docs with guidelines

**Total Deliverables**:

- 15 new test flows (bringing total to 36)
- config.yaml with tag-based execution
- 4 shared subflows for reusability
- Complete CI/CD integration
- Comprehensive documentation updates
- testID coverage across all components

**Timeline**: 7 weeks with clear milestones and acceptance criteria

**Next Steps**:

1. Review and approve this design
2. Create implementation plan with detailed tasks
3. Begin Phase 1 foundation work
