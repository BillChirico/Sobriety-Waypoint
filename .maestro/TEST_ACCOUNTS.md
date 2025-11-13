# Test Accounts Documentation

This document describes the test accounts used for E2E testing with Maestro and provides instructions for setting them up.

## Overview

The E2E test suite requires pre-configured test accounts in Supabase to test various user roles and scenarios. These accounts should be created in your test/staging environment, never in production.

## Security Notice

⚠️ **IMPORTANT**:

- Test account credentials are stored in `.env.test` which is gitignored
- Never commit actual credentials to version control
- Use strong passwords even for test accounts
- Rotate test account passwords regularly
- Keep test data isolated from production data

## Required Test Accounts

### 1. Sponsee Test Account

**Purpose**: Testing sponsee-specific features and complete sponsee journeys

**Configuration**:

- **Email**: `sponsee1@test.example.com` (or your domain)
- **Password**: Strong password (min 6 characters)
- **Profile**:
  - First Name: Jane
  - Last Initial: D
  - Role: `sponsee`
  - Sobriety Date: Set to 90 days ago
  - Notifications Enabled: `true`

**Setup Steps**:

1. Create account via signup flow or Supabase dashboard
2. Complete onboarding with sponsee role
3. Optionally: Connect to sponsor test account
4. Optionally: Add some completed tasks for testing history

### 2. Sponsor Test Account

**Purpose**: Testing sponsor-specific features and complete sponsor journeys

**Configuration**:

- **Email**: `sponsor1@test.example.com`
- **Password**: Strong password (min 6 characters)
- **Profile**:
  - First Name: John
  - Last Initial: S
  - Role: `sponsor`
  - Sobriety Date: Set to 5 years ago (1825 days)
  - Notifications Enabled: `true`

**Setup Steps**:

1. Create account via signup flow or Supabase dashboard
2. Complete onboarding with sponsor role
3. Generate at least one invite code (save for testing)
4. Optionally: Connect to sponsee test account
5. Optionally: Create some tasks for sponsees

### 3. Both Roles Test Account

**Purpose**: Testing users who act as both sponsor and sponsee

**Configuration**:

- **Email**: `both1@test.example.com`
- **Password**: Strong password (min 6 characters)
- **Profile**:
  - First Name: Alex
  - Last Initial: B
  - Role: `both`
  - Sobriety Date: Set to 1 year ago (365 days)
  - Notifications Enabled: `true`

**Setup Steps**:

1. Create account via signup flow or Supabase dashboard
2. Complete onboarding with both roles
3. Create relationships as both sponsor (to others) and sponsee (with another sponsor)

### 4. New User Accounts (Dynamic)

**Purpose**: Testing signup and onboarding flows

**Configuration**:

- **Email Pattern**: `newuser+{timestamp}@test.example.com`
- **Password**: `NewUserTest123!` (configurable)
- **Note**: These accounts are created during test execution and should be cleaned up after

**Usage**:

- Tests will generate unique email addresses using timestamps
- Accounts are created fresh for each signup test
- Consider implementing cleanup job to remove test accounts older than 7 days

## Creating Test Accounts

### Option 1: Manual Creation via Supabase Dashboard

1. Open Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Click "Create User"
5. Navigate to Table Editor → profiles
6. Create profile record with correct user_id, role, and other fields

### Option 2: Automated Setup Script

We recommend creating a setup script to automate test account creation:

```bash
# .maestro/scripts/setup-test-accounts.sh
#!/bin/bash

# This script creates test accounts in Supabase
# Run once to set up your test environment

# Load environment variables
source .env.test

# Create sponsee account
curl -X POST "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_SPONSEE_EMAIL}\",
    \"password\": \"${TEST_SPONSEE_PASSWORD}\"
  }"

# Create sponsor account
curl -X POST "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/signup" \
  -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_SPONSOR_EMAIL}\",
    \"password\": \"${TEST_SPONSOR_PASSWORD}\"
  }"

# TODO: Add profile creation and relationship setup
```

### Option 3: Via Maestro Setup Flow

The recommended approach is to create a Maestro flow that sets up test accounts:

```yaml
# .maestro/flows/shared/_setup-test-accounts.yaml
# Run this once to create test accounts via the app UI
```

## Test Data Management

### Database Seeding

For consistent testing, seed the following reference data:

**Steps Content** (12 steps):

- Ensure all 12 steps have content in `steps_content` table
- Include reflection prompts for each step

**Sample Tasks**:

- Create 2-3 tasks assigned to sponsee test account
- Mix of statuses: assigned, in_progress, completed
- Various due dates: overdue, due today, future

**Sample Messages**:

- Create a conversation thread between sponsor and sponsee accounts
- Include both read and unread messages

**Sample Notifications**:

- Create various notification types
- Mix of read and unread states

### Data Cleanup Strategy

**Approach 1: Supabase RLS Policies**

- Configure policies to auto-delete test data older than 7 days
- Tag test data with a `is_test_data` flag

**Approach 2: Cleanup Flow**

- Create `_cleanup-test-data.yaml` subflow
- Run before/after test suites
- Delete test-created tasks, messages, etc.

**Approach 3: Separate Test Database**

- Use a dedicated Supabase project for testing
- Reset entire database between test runs

## OAuth Test Accounts (Optional)

If testing Google/Facebook OAuth flows, you'll need:

### Google Test Account

1. Create a Google account for testing
2. Enable "Less secure app access" (for automated testing)
3. Store credentials in `.env.test`

**Note**: Google may block automated signin attempts. Consider using Maestro's manual OAuth flow or mocking OAuth in tests.

### Facebook Test Account

1. Create a Facebook test user via your app's dashboard
2. Facebook provides test users specifically for app testing
3. These accounts won't interfere with real user data

## Environment-Specific Configuration

### Development Environment

- Use `dev.12steptracker.com` or localhost
- Test accounts: `*@test.example.com`
- Supabase project: `12-step-tracker-dev`

### Staging Environment

- Use `staging.12steptracker.com`
- Test accounts: `*@staging.example.com`
- Supabase project: `12-step-tracker-staging`

### CI/CD Environment

- Use environment variables in GitHub Actions
- Store credentials as GitHub Secrets
- Never log or expose credentials in CI logs

## Troubleshooting

### Account Locked or Disabled

**Issue**: Test account is locked after failed login attempts

**Solution**:

1. Reset password via Supabase dashboard
2. Check for security policies blocking test accounts
3. Update `.env.test` with new credentials

### Profile Not Found

**Issue**: Account exists but profile record missing

**Solution**:

1. Check `profiles` table in Supabase
2. Create profile record manually with matching `id` from `auth.users`
3. Ensure AuthContext creates profiles automatically for new users

### RLS Policy Violations

**Issue**: Test accounts can't access data due to RLS policies

**Solution**:

1. Review RLS policies for test environment
2. Ensure test accounts have proper role assignments
3. Check relationship setup between sponsor/sponsee accounts

### Stale Data

**Issue**: Tests fail due to unexpected existing data

**Solution**:

1. Run cleanup flow before test suite
2. Implement idempotent tests that handle existing data
3. Use unique identifiers (timestamps) to avoid conflicts

## Maintenance Schedule

**Weekly**:

- Review test account activity
- Clean up old test data
- Verify all test accounts are accessible

**Monthly**:

- Rotate test account passwords
- Review and update test data sets
- Check for any security alerts on test accounts

**Quarterly**:

- Full audit of test environment
- Update documentation with any changes
- Review cleanup automation effectiveness

## Contact

For questions about test account setup or issues:

- Check `.maestro/README.md` for general Maestro documentation
- Review `docs/TESTING.md` for overall testing strategy
- Contact the development team for test environment access

## Related Documentation

- `.maestro/.env.test.example` - Environment variable template
- `.maestro/config.yaml` - Test suite configuration
- `.maestro/flows/shared/` - Reusable setup/cleanup flows
- `docs/TESTING.md` - Comprehensive testing guide
