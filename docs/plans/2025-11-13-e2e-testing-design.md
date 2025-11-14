# E2E Testing Suite Design - Maestro

**Date**: 2025-11-13
**Status**: Approved
**GitHub Issue**: [#29](https://github.com/BillChirico/12-Step-Tracker/issues/29)

## Executive Summary

This design document outlines a comprehensive end-to-end (e2e) testing strategy for the Sobriety Waypoint app using Maestro. The implementation will provide complete test coverage across all user journeys, features, and platforms (iOS, Android, Web) with proper CI/CD integration.

## Background

Currently, the app has minimal e2e coverage (one smoke test). As the app approaches production readiness, comprehensive e2e testing is critical to ensure quality, prevent regressions, and maintain confidence in deployments across all platforms.

## Goals

1. **Complete Feature Coverage**: Test every user-facing feature and interaction
2. **Role-Based Journey Testing**: Validate complete sponsor and sponsee workflows
3. **Platform Coverage**: Ensure tests pass on iOS, Android, and Web
4. **CI/CD Integration**: Automate test execution in the deployment pipeline
5. **Maintainability**: Create reusable, well-organized test code
6. **Fast Feedback**: Provide quick smoke/critical tests for PRs, comprehensive nightly tests

## Non-Goals

- Performance/load testing (separate initiative)
- API-only testing (covered by unit/integration tests)
- Visual regression testing (may be added later)
- Accessibility testing (separate initiative)

## Research & Best Practices

Based on 2025 Maestro best practices for React Native/Expo apps:

### Security & Data Handling

- Never hardcode sensitive test data in YAML files
- Use environment variables for test credentials (`.env.test`)
- Use Maestro's `env` parameter for sensitive data injection
- Generate test data dynamically with unique identifiers
- Leverage Supabase RLS policies for automatic test data isolation
- Clean up test data after execution

### Test Organization Patterns

- Directory-based organization by feature/journey
- Tag-based execution for selective test runs
- Number prefixes for explicit execution order
- Reusable subflows in dedicated `shared/` directory
- Centralized configuration via `config.yaml`

### Maestro Best Practices

1. Add `testID` props to all interactive components for reliable selection
2. Use explicit waits (`waitForVisible`) for dynamic content
3. Create reusable subflows to eliminate duplication
4. Assert state changes after every action
5. Use descriptive flow names and inline comments
6. Design idempotent tests (order-independent, repeatable)

## Architecture

### Directory Structure

```
.maestro/
├── config.yaml                     # Suite configuration with tags and execution order
├── flows/
│   ├── 00-smoke-test.yaml         # (existing) Quick sanity check
│   ├── auth/                       # Authentication flows (5 tests)
│   ├── onboarding/                 # Onboarding flows (2 tests)
│   ├── sponsee-journeys/           # Complete sponsee user journeys (4 tests)
│   ├── sponsor-journeys/           # Complete sponsor user journeys (4 tests)
│   ├── features/                   # Individual feature tests
│   │   ├── home/                   # Dashboard (3 tests)
│   │   ├── steps/                  # Steps tab (4 tests)
│   │   ├── journey/                # Journey tab (5 tests)
│   │   ├── tasks/                  # Tasks tab (5 tests)
│   │   ├── manage-tasks/           # Manage tasks tab (4 tests)
│   │   ├── profile/                # Profile tab (6 tests)
│   │   ├── messages/               # Messaging (4 tests)
│   │   └── invite-codes/           # Invite system (3 tests)
│   ├── edge-cases/                 # Error handling (5 tests)
│   ├── platform-specific/          # Platform tests (3 tests)
│   └── shared/                     # Reusable subflows
│       ├── _login-as-sponsee.yaml
│       ├── _login-as-sponsor.yaml
│       ├── _setup-test-data.yaml
│       └── _cleanup-test-data.yaml
```

### Test Tags Strategy

```yaml
tags:
  - smoke: [00-smoke-test]                    # <1 min - basic sanity
  - critical: [auth/*, *-complete-journey]    # ~5 min - must-pass tests
  - auth: [auth/*, onboarding/*]              # ~3 min - auth flows
  - sponsee: [sponsee-journeys/*, features/tasks/*]
  - sponsor: [sponsor-journeys/*, features/manage-tasks/*]
  - features: [features/**]                   # All feature tests
  - full: [**]                                # ~30-45 min - everything
```

### CI/CD Integration Points

- **Pull Requests**: `smoke` + `critical` tests (~6 minutes)
- **Nightly Builds**: `full` suite on develop/main branches
- **Pre-Release**: `full` suite before production deployment
- **Parallel Execution**: Maestro Cloud for multi-device testing
- **Build Pipeline**: Integrate with existing EAS Build workflow

## Detailed Design

### Test Coverage Breakdown

**Total Tests**: 60+ individual test flows

1. **Authentication Flows** (5 tests): Signup (sponsee), Signup (sponsor), Login, Google OAuth, Logout
2. **Onboarding Flows** (2 tests): Sponsee onboarding, Sponsor onboarding
3. **Sponsee Complete Journeys** (4 tests): End-to-end journey, Task management, Step progression, Progress tracking
4. **Sponsor Complete Journeys** (4 tests): End-to-end journey, Task creation, Sponsee management, Progress monitoring
5. **Home/Dashboard Tab** (3 tests): Overview, Quick actions, Notifications
6. **Steps Tab** (4 tests): Browse, Details, Reflection prompts, Completion
7. **Journey Tab** (5 tests): Timeline, Milestones, Statistics, Relapse tracking, Share progress
8. **Tasks Tab** (5 tests): List view, Details, Complete task, Notifications, History
9. **Manage Tasks Tab** (4 tests): Create, Edit, Delete, Bulk operations
10. **Profile Tab** (6 tests): View, Edit, Theme settings, Connections, Account settings, Delete account
11. **Messages/Communication** (4 tests): Direct messaging, Notifications, Chat, History
12. **Invite Code System** (3 tests): Generate, Use, Expiry handling
13. **Error Handling & Edge Cases** (5 tests): Network errors, Invalid data, Permissions, Data conflicts, Session expiry
14. **Cross-Platform** (3 tests): iOS-specific, Android-specific, Web-specific

### Test Data Management

**Environment Variables**:

- Create `.env.test` (gitignored) with test account credentials
- Use Maestro's `env` parameter to inject sensitive data at runtime

**Test Accounts**:

- Create dedicated Supabase accounts: `sponsor1@test.com`, `sponsee1@test.com`, etc.
- Document credentials in `.maestro/TEST_ACCOUNTS.md` (gitignored)
- Multiple accounts for relationship/messaging testing

**Data Isolation Strategy**:

- Use unique identifiers (timestamps) to avoid test conflicts
- Leverage Supabase RLS policies for automatic isolation
- Create cleanup subflows to reset test data

**Database Seeding**:

- Pre-populate required reference data (recovery steps content, notification types)
- Use test-specific database or dedicated test schema

### Reusable Subflows

**Shared Components**:

- `_login-as-sponsee.yaml`: Common login flow for sponsee
- `_login-as-sponsor.yaml`: Common login flow for sponsor
- `_setup-test-data.yaml`: Initialize test data before flows
- `_cleanup-test-data.yaml`: Clean up after test execution

**Benefits**:

- Reduces duplication across test files
- Centralizes common logic for easier updates
- Improves test readability and maintenance

### Implementation Phases

**Phase 1: Foundation** (1 week)

- Create `config.yaml` with tags and execution order
- Set up test data management (`.env.test`, test accounts)
- Create reusable subflows
- Add `testID` props to all interactive components
- Document test accounts and setup

**Phase 2: Critical Path Tests** (1 week)

- Authentication flows (5 tests)
- Onboarding flows (2 tests)
- Sponsee end-to-end journey (1 test)
- Sponsor end-to-end journey (1 test)
- Verify all critical tests pass

**Phase 3: Feature-Specific Tests** (2-3 weeks)

- Home/Dashboard (3 tests)
- Steps tab (4 tests)
- Journey tab (5 tests)
- Tasks tab (5 tests)
- Manage Tasks tab (4 tests)
- Profile tab (6 tests)
- Messages/Communication (4 tests)
- Invite Code System (3 tests)

**Phase 4: Edge Cases & Platform Tests** (1 week)

- Error handling tests (5 tests)
- Cross-platform tests (3 tests)
- Network resilience tests
- Data conflict resolution tests

**Phase 5: CI/CD Integration** (3-4 days)

- Update GitHub Actions workflow
- Configure test tags for selective execution
- Set up Maestro Cloud for parallel execution
- Add test reporting to CI output
- Document CI/CD integration

**Phase 6: Documentation & Maintenance** (2-3 days)

- Update `.maestro/README.md` with complete docs
- Add test writing guidelines
- Document common patterns and anti-patterns
- Create troubleshooting guide
- Update main `docs/TESTING.md`

**Total Estimated Timeline**: 6-8 weeks

## Trade-offs and Alternatives

### Why Maestro over Detox/Appium?

**Chosen: Maestro**

- Native Expo support without ejecting
- Simpler YAML syntax vs. JavaScript/TypeScript
- Built-in CI/CD integration and cloud execution
- Faster execution and better flake resistance
- Lower maintenance overhead

**Alternatives Considered**:

- **Detox**: More complex setup, requires native project files
- **Appium**: Heavier infrastructure, slower execution
- **Playwright**: Limited mobile support, web-focused

### Test Execution Strategy

**Chosen: Tag-Based Selective Execution**

- PRs run smoke+critical (~6 min)
- Nightly runs full suite (~30-45 min)
- Developers can run feature-specific tags locally

**Alternative**: Run full suite on every PR

- Rejected: Too slow (~45 min) for fast feedback
- Risk: Could miss issues until nightly run

### Test Data Management

**Chosen: Dedicated Test Accounts + Dynamic Data**

- Known credentials for reliable authentication
- Unique identifiers prevent conflicts
- Supabase RLS for automatic isolation

**Alternative**: Generate all data dynamically

- Rejected: Adds complexity to every test
- Authentication would require email verification

## Success Metrics

- [ ] All 60+ tests implemented and passing
- [ ] 100% feature coverage (every user-facing feature tested)
- [ ] All platforms covered (iOS, Android, Web)
- [ ] CI/CD integration complete and running automatically
- [ ] Test execution time: smoke+critical <10min, full <45min
- [ ] Zero test flakiness (idempotent, order-independent)
- [ ] Developer documentation complete

## Security Considerations

- Never commit test credentials to git (use `.env.test`, gitignored)
- Use environment variables for sensitive data injection
- Test accounts should have limited permissions (test database only)
- Regularly rotate test account credentials
- Clean up test data to prevent data leakage
- Use Supabase RLS policies to enforce test data isolation

## Open Questions

1. **Maestro Cloud Account**: Do we have budget for parallel execution? (Improves speed significantly)
2. **Test Database**: Should we use a separate Supabase project for testing or dedicated schema?
3. **Email Verification**: How do we handle email verification in signup tests? (Test email service or manual verification?)
4. **OAuth Testing**: Can we safely test Google OAuth with test accounts, or should we mock?
5. **Test Maintenance**: Who will be responsible for maintaining e2e tests as features evolve?

## Resources

- [Maestro Documentation](https://maestro.dev/)
- [Maestro Best Practices: Structuring Test Suites](https://maestro.dev/blog/maestro-best-practices-structuring-your-test-suite)
- [Expo E2E Testing with Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)
- [React Native Maestro Tips & Tricks](https://dev.to/retyui/best-tips-tricks-for-e2e-maestro-with-react-native-2kaa)
- [GitHub Issue #29](https://github.com/BillChirico/12-Step-Tracker/issues/29)

## Next Steps

1. Review and approve this design document
2. Set up Maestro Cloud account (if budget approved)
3. Create test accounts in Supabase
4. Begin Phase 1: Foundation work
5. Schedule regular check-ins to track progress

---

**Document Status**: Approved
**Implementation Tracking**: GitHub Issue #29
**Last Updated**: 2025-11-13
