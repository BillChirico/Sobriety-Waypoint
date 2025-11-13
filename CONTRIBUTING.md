# Contributing to 12-Step Tracker

Thank you for your interest in contributing to 12-Step Tracker! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing Requirements](#testing-requirements)
- [Code Quality Standards](#code-quality-standards)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project is committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate of others
- Focus on constructive feedback
- Accept differing viewpoints gracefully
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js (v22 or later)
- pnpm (latest version)
- Git
- A Supabase account for database access
- Expo CLI (installed via npx)

For mobile development:

- **iOS**: macOS, Xcode, and iOS Simulator
- **Android**: Android Studio and Android SDK

### Setup

1. **Fork and Clone**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/12-Step-Tracker.git
   cd 12-Step-Tracker
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Environment Variables**:
   Create a `.env` file:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

4. **Start Development Server**:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names following this pattern:

- `feature/description` - For new features
- `fix/description` - For bug fixes
- `docs/description` - For documentation updates
- `refactor/description` - For code refactoring
- `test/description` - For adding or updating tests

Examples:

- `feature/task-notifications`
- `fix/login-validation-error`
- `docs/update-testing-guide`

### Making Changes

1. **Create a Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**:
   - Follow the [Code Quality Standards](#code-quality-standards)
   - Write tests for new functionality
   - Update documentation as needed

3. **Run Tests Locally**:

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```

4. **Commit Your Changes**:
   Follow the [Commit Message Guidelines](#commit-message-guidelines)

5. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Testing Requirements

**All pull requests must include appropriate tests.** This is not optional.

### What to Test

- **Components**: Test user interactions, rendering, and state changes
- **Contexts**: Test state management and provider behavior
- **Screens**: Test navigation, form submission, and error handling
- **Utilities**: Test pure functions and validation logic

### Testing Patterns

1. **Use Test Templates**: Start with templates from `docs/templates/`
2. **Custom Render**: Use `renderWithProviders` from `test-utils/render`
3. **Mock APIs**: Use MSW handlers for Supabase API mocking
4. **Test Fixtures**: Use fixtures from `__tests__/fixtures/`
5. **User-Centric**: Focus on user behavior, not implementation details

### Coverage Requirements

All PRs must:

- **Maintain or improve** code coverage (80% minimum)
- **Pass all unit tests** in CI
- **Pass all E2E tests** in CI (when applicable)

Run coverage locally:

```bash
pnpm test -- --coverage
```

### E2E Tests

For critical user flows, add Maestro E2E tests:

```bash
# Record new flow
pnpm maestro:record

# Test flow
maestro test .maestro/flows/your-flow.yaml
```

Add `testID` props to components for reliable E2E selection.

## Code Quality Standards

### TypeScript

- **Strict Mode**: All code must pass TypeScript strict mode
- **No `any` Types**: Use proper types or `unknown` when necessary
- **Type Imports**: Use `import type` for type-only imports

### Code Style

- **Prettier**: All code must be formatted with Prettier
- **ESLint**: Follow Expo's ESLint configuration
- **Path Aliases**: Use `@/` for imports (e.g., `@/components/Button`)

### React Native Specific

- **Theme Usage**: Always use `useTheme()` hook for colors
- **Platform Code**: Use `Platform.select()` or conditional imports
- **Accessibility**: Include proper labels, roles, and hints
- **Test IDs**: Add `testID` props for E2E testing

### Pre-commit Hooks

The project uses Husky and lint-staged for automatic code quality checks:

- **Prettier** formats all staged files
- **ESLint** lints and auto-fixes JavaScript/TypeScript files

These run automatically on commit. Ensure they pass before pushing.

## Pull Request Process

### Before Creating a PR

1. ✅ **Run all checks locally**:

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```

2. ✅ **Ensure tests pass**:
   - Unit tests pass locally
   - Coverage thresholds met (80%)
   - E2E tests pass (if applicable)

3. ✅ **Update documentation**:
   - Update README if adding features
   - Update TESTING.md if changing test patterns
   - Add/update comments for complex logic

### Creating the PR

1. **Push to Your Fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**:
   - Go to the main repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template completely

3. **PR Title and Description**:
   - Use a clear, descriptive title
   - Reference related issues (e.g., "Fixes #123")
   - Describe what changed and why
   - Include testing instructions
   - Add screenshots for UI changes

### PR Template

```markdown
## Description

[Brief description of changes]

## Related Issues

Fixes #[issue number]

## Changes Made

- [List of changes]

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added (if applicable)
- [ ] E2E tests added (if applicable)
- [ ] Manual testing completed
- [ ] Coverage maintained/improved

## Checklist

- [ ] Code follows project style guidelines
- [ ] TypeScript strict mode passes
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Commit messages follow guidelines
```

### CI/CD Requirements

All PRs must pass:

- ✅ **Linting and Type Checking**
- ✅ **Unit Tests** (80% coverage minimum)
- ✅ **E2E Tests** (when enabled)
- ✅ **Build for Web**
- ✅ **Build for iOS/Android** (triggered asynchronously)

Monitor the Actions tab for build status.

### Code Review

- **At least 1 approval** required before merge
- Address all review comments
- Re-request review after making changes
- Be responsive to feedback

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Scope

The scope specifies what part of the codebase is affected:

- `auth` - Authentication
- `tasks` - Task management
- `messages` - Messaging
- `profile` - User profile
- `steps` - 12-step content
- `ui` - UI components
- `api` - API/Supabase
- `tests` - Testing infrastructure

### Examples

```
feat(tasks): add task completion notifications

Implemented push notifications when a sponsee completes a task.
Notifications are sent to the sponsor in real-time using Supabase
realtime subscriptions.

Closes #123
```

```
fix(auth): resolve login validation error

Fixed issue where email validation regex was too strict and
rejected valid email addresses with plus signs.

Fixes #456
```

```
test(components): add tests for Button component

Added comprehensive tests for Button component including:
- Rendering with different props
- Press event handling
- Accessibility labels
- Loading states

Coverage increased from 75% to 85%
```

### Commit Message Best Practices

- Use imperative mood ("add" not "added" or "adds")
- Don't end subject line with a period
- Capitalize subject line
- Limit subject line to 50 characters
- Wrap body at 72 characters
- Explain what and why, not how

## Additional Resources

- [Testing Guide](docs/TESTING.md) - Comprehensive testing documentation
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Detailed development guide
- [API Documentation](docs/API_SUPABASE.md) - Supabase API reference
- [CI/CD Documentation](.github/CICD.md) - CI/CD pipeline details

## Questions?

If you have questions or need help:

1. Check existing documentation in `docs/`
2. Search existing issues and discussions
3. Create a new issue with the `question` label
4. Reach out to maintainers

## License

By contributing to 12-Step Tracker, you agree that your contributions will be licensed under the same license as the project.
