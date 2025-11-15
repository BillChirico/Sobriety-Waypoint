# Suggested Commands

## Development Commands

### Start Development Server

```bash
pnpm dev
```

Starts the Expo development server with telemetry disabled.

### Platform-Specific Development

```bash
pnpm ios
```

Runs the app on iOS simulator (requires Xcode on macOS).

```bash
pnpm android
```

Runs the app on Android emulator/device (requires Android Studio).

```bash
pnpm web
```

Runs the app in a web browser.

### Type Checking

```bash
pnpm typecheck
```

Runs TypeScript type checking across the codebase.

### Linting

```bash
pnpm lint
```

Runs ESLint to check code quality and style.

## Git Hooks

Pre-commit hooks are automatically installed via Husky and will run when you commit changes.

The pre-commit hook will:

- Format staged files with Prettier
- Lint and auto-fix staged TypeScript/JavaScript files with ESLint

To skip hooks (not recommended):

```bash
git commit --no-verify
```

## Code Formatting

```bash
pnpm format
```

Formats all code using Prettier.

```bash
pnpm format:check
```

Checks if code is properly formatted without making changes.

## Testing Commands

### Unit Tests

```bash
pnpm test
```

Runs all Jest tests once.

```bash
pnpm test:watch
```

Runs Jest in watch mode for active development.

```bash
pnpm test:ci
```

Runs tests in CI mode with limited workers (used by GitHub Actions).

```bash
pnpm test:coverage
```

Runs tests and generates coverage report (requires ≥80% coverage).

### End-to-End Tests

```bash
pnpm maestro
```

Runs all Maestro E2E test flows from `.maestro/flows/` directory.

```bash
pnpm maestro:record
```

Opens Maestro Studio to record new E2E test flows.

## Build Commands

### Build for Web

```bash
pnpm build:web
```

Creates a production web build (static export).

### Platform Exports

```bash
pnpm build:android
```

Exports the app for Android platform.

```bash
pnpm build:ios
```

Exports the app for iOS platform.

**Note**: For native builds, use EAS Build (`eas build --platform ios/android`) instead of these export commands.

## Git Usage with GitButler

**IMPORTANT**: This project is managed by GitButler.

**DO NOT** run the following git commands:

- `git commit`
- `git checkout`
- `git rebase`
- `git cherry-pick`

All commits and branch operations must be done through the GitButler interface.

You **MAY** run git commands that provide information:

- `git status`
- `git log`
- `git diff`
- `git branch -v`

## Platform Notes

- Development works across iOS, Android, and Web
- Use platform-specific testing when making UI changes
- Web uses Metro bundler with single bundle output
