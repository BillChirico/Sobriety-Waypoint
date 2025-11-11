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
- **Secure Authentication**: Email/password and Google OAuth sign-in
- **Theme Support**: Light and dark mode with system preference detection

## Tech Stack

- **Framework**: Expo 54 with React Native 0.81.4 and React 19
- **Router**: Expo Router v6 (file-based routing with typed routes)
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth (email/password + Google OAuth)
- **Storage**: expo-secure-store (native) / localStorage (web)
- **Language**: TypeScript with strict mode
- **Icons**: lucide-react-native

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

## Google OAuth Setup

Google Sign-In is integrated but requires additional configuration. See `GOOGLE_OAUTH_SETUP.md` for detailed setup instructions including:

- Google Cloud Console configuration
- Supabase provider setup
- OAuth redirect URIs
- Mobile deep linking configuration

**App Details:**

- Bundle ID (iOS): `com.billchirico.12steptracker`
- Package name (Android): `com.billchirico.twelvesteptracker`
- Deep link scheme: `12stepstracker://`

## EAS Build

This project is configured for Expo Application Services (EAS) builds:

```bash
# Development build
eas build --profile development

# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

EAS Project ID: `4652ad8b-2e44-4270-8612-64c4587219d8`

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
2. **Build** - Creates production web build

### GitHub Secrets Required

For the build job to work, configure these secrets in your GitHub repository settings:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Workflow Features

- ✅ **Dependency Caching** - Uses pnpm cache for faster builds
- ✅ **Parallel Jobs** - Lint/typecheck and build run in parallel after linting passes
- ✅ **Build Artifacts** - Web builds are stored as artifacts for 7 days
- ✅ **Node.js 22** - Uses latest LTS version of Node.js
- ✅ **Latest pnpm** - Automatically uses the latest pnpm version

## Additional Documentation

- `CLAUDE.md` - Detailed project architecture and code patterns
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth configuration guide
- `supabase/migrations/` - Database schema and RLS policies
- `.github/workflows/ci.yml` - CI/CD pipeline configuration

## License

Private and confidential. All rights reserved.
