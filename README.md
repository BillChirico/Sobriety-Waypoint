# 12-Step Tracker

A React Native mobile application for tracking AA recovery progress and facilitating sponsor-sponsee relationships through the 12-step program.

## Overview

12-Step Tracker helps individuals in recovery stay connected with their sponsors, track progress through the 12 steps, complete assigned tasks, and maintain accountability in their recovery journey.

## Features

- **Sponsor-Sponsee Relationships**: Connect sponsors with sponsees through invite codes
- **Task Management**: Sponsors can assign step-based tasks to sponsees
- **Progress Tracking**: Monitor completion of steps and tasks
- **Direct Messaging**: Private communication between sponsors and sponsees
- **Step Content**: Access to 12-step program content and reflection prompts
- **Sobriety Tracking**: Track sobriety dates and recovery milestones
- **Relapse Support**: Private relapse tracking and recovery restart functionality
- **Cross-Platform**: Runs on iOS, Android, and web
- **Secure Authentication**: Multiple sign-in options
  - Email/password authentication
  - Google OAuth (configured)
  - Facebook Sign In (configured)
  - Apple Sign In (planned)
- **Theme Support**: Light and dark mode with system preference detection

## Tech Stack

- **Framework**: Expo 54 with React Native 0.81.5 and React 19
- **Router**: Expo Router v6 (file-based routing with typed routes)
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with multiple providers
  - Email/password
  - Google OAuth (see GOOGLE_OAUTH_SETUP.md)
  - Facebook Sign In (see FACEBOOK_SIGNIN_SETUP.md)
  - Apple Sign In (planned, design in docs/plans/)
- **Storage**: expo-secure-store (native) / localStorage (web)
- **Language**: TypeScript with strict mode
- **Icons**: lucide-react-native

## Error Tracking

This project uses [Sentry](https://sentry.io) for production error monitoring and crash reporting.

### Features

- 🔒 **Privacy-first**: Automatically scrubs sensitive recovery data (messages, sobriety dates, personal information)
- 🎯 **Production-only**: Sentry is disabled in development to avoid noise
- 📊 **Full observability**: Error tracking, performance monitoring, and crash reporting
- 🗺️ **Source maps**: Automatic upload via EAS builds for readable stack traces
- 👤 **User context**: Tracks user ID and role for better debugging (no PII)

### Setup

See [docs/SENTRY_SETUP.md](docs/SENTRY_SETUP.md) for complete setup instructions including:

- Creating a Sentry account and project
- Configuring environment variables
- Setting up EAS secrets
- Configuring GitHub Actions

### Environment Variables

For production builds:

```
EXPO_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
SENTRY_ORG=<your-sentry-org>
SENTRY_PROJECT=<your-sentry-project>
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v22 or later recommended)
- **pnpm** (latest version)
- **Expo CLI**: Installed via `npx` or globally
- **For iOS Development** (macOS only):
  - Xcode (latest version)
  - iOS Simulator
  - CocoaPods
- **For Android Development**:
  - Android Studio
  - Android SDK (API 33 or later)
  - Android Emulator or physical device

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd 12-Step-Tracker
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_FACEBOOK_APP_ID=<your-facebook-app-id>  # Optional, for Facebook Sign In
```

### 4. Set Up Supabase

The database schema is located in `supabase/migrations/`. You'll need to:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in your Supabase project
3. Configure Row Level Security (RLS) policies as defined in the migrations

## Development Commands

### Start Development Server

```bash
pnpm dev
```

Starts the Expo development server with telemetry disabled. Scan the QR code with Expo Go app or use a simulator.

### Run on iOS

```bash
pnpm ios
```

Builds and runs the app on iOS Simulator. **Requires macOS and Xcode.**

This compiles the native iOS code and installs the app on the simulator.

### Run on Android

```bash
pnpm android
```

Builds and runs the app on Android Emulator. **Requires Android Studio and Android SDK.**

This compiles the native Android code and installs the app on the emulator or connected device.

### Build for Web

```bash
pnpm build:web
```

Exports the app for web deployment to the `dist` folder.

### Type Checking

```bash
pnpm typecheck
```

Runs TypeScript compiler in check mode without emitting files.

### Linting

```bash
pnpm lint
```

Runs ESLint using Expo's lint configuration.

### Code Formatting

```bash
pnpm format
```

Formats all code using Prettier.

```bash
pnpm format:check
```

Checks if code is properly formatted without making changes.

### Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) for Git hooks with [lint-staged](https://github.com/lint-staged/lint-staged) to ensure code quality before commits.

**Pre-commit Hook**: Automatically runs on every commit to:

- **Format code**: Prettier auto-formats **all** staged files (uses `--ignore-unknown` for unsupported types)
- **Lint and fix**: ESLint auto-fixes staged JavaScript/TypeScript files
- **Auto-stage**: Fixed files are automatically added back to staging

**Configuration**:

- Hook script: `.husky/pre-commit`
- Lint-staged config: `package.json` → `lint-staged` section
- Detailed documentation: `.github/GIT_HOOKS.md`

The hooks run only on **staged files**, keeping commits fast (typically <1 second) and ensuring all committed code meets quality standards.

**Setup**: Hooks are automatically installed when you run `pnpm install` (via the `prepare` script).

**Skip hooks** (not recommended):

```bash
git commit --no-verify
# or
git commit -n
```

**Note**: Pre-commit hooks do NOT run TypeScript type checking (too slow). Run `pnpm typecheck` manually before pushing, or let CI catch type errors.

## Testing

[![Tests](https://github.com/BillChirico/12-Step-Tracker/workflows/CI/badge.svg)](https://github.com/BillChirico/12-Step-Tracker/actions)
[![Coverage](https://codecov.io/gh/BillChirico/12-Step-Tracker/branch/main/graph/badge.svg)](https://codecov.io/gh/BillChirico/12-Step-Tracker)

This project uses comprehensive testing with unit tests, integration tests, and E2E tests. See [docs/TESTING.md](docs/TESTING.md) for detailed testing guide and best practices.

### Quick Start

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests with coverage report
pnpm test -- --coverage

# Run specific test file
pnpm test path/to/test.test.ts
```

### Unit and Integration Tests

The project uses **Jest** and **React Native Testing Library** for unit and integration testing:

- ✅ **Jest** - Test runner and assertion library
- ✅ **React Native Testing Library** - Component testing with user-centric queries
- ✅ **MSW (Mock Service Worker)** - API mocking for Supabase calls
- ✅ **Custom test utilities** - Helper functions and fixtures in `test-utils/`

**Test Structure:**

```
__tests__/
  fixtures/          # Test data factories
  examples/          # Example test patterns
  lib/              # Utility tests
  components/       # Component tests
mocks/              # MSW handlers and mock database
test-utils/         # Custom render and helpers
```

### E2E Tests with Maestro

The project uses **Maestro** for end-to-end testing on real devices and simulators.

```bash
# Run all E2E flows
pnpm maestro

# Run specific flow
maestro test .maestro/flows/01-authentication.yaml

# Record new flow interactively
pnpm maestro:record
```

See [.maestro/README.md](.maestro/README.md) for E2E testing documentation.

### Coverage Requirements

The project enforces **80% minimum code coverage**:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

Coverage is tracked in CI and reported to [Codecov](https://codecov.io).

### Test Templates

Pre-built test templates are available in `docs/templates/`:

- `component.test.template.tsx` - Component testing
- `hook.test.template.ts` - Custom hook testing
- `integration.test.template.tsx` - Integration testing
- `maestro-flow.template.yaml` - E2E flow testing

### Writing Tests

All new features must include appropriate tests:

- **Components**: Test user interactions, rendering, and state changes
- **Contexts**: Test state management and provider behavior
- **Screens**: Test navigation, form submission, and error handling
- **Utilities**: Test pure functions and validation logic

See [docs/TESTING.md](docs/TESTING.md) for comprehensive testing guide.

## Project Structure

```
12-Step-Tracker/
├── app/                    # Expo Router file-based routing
│   ├── (tabs)/            # Tab-based navigation (main app)
│   ├── _layout.tsx        # Root layout with auth navigation
│   ├── login.tsx          # Login screen
│   ├── signup.tsx         # Sign up screen
│   └── onboarding.tsx     # Role selection for new users
├── components/            # Reusable React components
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # Authentication state and methods
│   └── ThemeContext.tsx   # Theme management (light/dark)
├── lib/                   # Utility libraries
│   └── supabase.ts        # Supabase client configuration
├── types/                 # TypeScript type definitions
│   └── database.ts        # Database schema types
├── supabase/              # Supabase migrations and config
│   └── migrations/        # Database schema migrations
└── assets/                # Images, fonts, and other static files
```

## Authentication Flow

The app enforces a strict navigation flow:

1. **Unauthenticated users** → `/login`
2. **Authenticated but no profile** → `/onboarding`
3. **Authenticated with incomplete profile** → `/onboarding`
4. **Fully set up users** → `/(tabs)` (main app)

## OAuth and Social Sign In Setup

The app supports multiple authentication providers beyond email/password:

### Google OAuth

Google Sign-In is integrated but requires additional configuration. See `GOOGLE_OAUTH_SETUP.md` for detailed setup instructions including:

- Google Cloud Console configuration
- Supabase provider setup
- OAuth redirect URIs
- Mobile deep linking configuration

### Facebook Sign In

Facebook Sign In is integrated but requires additional configuration. See `FACEBOOK_SIGNIN_SETUP.md` for detailed setup instructions including:

- Facebook App creation and configuration
- Supabase provider setup
- Native app configuration (iOS/Android)
- Environment variable setup

### Apple Sign In

Apple Sign In design is complete and implementation is planned. See `docs/plans/2025-11-12-apple-signin-design.md` for the implementation plan.

**App Details:**

- Bundle ID (iOS): `com.billchirico.12steptracker`
- Package name (Android): `com.billchirico.twelvesteptracker`
- Deep link scheme: `12stepstracker://`

## EAS Build

This project is configured for Expo Application Services (EAS) builds:

```bash
# Development build
eas build --profile development --platform [ios|android]

# Preview build (used by CI/CD)
eas build --profile preview --platform [ios|android]

# Production build
eas build --profile production --platform [ios|android]

# Build for both platforms
eas build --profile preview --platform all
```

**EAS Project ID**: `4652ad8b-2e44-4270-8612-64c4587219d8`

### Build Profiles

The project includes three build profiles configured in `eas.json`:

- **development**: Development client with internal distribution for testing
- **preview**: Internal distribution for CI/CD and QA testing (uses Release configuration)
- **production**: Production builds with auto-increment version numbers

The **preview** profile is used by the CI/CD pipeline and includes:

- Internal distribution for easy testing
- OTA update channel (`preview`)
- Environment variables for Supabase integration
- Release build configuration for iOS
- APK output for Android (faster than AAB for testing)

## Database Schema

The database includes the following main tables:

- **profiles**: User information, roles, sobriety dates, preferences
- **sponsor_sponsee_relationships**: Sponsor-sponsee connections
- **tasks**: Step-based assignments
- **messages**: Direct messaging
- **steps_content**: 12-step program content
- **notifications**: In-app notifications
- **invite_codes**: Sponsor invitation system
- **relapses**: Private relapse tracking

All tables are secured with Row Level Security (RLS) policies ensuring proper data access control.

## Contributing

This is a private project for recovery support. If you're contributing, please ensure:

- All code passes TypeScript type checking (`pnpm typecheck`)
- Code follows the linting rules (`pnpm lint`)
- Code is properly formatted (`pnpm format:check` or run `pnpm format`)
- Test thoroughly on both iOS and Android platforms
- Respect user privacy and data security

## Continuous Integration

This project uses GitHub Actions for automated testing and builds.

### CI Pipeline

The CI workflow runs on every push to `main` and `develop` as well as on all pull requests:

1. **Lint, Format, and Type Check** - Validates code quality, formatting, and TypeScript types
2. **Build for Web** - Creates production web build
3. **Build for Android** - Triggers EAS build for Android (preview profile)
4. **Build for iOS** - Triggers EAS build for iOS (preview profile)

### Claude Code Review

Pull requests automatically trigger an AI-powered code review workflow that:

- 🔄 **Updates in real-time** - Uses a sticky comment that tracks review progress
- ⚡ **Cancels outdated reviews** - New commits automatically cancel previous reviews
- 🔍 **Comprehensive analysis** - Checks TypeScript types, ESLint rules, and Prettier formatting
- 🤖 **AI insights** - Detects common issues like `any` types, console.logs, and TODO comments
- 📊 **Quality report** - Provides detailed pass/fail status for all checks

The review comment updates throughout the process, showing progress from "in progress" to final results with actionable recommendations.

### GitHub Secrets Required

For the build jobs to work, configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret Name                     | Description                      | How to Get It                                                                                         |
| ------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL        | From your Supabase project settings                                                                   |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key      | From your Supabase project API settings                                                               |
| `EXPO_TOKEN`                    | Expo access token for EAS builds | Run `eas login && eas whoami` or create at https://expo.dev/accounts/[account]/settings/access-tokens |

**Setting up `EXPO_TOKEN`**:

1. Login to Expo: `eas login`
2. Create a token: Visit https://expo.dev/accounts/[your-account]/settings/access-tokens
3. Click "Create Token" and give it a descriptive name (e.g., "GitHub Actions")
4. Copy the token immediately (it won't be shown again)
5. Add it to GitHub: Repository Settings → Secrets and variables → Actions → New repository secret

### Workflow Features

- ✅ **Dependency Caching** - Uses pnpm cache for faster builds
- ✅ **Parallel Jobs** - Lint/typecheck and build jobs run in parallel after linting passes
- ✅ **Multi-Platform Builds** - Builds for Web, Android, and iOS in parallel
- ✅ **EAS Build Integration** - Uses Expo Application Services for native mobile builds
- ✅ **Build Artifacts** - Web builds are stored as artifacts for 7 days
- ✅ **Node.js 22** - Uses latest LTS version of Node.js
- ✅ **Latest pnpm** - Automatically uses the latest pnpm version
- ✅ **Concurrency Control** - Automatically cancels outdated workflow runs when new commits are pushed

### Monitoring Builds

**GitHub Actions Workflow**:

- View workflow runs: Repository → Actions tab
- Check individual job logs for detailed output
- Download web build artifacts from completed workflow runs

**EAS Mobile Builds**:

- Monitor builds: https://expo.dev/accounts/[account]/projects/12-step-tracker/builds
- View detailed build logs and download APK/IPA files
- Builds are triggered by CI but complete asynchronously on EAS infrastructure
- Receive build notifications via email (configure in Expo account settings)

## Additional Documentation

- `CLAUDE.md` - Detailed project architecture, MCP server usage, and code patterns
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth configuration guide
- `FACEBOOK_SIGNIN_SETUP.md` - Facebook Sign In configuration guide
- `docs/TESTING.md` - Comprehensive testing guide and best practices
- `.github/CICD.md` - Comprehensive CI/CD documentation including Claude Code Review
- `.github/GIT_HOOKS.md` - Git hooks setup and troubleshooting guide
- `supabase/migrations/` - Database schema and RLS policies
- `docs/plans/` - Design documents for features (including Apple Sign In)
- `.github/workflows/ci.yml` - Main CI/CD pipeline configuration
- `.github/workflows/claude-code-review.yml` - AI code review workflow configuration

## License

Private and confidential. All rights reserved.
