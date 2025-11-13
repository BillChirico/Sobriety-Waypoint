# Maestro E2E Tests

Comprehensive end-to-end test suite for the 12-Step Tracker mobile application using Maestro.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [Test Accounts](#test-accounts)
- [Writing New Tests](#writing-new-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

1. **Maestro CLI**: Install via command line

   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. **Device/Simulator**: Have one of the following running:
   - iOS Simulator (macOS only)
   - Android Emulator
   - Physical device connected via USB

3. **App Running**: Ensure the 12-Step Tracker app is running:

   ```bash
   pnpm dev
   ```

4. **Test Environment**: Set up test accounts and environment variables:
   ```bash
   cp .maestro/.env.test.example .maestro/.env.test
   # Edit .env.test with your test credentials
   ```

### Run Tests

```bash
# Run smoke tests (quick sanity check, <1 minute)
maestro test .maestro/flows/00-smoke-test.yaml

# Run all tests
maestro test .maestro/flows

# Run with environment variables
maestro test .maestro/flows --env .maestro/.env.test

# Run specific tag (critical tests for PR approval, ~6 minutes)
maestro test .maestro/flows --include-tags critical

# Run with debug output
maestro test .maestro/flows/auth/03-login.yaml --debug
```

## Test Organization

The test suite is organized by feature area and user journey:

```
.maestro/
├── config.yaml                    # Suite configuration, tags, and execution order
├── .env.test.example              # Environment variable template (copy to .env.test)
├── TEST_ACCOUNTS.md               # Test account setup documentation
├── README.md                      # This file
└── flows/
    ├── 00-smoke-test.yaml        # Quick sanity check
    ├── auth/                      # Authentication flows (5 tests)
    ├── onboarding/                # Onboarding flows (2 tests)
    ├── sponsee-journeys/          # Complete sponsee journeys (4 tests)
    ├── sponsor-journeys/          # Complete sponsor journeys (4 tests)
    ├── features/                  # Individual feature tests (34 tests)
    │   ├── home/                  # Dashboard and quick actions
    │   ├── steps/                 # 12 steps content and progression
    │   ├── journey/               # Timeline and progress tracking
    │   ├── tasks/                 # Task management (sponsee view)
    │   ├── manage-tasks/          # Task creation (sponsor view)
    │   ├── profile/               # Profile and settings
    │   ├── messages/              # Direct messaging
    │   └── invite-codes/          # Invite code system
    ├── edge-cases/                # Error handling and edge cases (5 tests)
    ├── platform-specific/         # Platform-specific tests (3 tests)
    └── shared/                    # Reusable subflows
        ├── _login-as-sponsee.yaml
        ├── _login-as-sponsor.yaml
        ├── _logout.yaml
        ├── _setup-test-data.yaml
        └── _cleanup-test-data.yaml
```

### Test Tags

Tests are organized with tags for selective execution:

- **smoke**: Quick sanity checks (<1 minute) - Run on every commit
- **critical**: Essential user journeys (~6 minutes) - Run on every PR
- **auth**: Authentication and onboarding flows (~5 minutes)
- **sponsee**: Sponsee-specific features and journeys
- **sponsor**: Sponsor-specific features and journeys
- **features**: Individual feature tests
- **edge-cases**: Error handling and edge scenarios
- **platform**: Platform-specific tests (iOS/Android/Web)
- **full**: Complete test suite (~30-45 minutes) - Run nightly

## Running Tests

### Local Development

```bash
# Quick smoke test
maestro test .maestro/flows/00-smoke-test.yaml

# Critical path tests (for PR validation)
maestro test .maestro/flows --include-tags critical

# Specific category
maestro test .maestro/flows --include-tags auth
maestro test .maestro/flows --include-tags sponsee
maestro test .maestro/flows --include-tags features

# Single test file
maestro test .maestro/flows/auth/03-login.yaml

# With environment variables
maestro test .maestro/flows --env .maestro/.env.test

# With specific device
maestro test .maestro/flows --device "iPhone 15 Pro"

# Debug mode with verbose output
maestro test .maestro/flows/auth/03-login.yaml --debug

# Record new flow interactively
maestro record
```

### Continuous Integration

Tests run automatically on:

- **Every PR**: smoke + critical tags (~6 minutes)
- **Nightly on develop/main**: full suite (~30-45 minutes)
- **Pre-release**: full suite on all platforms

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Test Accounts

### Setup Required

Before running tests, you must:

1. **Copy environment template**:

   ```bash
   cp .maestro/.env.test.example .maestro/.env.test
   ```

2. **Create test accounts in Supabase**:
   - Sponsee account: `sponsee1@test.example.com`
   - Sponsor account: `sponsor1@test.example.com`
   - Both roles account: `both1@test.example.com`

3. **Update `.maestro/.env.test`** with actual credentials

4. **Verify setup**:
   ```bash
   maestro test .maestro/flows/auth/03-login.yaml --env .maestro/.env.test
   ```

For detailed setup instructions, see [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md).

### Security Note

⚠️ **Never commit `.env.test`** - it contains real credentials and is gitignored. Use `.env.test.example` as a template only.

## Writing New Tests

### Test Structure

All test flows follow this structure:

```yaml
# App identifier
appId: com.billchirico.twelvesteptracker

# Environment variables
env:
  TEST_EMAIL: '${TEST_EMAIL}'
  TEST_PASSWORD: '${TEST_PASSWORD}'

---
# Flow metadata
name: Test Name
description: What this test validates

tags:
  - smoke
  - critical

---
# Test steps
- launchApp
- assertVisible: 'Login'
- tapOn: { id: 'email-input' }
- inputText: '${TEST_EMAIL}'
# ... more steps
```

### Best Practices

1. **Use testID props**: Prefer `{ id: "element-id" }` over text-based selectors
2. **Use reusable subflows**: Import common actions from `shared/`
3. **Assert after actions**: Verify state changes after every action
4. **Avoid hardcoded delays**: Use `assertVisible` with timeout instead of `wait`
5. **Make tests idempotent**: Tests should work in any order
6. **Use descriptive names**: `03-login.yaml` not `test3.yaml`
7. **Add comments**: Explain complex flows or edge cases
8. **Handle async operations**: Use appropriate timeouts for loading states

### Using Shared Subflows

```yaml
# Login as sponsee
- runFlow: shared/_login-as-sponsee.yaml

# Login as sponsor
- runFlow: shared/_login-as-sponsor.yaml

# Logout
- runFlow: shared/_logout.yaml
```

### Testing Checklist

Before submitting a new test:

- [ ] Test runs successfully locally
- [ ] Uses appropriate tags
- [ ] Has descriptive name and comments
- [ ] Uses testID props for element selection
- [ ] Includes proper assertions
- [ ] Handles loading and async states
- [ ] Cleans up after itself (if needed)
- [ ] Added to `config.yaml` flows list
- [ ] Updated this README if adding new category

## CI/CD Integration

### GitHub Actions Workflow

The E2E test suite runs automatically in CI via `.github/workflows/e2e-tests.yml`:

**On Pull Requests**:

- Runs smoke + critical tests (~6 minutes)
- Tests must pass for PR approval
- Uploads test results as artifacts

**Nightly on develop/main**:

- Runs complete test suite (~30-45 minutes)
- Tests all features and edge cases
- Reports failures to team

**Configuration**:

```yaml
# Run specific tags in CI
maestro test .maestro/flows \
--include-tags smoke \
--include-tags critical \
--format junit \
--output results.xml
```

### Maestro Cloud (Optional)

For parallel execution across multiple devices:

```bash
# Upload to Maestro Cloud
maestro cloud --apiKey $MAESTRO_CLOUD_API_KEY \
  .maestro/flows

# Run on specific devices
maestro cloud --apiKey $MAESTRO_CLOUD_API_KEY \
  --device "iPhone 15" \
  --device "Pixel 7" \
  .maestro/flows
```

## Troubleshooting

### Common Issues

**Issue**: `Error: Could not find device`

**Solution**:

```bash
# List available devices
maestro test --list-devices

# Start iOS simulator
open -a Simulator

# Start Android emulator
emulator -avd Pixel_5_API_31
```

---

**Issue**: `Element not found: email-input`

**Solution**:

- Verify component has `testID="email-input"` prop
- Check spelling and case sensitivity
- Use `--debug` flag to see screenshot of current screen
- Update test to match actual testID in code

---

**Issue**: `Test timeout after 10000ms`

**Solution**:

- Increase timeout: `assertVisible: { text: "Loading", timeout: 20000 }`
- Check if app is actually loading (use `--debug`)
- Verify network connectivity for API calls
- Check Supabase connection in test environment

---

**Issue**: `Authentication failed for test account`

**Solution**:

- Verify credentials in `.env.test` are correct
- Check account exists in Supabase
- Ensure account is not locked or disabled
- Try logging in manually to verify credentials

---

**Issue**: `Tests pass locally but fail in CI`

**Solution**:

- Check environment variables are set in GitHub Secrets
- Verify simulator/device availability on CI runner
- Check for timing issues (CI may be slower)
- Review CI logs and artifacts for detailed error messages

### Debug Tools

```bash
# Run with debug output
maestro test flow.yaml --debug

# Take screenshots during test
- takeScreenshot: debug-screenshot.png

# Add console logging
- evalScript: console.log('Checkpoint reached')

# Inspect element hierarchy
maestro studio
```

### Getting Help

1. **Check existing tests**: Look at similar flows for patterns
2. **Review documentation**:
   - [Maestro Documentation](https://maestro.mobile.dev/)
   - [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md) - Test account setup
   - [docs/TESTING.md](../docs/TESTING.md) - Overall testing strategy
   - [docs/templates/maestro-flow.template.yaml](../docs/templates/maestro-flow.template.yaml) - Flow template
3. **Debug with Maestro Studio**: `maestro studio` for interactive debugging
4. **Check CI logs**: View detailed logs in GitHub Actions artifacts
5. **Team support**: Ask in development channel for help

## Related Documentation

- [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md) - Test account setup and management
- [config.yaml](./config.yaml) - Test suite configuration
- [docs/TESTING.md](../docs/TESTING.md) - Complete testing guide
- [docs/templates/maestro-flow.template.yaml](../docs/templates/maestro-flow.template.yaml) - Test template
- [.github/workflows/e2e-tests.yml](../.github/workflows/e2e-tests.yml) - CI configuration

## Contributing

When adding new E2E tests:

1. Follow the existing structure and naming conventions
2. Add appropriate tags for selective execution
3. Use reusable subflows from `shared/`
4. Update `config.yaml` with new flow paths
5. Document any new test accounts needed
6. Update this README if adding new categories
7. Ensure tests pass locally before committing
8. Add tests to appropriate CI workflow stages

## Maintenance

### Weekly Tasks

- Review and fix any flaky tests
- Update test data as app evolves
- Clean up old test accounts

### Monthly Tasks

- Rotate test account passwords
- Review and optimize test execution time
- Update documentation with lessons learned

### As Needed

- Add new tests for new features
- Update existing tests for UI changes
- Expand coverage for edge cases
