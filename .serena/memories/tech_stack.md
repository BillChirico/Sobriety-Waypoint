# Tech Stack

## Core Framework

- **Expo**: 54 (with New Architecture enabled)
- **React Native**: 0.81.5
- **React**: 19
- **TypeScript**: Strict mode enabled

## Routing

- **Expo Router**: v6 (file-based routing with typed routes)
- Navigation based on authentication state and user profile

## Backend & Database

- **Supabase**: Complete backend solution
  - PostgreSQL database
  - Authentication (email/password + Google OAuth)
  - Row Level Security (RLS) for multi-tenant data isolation
  - Real-time subscriptions
  - Storage

## State Management & Storage

- **Context API**: For global state (Auth, Theme)
- **expo-secure-store**: Secure native storage (iOS/Android)
- **localStorage**: Web storage
- **AsyncStorage**: Theme persistence

## UI & Icons

- **lucide-react-native**: Icon library
- Custom theme system with light/dark modes

## Development Tools

- **EAS (Expo Application Services)**: Build and deployment
- **TypeScript**: Static typing with strict mode
- **ESLint**: Code quality and style checking
- **Metro**: JavaScript bundler (single bundle for web)

## Authentication

- Supabase Auth with custom storage adapter
- Platform-aware session persistence
- Auto-refresh and session management
- Google OAuth integration with deep linking

## Platform Support

- iOS (Bundle ID: `com.billchirico.12steptracker`)
- Android (Package: `com.billchirico.twelvesteptracker`)
- Web (responsive design)

## Key Libraries

- **@react-navigation**: Under the hood via Expo Router
- **expo-secure-store**: Secure credential storage
- **@supabase/supabase-js**: Supabase client
- URL polyfills for React Native compatibility
