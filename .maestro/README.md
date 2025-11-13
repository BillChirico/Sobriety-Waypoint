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

### Run Specific Flow

```bash
maestro test .maestro/flows/00-smoke-test.yaml
```

### Record New Flow

```bash
maestro record
```

## Flows

### Critical User Journeys

- `00-smoke-test.yaml` - Basic app launch test
- `01-authentication.yaml` - Sign up, sign in, sign out, validation errors
- `02-onboarding.yaml` - New user role selection (Sponsee, Sponsor, Both)
- `03-sponsor-flow.yaml` - Create invite code, assign tasks, send messages
- `04-sponsee-flow.yaml` - Use invite code, view tasks, complete tasks, message sponsor
- `05-task-management.yaml` - Create, edit, complete, delete tasks
- `06-messaging.yaml` - Send messages, view history, real-time updates
- `07-step-progression.yaml` - View steps, read content, track progress, add notes
- `08-profile-management.yaml` - Edit profile, change theme, update settings, sign out

### Running Specific Test Types

```bash
# Run smoke tests only
maestro test .maestro/flows/00-smoke-test.yaml

# Run authentication and onboarding
maestro test .maestro/flows/01-authentication.yaml .maestro/flows/02-onboarding.yaml

# Run all flows in order
maestro test .maestro/flows
```

## Test Data

### Test Accounts

The flows use environment variables for test accounts. When running locally, you can override these in each flow file or create a `.maestro/env.yaml` file:

```yaml
TEST_EMAIL: your.test@email.com
TEST_PASSWORD: YourTestPassword123!
SPONSOR_EMAIL: sponsor.test@email.com
SPONSEE_EMAIL: sponsee.test@email.com
```

### Recommended Test Users

Create these users in your Supabase test environment:

1. **General User**: `e2e.test@twelvesteptracker.app`
2. **New User**: `e2e.newuser@twelvesteptracker.app`
3. **Onboarding User**: `e2e.onboarding@twelvesteptracker.app`
4. **Sponsor**: `e2e.sponsor@twelvesteptracker.app`
5. **Sponsee**: `e2e.sponsee@twelvesteptracker.app`
6. **Profile Test User**: `e2e.profile@twelvesteptracker.app`

All test accounts should use password: `TestPassword123!`

## Notes

- Flows are designed to be run against a clean app state
- Each flow is independent and can be run in any order
- Some flows create test data that may need cleanup
- Screenshots are automatically captured on test failures
- Test results are saved in `~/.maestro/tests/`

## CI Integration

E2E tests run automatically in CI on every PR. See `.github/workflows/e2e-tests.yml` for configuration.

## Troubleshooting

### App Not Launching

Ensure your app is installed on the simulator/emulator:

```bash
# iOS
expo run:ios

# Android
expo run:android
```

### Flow Fails with Timeout

- Increase timeout values in the flow
- Check network connectivity
- Verify Supabase is accessible
- Check app logs for errors

### Element Not Found

- Verify the element has the correct `testID`
- Check if the element is visible on screen
- Try scrolling to the element first
- Use Maestro Studio for debugging: `maestro studio`
