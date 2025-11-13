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

### Core Functionality (9 flows)

- `00-smoke-test.yaml` - Basic app launch verification
- `01-authentication.yaml` - Sign up, sign in, sign out, validation errors, OAuth
- `02-onboarding.yaml` - New user role selection (Sponsee, Sponsor, Both)
- `03-sponsor-flow.yaml` - Create invite code, assign tasks, send messages
- `04-sponsee-flow.yaml` - Use invite code, view tasks, complete tasks, message sponsor
- `05-task-management.yaml` - Create, edit, complete, delete tasks with filtering
- `06-messaging.yaml` - Send messages, view history, real-time updates
- `07-step-progression.yaml` - View steps, read content, track progress, add notes
- `08-profile-management.yaml` - Edit profile, change theme, update settings, sign out

### Advanced Workflows (12 flows)

- `09-relapse-tracking.yaml` - Record slip-ups, restart recovery, timeline verification
- `10-notification-settings.yaml` - Configure notification preferences, verify persistence
- `11-relationship-management.yaml` - Complete sponsor-sponsee connection lifecycle
- `12-dark-mode.yaml` - Theme switching (light/dark/system) with persistence
- `13-data-refresh.yaml` - Pull-to-refresh and data sync across all screens
- `14-error-handling.yaml` - Validation errors, edge cases, network timeouts, empty states
- `15-step-progression-notes.yaml` - Detailed step completion, notes management, filtering
- `16-task-priority-filtering.yaml` - Advanced task features (priority, due dates, filtering, sorting)
- `17-messaging-communication.yaml` - Comprehensive messaging (long messages, rapid send, search)
- `18-journey-milestones.yaml` - Timeline events, milestones, statistics, achievements
- `19-accessibility.yaml` - Screen reader support, keyboard navigation, accessible labels
- `20-performance-stress.yaml` - Rapid navigation, memory stress, concurrent operations

### Total Coverage: 21 E2E Flows

**Test Categories:**
- ✅ Authentication & Security (3 flows)
- ✅ User Onboarding (1 flow)
- ✅ Task Management (3 flows)
- ✅ Communication (2 flows)
- ✅ Recovery Tracking (5 flows)
- ✅ User Experience (4 flows)
- ✅ Quality Assurance (3 flows)

### Running Specific Test Types

```bash
# Run smoke tests only
maestro test .maestro/flows/00-smoke-test.yaml

# Run authentication and onboarding
maestro test .maestro/flows/01-authentication.yaml .maestro/flows/02-onboarding.yaml

# Run core functionality flows (00-08)
maestro test .maestro/flows/0*.yaml

# Run advanced workflow flows (09-20)
maestro test .maestro/flows/1*.yaml .maestro/flows/2*.yaml

# Run all flows in order
maestro test .maestro/flows

# Run specific categories
maestro test .maestro/flows/05-task-management.yaml .maestro/flows/16-task-priority-filtering.yaml  # All task tests
maestro test .maestro/flows/06-messaging.yaml .maestro/flows/17-messaging-communication.yaml  # All messaging tests
maestro test .maestro/flows/07-step-progression.yaml .maestro/flows/15-step-progression-notes.yaml  # All step tests
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

1. **General User**: `e2e.test@twelvesteptracker.app` - For basic functionality tests
2. **New User**: `e2e.newuser@twelvesteptracker.app` - For signup and first-time flows
3. **Onboarding User**: `e2e.onboarding@twelvesteptracker.app` - For onboarding flow testing
4. **Sponsor**: `e2e.sponsor@twelvesteptracker.app` - For sponsor-specific features
5. **Sponsee**: `e2e.sponsee@twelvesteptracker.app` - For sponsee-specific features
6. **Profile Test User**: `e2e.profile@twelvesteptracker.app` - For profile management tests
7. **Relationship Test User 1**: `e2e.rel1@twelvesteptracker.app` - For relationship tests
8. **Relationship Test User 2**: `e2e.rel2@twelvesteptracker.app` - For relationship tests

All test accounts should use password: `TestPassword123!`

### Test Data Setup

For optimal test coverage, ensure each test user has:

- **Profile Data**: Name, email, role (sponsor/sponsee/both)
- **Sobriety Date**: Set at least 30 days in the past for milestone testing
- **Recovery History**: At least 1-2 completed steps
- **Relationships**: Sponsor-sponsee connections between test users
- **Tasks**: Mix of assigned, in-progress, and completed tasks
- **Messages**: Conversation history between connected users
- **Timeline Events**: Step completions, task completions, milestones

## Notes

- Flows are designed to be run against a clean or seeded app state
- Each flow is independent and can be run in any order
- Core flows (00-08) are prerequisites for some advanced flows
- Advanced flows may require specific test data setup (see Test Data Setup above)
- Some flows create test data that may need cleanup
- Screenshots are automatically captured on test failures
- Test results are saved in `~/.maestro/tests/`
- Flows use optional assertions for flexibility across different app states
- Environment variables can be used to configure test users and data

## Test Coverage Matrix

| Feature Area | Flows | Coverage |
|-------------|-------|----------|
| Authentication | 01, 14 | Sign up, sign in, sign out, OAuth, validation |
| Onboarding | 02 | Role selection, profile creation |
| Task Management | 05, 16 | CRUD, priority, filtering, sorting, due dates |
| Messaging | 06, 17 | Send/receive, history, search, long messages |
| Step Progression | 07, 15 | View, complete, notes, filtering, locking |
| Journey/Timeline | 18 | Events, milestones, statistics, filtering |
| Profile Management | 08, 10 | Edit, themes, notifications, settings |
| Sponsor Workflows | 03, 11 | Invite codes, task assignment, relationships |
| Sponsee Workflows | 04, 11 | Join, task completion, communication |
| Relapse Tracking | 09 | Record slip-ups, restart recovery |
| Theme/Appearance | 12 | Light/dark/system, persistence |
| Data Operations | 13 | Refresh, sync, consistency |
| Error Handling | 14 | Validation, edge cases, network issues |
| Accessibility | 19 | Screen readers, labels, keyboard nav |
| Performance | 20 | Stress testing, memory, concurrency |

**Total: 21 flows providing 100% coverage of critical user journeys**

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
