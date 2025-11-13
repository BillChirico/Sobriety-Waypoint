# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: MCP Server Usage

**CRITICAL REQUIREMENT**: This project is configured with MCP (Model Context Protocol) servers that provide specialized tools and capabilities. You MUST follow these guidelines:

### MCP Usage Rules

1. **ALWAYS use MCP servers** whenever they are available and appropriate for the task at hand
2. **ALWAYS use ToolHive** (`mcp__toolhive-mcp-optimizer__find_tool`) to discover relevant MCP tools BEFORE implementing any solution
3. **Prioritize MCP tools** over generic approaches - they provide optimized, specialized functionality
4. **Search for tools first** - Don't assume you need to implement something from scratch when an MCP tool might exist
5. **Always** use memory-keeper to track progress
6. **Save** architectural decisions and test results
7. **Create** checkpoints before context limits

### Available MCP Servers

- **Serena** (`mcp__serena__*`): Semantic code navigation and editing with symbol-based operations
  - Use for: Finding symbols, searching code patterns, editing code by symbol, understanding code structure
  - Prefer this over reading entire files

- **Memory Keeper** (`mcp__memory-keeper__*`): Context and session management with git tracking
  - Use for: Saving project context, tracking decisions, managing development sessions

- **Fetch** (`mcp__fetch__*`): Advanced web content fetching with image support
  - Use for: Fetching web content, extracting images, converting HTML to Markdown

- **ToolHive** (`mcp__toolhive-mcp-optimizer__*`): Tool discovery and execution optimization
  - **Use this FIRST** when you need to find the right tool for a task
  - Functions: `find_tool`, `call_tool`, `list_tools`

- **Sequential Thinking** (`mcp__sequential-thinking__*`): Complex problem-solving with chain-of-thought reasoning
  - Use for: Breaking down complex problems, planning multi-step solutions

### Example Workflow

When given a task:
1. Use ToolHive's `find_tool` to discover if an MCP tool can help
2. Use the specialized MCP tool if available
3. Only use generic approaches if no MCP tool exists

This is NOT optional - MCP tools provide significant benefits in efficiency, accuracy, and capability.

## Project Overview

12-Step Tracker is a React Native/Expo app built with TypeScript for tracking AA recovery progress. It facilitates sponsor-sponsee relationships, task assignments, and progress tracking through the 12 steps of recovery.

## Tech Stack

- **Framework**: Expo 54 with React Native 0.81.5 and React 19
- **Router**: Expo Router v6 (file-based routing with typed routes)
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth (email/password + Google OAuth)
- **Storage**: expo-secure-store (native) / localStorage (web)
- **Language**: TypeScript with strict mode
- **Icons**: lucide-react-native

## Development Commands

```bash
# Start development server (with telemetry disabled)
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build for web
pnpm build:web
```

## Architecture

### Routing Structure (app/)

The app uses Expo Router's file-based routing with group routes:

- **Root Layout** (`app/_layout.tsx`): Wraps app in AuthProvider and handles navigation based on auth state
- **Auth Screens**: `login.tsx`, `signup.tsx` (unauthenticated)
- **Onboarding**: `onboarding.tsx` (required for new users to set role)
- **Main App** (`app/(tabs)/`): Tab-based navigation (requires authentication + completed profile)
  - `index.tsx` - Home/Dashboard
  - `steps.tsx` - 12 Steps content and progress
  - `tasks.tsx` - Task assignments from sponsor
  - `messages.tsx` - Direct messaging
  - `profile.tsx` - User profile and settings

### Navigation Logic

The root layout (`app/_layout.tsx`) enforces a strict navigation flow:

1. Unauthenticated users → `/login`
2. Authenticated but no profile → `/onboarding`
3. Authenticated with profile but no role → `/onboarding`
4. Fully set up users → `/(tabs)` (main app)

### Context Providers

**AuthContext** (`contexts/AuthContext.tsx`):
- Manages Supabase session and user state
- Handles sign in/up/out operations
- Provides Google OAuth integration (see GOOGLE_OAUTH_SETUP.md)
- Provides Facebook Sign In integration (see FACEBOOK_SIGNIN_SETUP.md)
- Auto-creates profiles for new OAuth users
- Exposes: `session`, `user`, `profile`, `loading`, auth methods

**ThemeContext** (`contexts/ThemeContext.tsx`):
- Manages light/dark/system theme modes
- Persists theme preference to AsyncStorage
- Provides theme colors and `isDark` boolean
- Theme colors defined for both light and dark modes

### Supabase Integration

**Client** (`lib/supabase.ts`):
- Platform-aware storage adapter (SecureStore for native, localStorage for web)
- Auto-refresh and persist session enabled
- URL polyfill included for React Native compatibility

**Types** (`types/database.ts`):
- Complete TypeScript definitions for all database tables
- Key entities: `Profile`, `Task`, `Message`, `SponsorSponseeRelationship`, `StepContent`, `Notification`, `Relapse`, `InviteCode`
- Enums: `UserRole`, `RelationshipStatus`, `TaskStatus`, `NotificationType`

### Database Schema

Located in `supabase/migrations/`:
- Complete schema with RLS policies for multi-tenant security
- **profiles**: User data with role (sponsor/sponsee/both), sobriety dates, notification preferences
- **sponsor_sponsee_relationships**: Tracks connections between sponsors and sponsees
- **tasks**: Step-based assignments from sponsors to sponsees
- **messages**: Direct messaging between users
- **steps_content**: 12-step program content and reflection prompts
- **notifications**: In-app notifications for various events
- **invite_codes**: Sponsor invitation system
- **relapses**: Private relapse tracking and recovery restart dates

RLS policies ensure:
- Users can only access their own data
- Sponsors can view their sponsees' data
- Sponsees can view their sponsor's data
- Messages only visible to sender/recipient

## Path Aliases

TypeScript paths configured in `tsconfig.json`:
```typescript
"@/*": ["./*"]  // Root-level imports
```

Usage: `import { supabase } from '@/lib/supabase'`

## Google OAuth Setup

Google Sign-In is integrated but requires configuration. See `GOOGLE_OAUTH_SETUP.md` for:
- Google Cloud Console setup
- Supabase provider configuration
- Redirect URI configuration
- Mobile app deep linking (scheme: `12stepstracker://`)

Key details:
- Bundle ID (iOS): `com.billchirico.12steptracker`
- Package name (Android): `com.billchirico.twelvesteptracker`
- OAuth implementation in `AuthContext.tsx` handles both web and native flows

## Facebook Sign In Setup

Facebook Sign In is integrated and requires configuration. See `FACEBOOK_SIGNIN_SETUP.md` for:
- Facebook App creation and configuration
- Supabase provider setup
- OAuth redirect URI configuration
- Native app configuration (iOS/Android)
- Environment variable setup

Key details:
- Bundle ID (iOS): `com.billchirico.12steptracker`
- Package name (Android): `com.billchirico.twelvesteptracker`
- Required environment variable: `EXPO_PUBLIC_FACEBOOK_APP_ID`
- Implementation in `AuthContext.tsx` handles both web (OAuth) and native (expo-facebook SDK) flows
- Auto-creates user profiles on first sign-in with name extracted from Facebook profile

## EAS Build Configuration

Configuration in `eas.json`:
- **development**: Development client with internal distribution
- **preview**: Internal distribution for CI/CD and testing (uses Release configuration)
  - OTA update channel: `preview`
  - iOS: Release build configuration
  - Android: APK build type
  - Includes Supabase environment variables
- **production**: Auto-increment version numbers

EAS project ID: `4652ad8b-2e44-4270-8612-64c4587219d8`

## CI/CD Pipeline

The project uses GitHub Actions for automated testing and multi-platform builds. See `.github/CICD.md` for comprehensive documentation.

### Workflow Overview

**Triggers**: Runs on push to `main`/`develop` branches and on all pull requests

**Jobs** (run in parallel after linting passes):
1. **Lint, Format, and Type Check**: Validates code quality, formatting, and TypeScript types
2. **Build for Web**: Creates production web build with Supabase credentials
3. **Build for Android**: Triggers EAS build for Android (preview profile, uses `--no-wait`)
4. **Build for iOS**: Triggers EAS build for iOS (preview profile, uses `--no-wait`)

**Key Features**:
- **Concurrency Control**: Automatically cancels outdated workflow runs when new commits are pushed
- **Dependency Caching**: Uses pnpm cache for faster builds
- **Parallel Builds**: All three platforms build simultaneously
- **EAS Integration**: Mobile builds run on EAS infrastructure (not GitHub runners)
- **Build Artifacts**: Web builds stored as GitHub artifacts for 7 days

### Required GitHub Secrets

Configure these in repository settings (Settings → Secrets and variables → Actions):
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL (used by all builds)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key (used by all builds)
- `EXPO_TOKEN`: Expo access token for EAS builds (Android/iOS only)

### Monitoring Builds

**GitHub Actions**: Repository → Actions tab (view workflow runs, download web artifacts)
**EAS Builds**: https://expo.dev/accounts/[account]/projects/12-step-tracker/builds

Mobile builds are triggered by CI but complete asynchronously on EAS infrastructure. Check the Expo dashboard for build status, logs, and to download APK/IPA files.

### Code Quality Tools

- **Pre-commit Hooks**: Husky + lint-staged (auto-format and lint on commit)
  - Configuration: `package.json` → `lint-staged` section
  - Hook script: `.husky/pre-commit`
  - Prettier formats **all** staged files (uses `--ignore-unknown`)
  - ESLint fixes staged JavaScript/TypeScript files
  - See `.github/GIT_HOOKS.md` for details
- **Claude Code Review**: AI-powered PR reviews with sticky comments
- **TypeScript Strict Mode**: Full type safety enforcement
- **ESLint**: Expo configuration with custom rules
- **Prettier**: Consistent code formatting

## Environment Variables

Required environment variables (not committed):
```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_FACEBOOK_APP_ID=<your-facebook-app-id>
```

## Development Workflow

### Before Committing

1. Run `pnpm typecheck` to catch type errors (hooks don't run this)
2. Run `pnpm lint` to check code quality (optional - hooks run this automatically)
3. Pre-commit hooks will automatically:
   - Format **all** staged files with Prettier
   - Lint and auto-fix JavaScript/TypeScript with ESLint
   - Only process staged files (fast!)

### Creating Pull Requests

1. Push your branch to trigger CI/CD pipeline
2. Wait for all jobs to pass (lint, web build, Android build, iOS build)
3. Check Expo dashboard for mobile build status if needed
4. Claude Code Review will automatically analyze your PR
5. Address any issues found by CI or code review
6. Request human review once CI passes

### Working with CI/CD

- **Fast Feedback**: CI completes in ~2-3 minutes (plus async EAS builds)
- **Parallel Builds**: All platforms build simultaneously
- **Smart Cancellation**: New commits auto-cancel outdated workflow runs
- **Build Monitoring**: Web artifacts in GitHub, mobile builds in Expo dashboard

## Testing Guidelines

### Test Requirements

All new code must include appropriate tests:
- **Components**: Test user interactions, rendering, and state changes
- **Contexts**: Test state management and provider behavior
- **Screens**: Test navigation, form submission, and error handling
- **Utilities**: Test pure functions and validation logic

### Testing Patterns

1. **Use Custom Render**: Import `renderWithProviders` from `test-utils/render` for components that need context
2. **Mock Supabase**: Use MSW handlers in `__mocks__/handlers/` for API mocking
3. **Test User Behavior**: Focus on user interactions, not implementation details
4. **Fixtures**: Use test data from `test-utils/fixtures/` for consistent test data
5. **Assertions**: Use React Native Testing Library queries and jest-native matchers

### Coverage Requirements

- **Minimum**: 80% coverage for statements, branches, functions, and lines
- **CI Enforcement**: Coverage thresholds enforced in CI/CD pipeline
- **Reporting**: Coverage reports uploaded to Codecov on every PR

### E2E Testing

- **Maestro Flows**: Add E2E tests for critical user journeys
- **Test IDs**: Add `testID` props to components for reliable E2E selection
- **Documentation**: Document test scenarios in `.maestro/README.md`

### Running Tests

```bash
# Unit tests
pnpm test              # Run all tests
pnpm test:watch        # Watch mode for development
pnpm test:coverage     # Generate coverage report

# E2E tests
pnpm maestro           # Run all Maestro flows
pnpm maestro:record    # Record new flow interactively
```

See [docs/TESTING.md](docs/TESTING.md) for comprehensive testing guide.

## Code Patterns

1. **Authentication Guards**: Root layout handles all auth routing logic centrally
2. **Theme Usage**: Always use `useTheme()` hook for consistent theming across platforms
3. **Supabase Queries**: Import typed client from `@/lib/supabase` and use with database types from `@/types/database`
4. **Cross-platform Storage**: Use the adapter pattern (see `lib/supabase.ts`) for platform-specific storage
5. **Row Level Security**: All database operations respect RLS policies - no additional auth checks needed in client code
6. **Testing Changes**: Use EAS local builds for native testing: `eas build --platform [ios|android] --profile development --local`

## Testing Guidelines

### Test Requirements

All new code must include appropriate tests:

- **Components**: Test user interactions, rendering, and state changes
- **Contexts**: Test state management and provider behavior
- **Screens**: Test navigation, form submission, and error handling
- **Utilities**: Test pure functions and validation logic

### Coverage Requirements

- **Minimum**: 80% coverage for statements, branches, functions, and lines
- **CI Enforcement**: Coverage thresholds enforced in CI/CD pipeline
- **Reporting**: Coverage reports uploaded to Codecov on every PR

### Testing Patterns

1. **Use Custom Render**: Import `renderWithProviders` from `test-utils/render` for components that need context
2. **Mock Supabase**: Use MSW handlers in `mocks/handlers/` for API mocking
3. **Test User Behavior**: Focus on user interactions, not implementation details
4. **Fixtures**: Use test data from `test-utils/fixtures/` for consistent test data
5. **Assertions**: Use React Native Testing Library queries and jest-native matchers

### Test Templates

Use pre-built templates from `docs/templates/`:

- `component.test.template.tsx` - Component testing
- `hook.test.template.ts` - Custom hook testing
- `integration.test.template.tsx` - Integration testing
- `maestro-flow.template.yaml` - E2E flow testing

### Running Tests

```bash
# Unit tests
pnpm test              # Run all tests
pnpm test:watch        # Watch mode for development
pnpm test -- --coverage # Generate coverage report

# E2E tests
pnpm maestro           # Run all Maestro flows
pnpm maestro:record    # Record new flow interactively
```

### E2E Testing

- **Maestro Flows**: Add E2E tests for critical user journeys
- **Test IDs**: Add `testID` props to components for reliable E2E selection
- **Documentation**: Document test scenarios in `.maestro/README.md`

For comprehensive testing guide, see [docs/TESTING.md](docs/TESTING.md).

## Platform Considerations

- Expo New Architecture enabled (`newArchEnabled: true`)
- Tab bar height adjusted for web (90px) vs native (85px)
- Conditional imports for platform-specific modules (e.g., SecureStore)
- Web uses single bundle output via Metro
