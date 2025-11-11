# Architecture

## File-Based Routing Structure

The app uses Expo Router v6 with file-based routing:

```
app/
├── _layout.tsx           # Root layout with AuthProvider and navigation logic
├── login.tsx             # Login screen (unauthenticated)
├── signup.tsx            # Signup screen (unauthenticated)
├── onboarding.tsx        # Role selection (authenticated, no profile)
└── (tabs)/               # Main app (authenticated + profile complete)
    ├── _layout.tsx       # Tab navigation layout
    ├── index.tsx         # Home/Dashboard
    ├── steps.tsx         # 12 Steps content and progress
    ├── tasks.tsx         # Task assignments from sponsor
    ├── messages.tsx      # Direct messaging
    └── profile.tsx       # User profile and settings
```

## Navigation Flow

The root layout (`app/_layout.tsx`) enforces this navigation hierarchy:

1. **No session** → `/login`
2. **Session but no profile** → `/onboarding`
3. **Session + profile but no role** → `/onboarding`
4. **Session + complete profile** → `/(tabs)` (main app)

This centralized auth guard prevents unauthorized access to protected routes.

## Context Providers

### AuthContext (`contexts/AuthContext.tsx`)

Manages authentication and user state:

- **State**: `session`, `user`, `profile`, `loading`
- **Methods**: `signIn`, `signUp`, `signOut`, `signInWithGoogle`
- **Features**:
  - Auto-creates profiles for new users
  - Session persistence via platform-specific storage
  - Google OAuth integration with deep linking
  - Profile synchronization

### ThemeContext (`contexts/ThemeContext.tsx`)

Manages app theme:

- **State**: `theme` ('light' | 'dark' | 'system'), `isDark`, `colors`
- **Methods**: `setTheme`
- **Features**:
  - Persists theme preference to AsyncStorage
  - System theme detection and auto-switching
  - Predefined color palettes for both modes

## Key Directories

```
├── app/                  # Expo Router screens
├── contexts/             # React Context providers
├── lib/                  # Utilities and clients (Supabase)
├── types/                # TypeScript type definitions
├── supabase/migrations/  # Database schema and migrations
└── assets/               # Images, fonts, etc.
```

## Supabase Integration

### Client Setup (`lib/supabase.ts`)

- Platform-aware storage adapter (SecureStore/localStorage)
- Auto-refresh enabled
- Session persistence
- URL polyfill for React Native

### Type Definitions (`types/database.ts`)

Complete TypeScript definitions for:

- **Tables**: `profiles`, `tasks`, `messages`, `sponsor_sponsee_relationships`, `steps_content`, `notifications`, `relapses`, `invite_codes`
- **Enums**: `UserRole`, `RelationshipStatus`, `TaskStatus`, `NotificationType`

## Security Model

### Row Level Security (RLS)

All Supabase tables have RLS policies ensuring:

- Users can only access their own data
- Sponsors can view their sponsees' data
- Sponsees can view their sponsor's data
- Messages only visible to sender/recipient
- Private relapse tracking

### Authentication Guards

- Centralized in root layout
- No additional auth checks needed in individual screens
- Automatic redirects based on auth state

## Platform-Specific Considerations

### Storage

- **Native (iOS/Android)**: expo-secure-store
- **Web**: localStorage
- Abstracted via storage adapter pattern

### UI Adjustments

- Tab bar height: 90px (web) vs 85px (native)
- Theme-aware styling via `useTheme()` hook
- Platform-specific imports with conditionals

### Deep Linking

- Scheme: `12stepstracker://`
- Used for Google OAuth redirects on mobile
