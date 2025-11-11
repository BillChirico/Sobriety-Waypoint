# Context Providers API Documentation

## Overview

This document provides comprehensive API documentation for the React Context providers used in the 12-Step Tracker application. The app uses two main context providers: `AuthContext` for authentication and user management, and `ThemeContext` for theme management.

## Table of Contents

1. [AuthContext](#authcontext)
2. [ThemeContext](#themecontext)

---

## AuthContext

Location: `contexts/AuthContext.tsx`

The `AuthContext` manages authentication state, user sessions, and profile data throughout the application.

### Usage

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile, signIn, signOut } = useAuth();

  // Use auth state and methods
}
```

### Provider Setup

Wrap your app with `AuthProvider` to enable authentication throughout the component tree:

```typescript
import { AuthProvider } from '@/contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

---

### API Reference

#### Hook: `useAuth()`

Returns the authentication context with the following properties and methods.

**Throws**: Error if used outside of `AuthProvider`

---

### State Properties

#### `session: Session | null`

The current Supabase authentication session.

**Type**: `Session | null`

**Example**:

```typescript
const { session } = useAuth();

if (session) {
  console.log('Access token:', session.access_token);
  console.log('Expires at:', session.expires_at);
}
```

**Session Object**:

- `access_token`: JWT access token
- `refresh_token`: Token for refreshing session
- `expires_at`: Session expiration timestamp
- `user`: User object (same as `user` property below)

---

#### `user: User | null`

The authenticated user object from Supabase Auth.

**Type**: `User | null`

**Example**:

```typescript
const { user } = useAuth();

if (user) {
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
  console.log('Created at:', user.created_at);
}
```

**User Object Properties**:

- `id`: Unique user identifier (UUID)
- `email`: User's email address
- `created_at`: Account creation timestamp
- `user_metadata`: Additional metadata (e.g., from OAuth)
- `app_metadata`: Application-specific metadata

---

#### `profile: Profile | null`

The user's profile data from the `profiles` table.

**Type**: `Profile | null` (see [Type Definitions](#type-definitions))

**Example**:

```typescript
const { profile } = useAuth();

if (profile) {
  console.log('Name:', profile.first_name, profile.last_initial);
  console.log('Role:', profile.role);
  console.log('Sobriety date:', profile.sobriety_date);
}
```

**Profile Object** (see `types/database.ts`):

```typescript
interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_initial: string;
  phone?: string;
  avatar_url?: string;
  role?: 'sponsor' | 'sponsee' | 'both';
  sobriety_date?: string;
  bio?: string;
  timezone: string;
  notification_preferences: {
    tasks: boolean;
    messages: boolean;
    milestones: boolean;
    daily: boolean;
  };
  created_at: string;
  updated_at: string;
}
```

---

#### `loading: boolean`

Indicates whether the authentication state is being initialized.

**Type**: `boolean`

**Example**:

```typescript
const { loading, user } = useAuth();

if (loading) {
  return <LoadingSpinner />;
}

if (!user) {
  return <LoginScreen />;
}

return <MainApp />;
```

**Use Cases**:

- Show loading screen during initial auth check
- Prevent flash of wrong content
- Gate navigation until auth state is known

---

### Methods

#### `signIn(email: string, password: string): Promise<void>`

Authenticates a user with email and password.

**Parameters**:

- `email` (string): User's email address
- `password` (string): User's password

**Returns**: `Promise<void>`

**Throws**: Error if authentication fails

**Example**:

```typescript
const { signIn } = useAuth();

try {
  await signIn('user@example.com', 'password123');
  // User is now signed in
  // Navigate to main app
} catch (error) {
  console.error('Sign in failed:', error);
  // Show error message to user
}
```

**Error Handling**:

```typescript
try {
  await signIn(email, password);
} catch (error: any) {
  if (error.message.includes('Invalid login credentials')) {
    // Show "incorrect email or password" message
  } else if (error.message.includes('Email not confirmed')) {
    // Show "please verify your email" message
  } else {
    // Show generic error message
  }
}
```

---

#### `signInWithGoogle(): Promise<void>`

Authenticates a user using Google OAuth.

**Returns**: `Promise<void>`

**Throws**: Error if authentication fails

**Platform Behavior**:

- **Web**: Opens Google sign-in in same window
- **Native**: Opens Google sign-in in secure in-app browser

**Example**:

```typescript
const { signInWithGoogle } = useAuth();

try {
  await signInWithGoogle();
  // User is now signed in via Google
} catch (error) {
  console.error('Google sign in failed:', error);
  // Show error message to user
}
```

**Web Example**:

```typescript
<Button onPress={async () => {
  try {
    await signInWithGoogle();
  } catch (error) {
    Alert.alert('Error', 'Google sign in failed');
  }
}}>
  Sign in with Google
</Button>
```

**Native Flow**:

1. User taps "Sign in with Google"
2. In-app browser opens with Google sign-in
3. User authenticates with Google
4. Browser redirects to app deep link (`12stepstracker://`)
5. Session is established automatically

**Configuration Required**:
See `GOOGLE_OAUTH_SETUP.md` for setup instructions including:

- Google Cloud Console configuration
- Supabase OAuth provider setup
- Mobile app deep linking configuration

---

#### `signUp(email: string, password: string, firstName: string, lastInitial: string): Promise<void>`

Creates a new user account.

**Parameters**:

- `email` (string): User's email address
- `password` (string): Desired password (min 6 characters)
- `firstName` (string): User's first name
- `lastInitial` (string): User's last initial

**Returns**: `Promise<void>`

**Throws**: Error if sign up fails

**Example**:

```typescript
const { signUp } = useAuth();

try {
  await signUp('newuser@example.com', 'securePassword123', 'John', 'D');
  // Account created, profile created automatically
  // User may need to verify email depending on Supabase settings
} catch (error) {
  console.error('Sign up failed:', error);
}
```

**Automatic Profile Creation**:
The method automatically creates a profile record in the `profiles` table with:

- User's ID (from Supabase Auth)
- Email
- First name
- Last initial (converted to uppercase)
- Default notification preferences
- Current timezone

**Error Handling**:

```typescript
try {
  await signUp(email, password, firstName, lastInitial);
} catch (error: any) {
  if (error.message.includes('already registered')) {
    // Email already exists
  } else if (error.message.includes('Password should be')) {
    // Password doesn't meet requirements
  } else {
    // Other error
  }
}
```

---

#### `signOut(): Promise<void>`

Signs out the current user and clears session data.

**Returns**: `Promise<void>`

**Throws**: Error if sign out fails

**Example**:

```typescript
const { signOut } = useAuth();

try {
  await signOut();
  // User signed out, session cleared
  // Navigate to login screen
} catch (error) {
  console.error('Sign out failed:', error);
}
```

**Side Effects**:

- Clears Supabase session
- Sets `profile` to `null`
- Removes session from secure storage
- Triggers navigation to login screen (handled by app layout)

---

#### `refreshProfile(): Promise<void>`

Manually refreshes the user's profile data from the database.

**Returns**: `Promise<void>`

**Example**:

```typescript
const { refreshProfile, profile } = useAuth();

// After updating profile in database
await supabase
  .from('profiles')
  .update({ bio: 'Updated bio' })
  .eq('id', profile.id);

// Refresh to get updated data
await refreshProfile();

// profile now contains updated data
```

**Use Cases**:

- After updating profile information
- When profile data may have changed externally
- To force-sync profile with database

---

### Internal Behavior

#### Automatic Profile Creation

When a user signs up or signs in via OAuth, the context automatically:

1. Checks if a profile exists for the user
2. If no profile exists, creates one with:
   - User's ID from Supabase Auth
   - Email from Supabase Auth
   - Name parsed from user metadata (OAuth) or provided (email signup)
   - Default notification preferences
   - Current timezone

This ensures every authenticated user always has a profile record.

#### Session Management

The context automatically:

- Restores session on app launch
- Refreshes access tokens before expiration
- Persists session to secure storage
- Handles session expiration gracefully

#### Auth State Change Listener

The context listens for authentication events:

- `SIGNED_IN`: User signed in
- `SIGNED_OUT`: User signed out
- `TOKEN_REFRESHED`: Access token refreshed
- `USER_UPDATED`: User metadata updated

---

### Type Definitions

#### AuthContextType

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastInitial: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

---

### Complete Example

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { signIn, signInWithGoogle, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      setError('');
      await signIn(email, password);
      // Navigation handled by root layout
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  if (user) {
    return <Text>Already signed in!</Text>;
  }

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Button title="Sign In" onPress={handleSignIn} />
      <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
    </View>
  );
}
```

---

## ThemeContext

Location: `contexts/ThemeContext.tsx`

The `ThemeContext` manages the application's color theme (light/dark mode) and provides themed color values throughout the app.

### Usage

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, isDark, setThemeMode } = useTheme();

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Hello World</Text>
    </View>
  );
}
```

### Provider Setup

Wrap your app with `ThemeProvider`:

```typescript
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

---

### API Reference

#### Hook: `useTheme()`

Returns the theme context with color values and theme management methods.

**Throws**: Error if used outside of `ThemeProvider`

---

### State Properties

#### `theme: ThemeColors`

Object containing all themed color values.

**Type**: `ThemeColors`

**Example**:

```typescript
const { theme } = useTheme();

return (
  <View style={{
    backgroundColor: theme.background,
    borderColor: theme.border,
  }}>
    <Text style={{ color: theme.text }}>Title</Text>
    <Text style={{ color: theme.textSecondary }}>Subtitle</Text>
  </View>
);
```

**ThemeColors Interface**:

```typescript
interface ThemeColors {
  // Background colors
  background: string; // Main app background
  surface: string; // Surface/container background
  card: string; // Card background

  // Text colors
  text: string; // Primary text
  textSecondary: string; // Secondary text (less emphasis)
  textTertiary: string; // Tertiary text (least emphasis)

  // Brand colors
  primary: string; // Primary brand color
  primaryLight: string; // Lighter primary variant

  // Border colors
  border: string; // Default border
  borderLight: string; // Lighter border

  // Semantic colors
  error: string; // Error/destructive actions
  success: string; // Success/positive actions

  // Base colors
  white: string; // Pure white
  black: string; // Pure black

  // Font weights (JetBrains Mono)
  fontRegular: string; // Regular weight
  fontMedium: string; // Medium weight
  fontSemiBold: string; // Semi-bold weight
  fontBold: string; // Bold weight
}
```

---

#### Color Values

##### Light Theme

```typescript
{
  background: '#f9fafb',      // Light gray background
  surface: '#ffffff',         // White surface
  card: '#ffffff',            // White card
  text: '#111827',            // Dark gray text
  textSecondary: '#6b7280',   // Medium gray
  textTertiary: '#9ca3af',    // Light gray
  primary: '#007AFF',         // iOS blue
  primaryLight: '#e5f1ff',    // Light blue
  border: '#e5e7eb',          // Light gray border
  borderLight: '#f3f4f6',     // Very light border
  error: '#ef4444',           // Red
  success: '#007AFF',         // Blue
  white: '#ffffff',
  black: '#000000',
}
```

##### Dark Theme

```typescript
{
  background: '#111827',      // Dark gray background
  surface: '#1f2937',         // Lighter dark gray
  card: '#1f2937',            // Lighter dark gray
  text: '#f9fafb',            // Off-white text
  textSecondary: '#9ca3af',   // Light gray
  textTertiary: '#6b7280',    // Medium gray
  primary: '#007AFF',         // iOS blue
  primaryLight: '#003d7a',    // Dark blue
  border: '#374151',          // Dark gray border
  borderLight: '#4b5563',     // Lighter dark border
  error: '#ef4444',           // Red
  success: '#007AFF',         // Blue
  white: '#ffffff',
  black: '#000000',
}
```

---

#### `themeMode: ThemeMode`

The current theme mode setting.

**Type**: `'light' | 'dark' | 'system'`

**Values**:

- `'light'`: Always use light theme
- `'dark'`: Always use dark theme
- `'system'`: Follow device system setting

**Example**:

```typescript
const { themeMode } = useTheme();

console.log('Current mode:', themeMode); // 'light', 'dark', or 'system'
```

---

#### `isDark: boolean`

Indicates whether dark theme is currently active.

**Type**: `boolean`

**Example**:

```typescript
const { isDark } = useTheme();

return (
  <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
);
```

**Calculation**:

- If `themeMode` is `'system'`: Based on device system setting
- If `themeMode` is `'light'`: Always `false`
- If `themeMode` is `'dark'`: Always `true`

---

### Methods

#### `setThemeMode(mode: ThemeMode): void`

Sets the theme mode and persists the preference.

**Parameters**:

- `mode` (`'light' | 'dark' | 'system'`): Theme mode to set

**Returns**: `void`

**Side Effects**:

- Updates theme mode state
- Persists preference to AsyncStorage
- Triggers re-render with new theme colors

**Example**:

```typescript
const { setThemeMode, themeMode } = useTheme();

// Toggle between light and dark
const toggleTheme = () => {
  setThemeMode(themeMode === 'light' ? 'dark' : 'light');
};

// Set to system
const useSystemTheme = () => {
  setThemeMode('system');
};
```

**Theme Selector Example**:

```typescript
import { useTheme } from '@/contexts/ThemeContext';
import { View, Text, TouchableOpacity } from 'react-native';

export function ThemeSelector() {
  const { themeMode, setThemeMode, theme } = useTheme();

  const modes: Array<{ value: ThemeMode; label: string }> = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <View>
      {modes.map((mode) => (
        <TouchableOpacity
          key={mode.value}
          onPress={() => setThemeMode(mode.value)}
          style={{
            padding: 12,
            backgroundColor: themeMode === mode.value
              ? theme.primary
              : theme.surface,
          }}
        >
          <Text
            style={{
              color: themeMode === mode.value
                ? theme.white
                : theme.text,
            }}
          >
            {mode.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

### Internal Behavior

#### Persistence

Theme preference is automatically saved to AsyncStorage and restored on app launch.

**Storage Key**: `'theme_mode'`

#### System Theme Detection

When `themeMode` is `'system'`, the context uses React Native's `useColorScheme()` hook to detect the device's system theme preference.

**Supported Platforms**:

- iOS: Follows system-wide appearance setting
- Android: Follows system-wide dark mode setting
- Web: Follows browser/OS dark mode preference

#### Automatic Updates

When the system theme changes (e.g., user enables dark mode on their device), the app automatically updates if `themeMode` is set to `'system'`.

---

### Type Definitions

#### ThemeMode

```typescript
type ThemeMode = 'light' | 'dark' | 'system';
```

#### ThemeContextType

```typescript
interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}
```

#### ThemeColors

```typescript
interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  border: string;
  borderLight: string;
  error: string;
  success: string;
  white: string;
  black: string;
  fontRegular: string;
  fontMedium: string;
  fontSemiBold: string;
  fontBold: string;
}
```

---

### Complete Example

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileScreen() {
  const { theme, isDark, setThemeMode } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 20,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    title: {
      fontSize: 24,
      fontFamily: theme.fontBold,
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: theme.fontRegular,
      color: theme.textSecondary,
      marginBottom: 20,
    },
    button: {
      backgroundColor: theme.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: theme.white,
      fontFamily: theme.fontSemiBold,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile Settings</Text>
        <Text style={styles.subtitle}>
          Current theme: {isDark ? 'Dark' : 'Light'}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
        >
          <Text style={styles.buttonText}>Toggle Theme</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

### Usage Best Practices

#### 1. Always Use Theme Colors

Instead of hardcoding colors, always use theme colors:

```typescript
// ❌ Bad
<View style={{ backgroundColor: '#ffffff' }}>

// ✅ Good
const { theme } = useTheme();
<View style={{ backgroundColor: theme.surface }}>
```

#### 2. Create Styles Inside Component

To access current theme, create styles inside the component function:

```typescript
function MyComponent() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.background,
    },
  });

  return <View style={styles.container} />;
}
```

#### 3. Use Semantic Colors

Choose colors based on their semantic meaning:

```typescript
const { theme } = useTheme();

// For text
<Text style={{ color: theme.text }}>Primary</Text>
<Text style={{ color: theme.textSecondary }}>Secondary</Text>

// For interactive elements
<Button color={theme.primary} />

// For states
<Text style={{ color: theme.error }}>Error message</Text>
<Text style={{ color: theme.success }}>Success message</Text>
```

#### 4. Test Both Themes

Always test your UI in both light and dark themes to ensure good contrast and readability.

---

## Context Provider Hierarchy

The typical provider hierarchy in the app:

```typescript
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Your app */}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**Note**: `ThemeProvider` should wrap `AuthProvider` since auth screens also need theming.

---

_Last Updated: January 2025_
_Version: 1.0_
