# Facebook Sign In Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Facebook authentication as a third sign-in option alongside email/password and Google OAuth, providing native app handoff on mobile devices.

**Architecture:** Use `expo-facebook` SDK for native iOS/Android authentication with Facebook app handoff, and Supabase OAuth for web. Exchange Facebook tokens with Supabase for session management. Auto-create user profiles on first sign-in. Follow existing Google OAuth pattern.

**Tech Stack:** expo-facebook SDK, Supabase Auth, React Native, TypeScript, Jest, React Native Testing Library

---

## Task 1: Install expo-facebook Dependency

**Files:**

- Modify: `package.json`

**Step 1: Install expo-facebook package**

Run:

```bash
pnpm add expo-facebook
```

Expected: Package installed successfully, `package.json` and `pnpm-lock.yaml` updated

**Step 2: Verify installation**

Run:

```bash
pnpm list expo-facebook
```

Expected: Shows `expo-facebook` version (e.g., `13.0.0`)

**Step 3: Commit dependency**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add expo-facebook dependency for Facebook Sign In"
```

---

## Task 2: Add Environment Variable Configuration

**Files:**

- Modify: `.env`
- Modify: `.env.example`

**Step 1: Add Facebook App ID to .env**

Add to `.env` (replace with actual App ID from Phase 1):

```bash
# Existing variables
EXPO_PUBLIC_SUPABASE_URL=vzwdsjphpabtxhmffous.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Facebook Sign In
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id-here
```

**Step 2: Add placeholder to .env.example**

Add to `.env.example`:

```bash
# Existing variables
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Facebook Sign In
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id-from-developers.facebook.com
```

**Step 3: Commit environment configuration**

```bash
git add .env .env.example
git commit -m "config: add Facebook App ID environment variables"
```

---

## Task 3: Configure app.json with Facebook Plugin

**Files:**

- Modify: `app.json`

**Step 1: Add expo-facebook plugin to app.json**

In `app.json`, add to the `plugins` array (after existing plugins):

```json
{
  "expo": {
    "plugins": [
      // ... existing plugins ...
      [
        "expo-facebook",
        {
          "appID": "EXPO_PUBLIC_FACEBOOK_APP_ID",
          "displayName": "12 Step Tracker",
          "scheme": "fb${EXPO_PUBLIC_FACEBOOK_APP_ID}",
          "advertiserIDCollectionEnabled": false,
          "autoLogAppEventsEnabled": false
        }
      ]
    ]
  }
}
```

**Step 2: Verify JSON syntax**

Run:

```bash
cat app.json | jq '.' > /dev/null && echo "Valid JSON"
```

Expected: `Valid JSON`

**Step 3: Commit configuration**

```bash
git add app.json
git commit -m "config: add expo-facebook plugin for native authentication"
```

---

## Task 4: Create Mock for expo-facebook

**Files:**

- Create: `__mocks__/expo-facebook.ts`

**Step 1: Create mock file**

Create `__mocks__/expo-facebook.ts`:

```typescript
export const initializeAsync = jest.fn().mockResolvedValue(undefined);

export const logInWithReadPermissionsAsync = jest.fn().mockResolvedValue({
  type: 'success',
  token: 'mock-facebook-access-token',
});

export default {
  initializeAsync,
  logInWithReadPermissionsAsync,
};
```

**Step 2: Commit mock**

```bash
git add __mocks__/expo-facebook.ts
git commit -m "test: add expo-facebook mock for testing"
```

---

## Task 5: Write Failing Test for signInWithFacebook (Web)

**Files:**

- Modify: `contexts/__tests__/AuthContext.test.tsx`

**Step 1: Add web platform test**

Add to `contexts/__tests__/AuthContext.test.tsx` after existing `signInWithGoogle` tests:

```typescript
describe('signInWithFacebook', () => {
  describe('web platform', () => {
    beforeEach(() => {
      (Platform.OS as any) = 'web';
    });

    it('should call supabase.auth.signInWithOAuth with facebook provider', async () => {
      const mockSignInWithOAuth = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });
      (supabase.auth.signInWithOAuth as jest.Mock) = mockSignInWithOAuth;

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.signInWithFacebook();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
          scopes: 'email public_profile',
        },
      });
    });

    it('should handle OAuth errors on web', async () => {
      const mockError = new Error('OAuth failed');
      const mockSignInWithOAuth = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });
      (supabase.auth.signInWithOAuth as jest.Mock) = mockSignInWithOAuth;

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await expect(
        act(async () => {
          await result.current.signInWithFacebook();
        })
      ).rejects.toThrow('OAuth failed');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- contexts/__tests__/AuthContext.test.tsx --testNamePattern="signInWithFacebook"
```

Expected: FAIL with "Property 'signInWithFacebook' does not exist"

**Step 3: Commit failing test**

```bash
git add contexts/__tests__/AuthContext.test.tsx
git commit -m "test: add failing tests for signInWithFacebook web flow"
```

---

## Task 6: Implement signInWithFacebook Web Flow

**Files:**

- Modify: `contexts/AuthContext.tsx`

**Step 1: Add signInWithFacebook to AuthContextType interface**

In `contexts/AuthContext.tsx`, update the `AuthContextType` interface (around line 11):

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>; // NEW
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastInitial: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

**Step 2: Update default context value**

In the `AuthContext` creation (around line 28):

```typescript
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signInWithFacebook: async () => {}, // NEW
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});
```

**Step 3: Implement signInWithFacebook method (web only for now)**

Add the method in `AuthProvider` component after `signInWithGoogle` (around line 174):

```typescript
const signInWithFacebook = async () => {
  try {
    if (Platform.OS === 'web') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
          scopes: 'email public_profile',
        },
      });
      if (error) throw error;
    } else {
      // Native flow - to be implemented
      throw new Error('Native Facebook Sign In not yet implemented');
    }
  } catch (error) {
    console.error('Facebook sign in error:', error);
    throw error;
  }
};
```

**Step 4: Add signInWithFacebook to context value**

Update the context value return (around line 210):

```typescript
return (
  <AuthContext.Provider
    value={{
      session,
      user,
      profile,
      loading,
      signIn,
      signInWithGoogle,
      signInWithFacebook, // NEW
      signUp,
      signOut,
      refreshProfile,
    }}
  >
    {children}
  </AuthContext.Provider>
);
```

**Step 5: Run test to verify web flow passes**

Run:

```bash
pnpm test -- contexts/__tests__/AuthContext.test.tsx --testNamePattern="signInWithFacebook.*web"
```

Expected: PASS (2 tests for web platform)

**Step 6: Commit web implementation**

```bash
git add contexts/AuthContext.tsx
git commit -m "feat: implement signInWithFacebook web flow with Supabase OAuth"
```

---

## Task 7: Write Failing Tests for signInWithFacebook (Native)

**Files:**

- Modify: `contexts/__tests__/AuthContext.test.tsx`

**Step 1: Add native platform tests**

Add to `contexts/__tests__/AuthContext.test.tsx` in the `signInWithFacebook` describe block:

```typescript
describe('native platform', () => {
  beforeEach(() => {
    (Platform.OS as any) = 'ios';
    jest.clearAllMocks();
  });

  it('should initialize Facebook SDK with app ID', async () => {
    const Facebook = require('expo-facebook');
    const mockSignInWithIdToken = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          user_metadata: { full_name: 'John Doe' },
        },
        session: { access_token: 'token' },
      },
      error: null,
    });
    (supabase.auth.signInWithIdToken as jest.Mock) = mockSignInWithIdToken;

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signInWithFacebook();
    });

    expect(Facebook.initializeAsync).toHaveBeenCalledWith({
      appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    });
  });

  it('should request correct permissions', async () => {
    const Facebook = require('expo-facebook');
    const mockSignInWithIdToken = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          user_metadata: { full_name: 'John Doe' },
        },
        session: { access_token: 'token' },
      },
      error: null,
    });
    (supabase.auth.signInWithIdToken as jest.Mock) = mockSignInWithIdToken;

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signInWithFacebook();
    });

    expect(Facebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith({
      permissions: ['public_profile', 'email'],
    });
  });

  it('should exchange Facebook token with Supabase', async () => {
    const Facebook = require('expo-facebook');
    const mockSignInWithIdToken = jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          user_metadata: { full_name: 'John Doe' },
        },
        session: { access_token: 'token' },
      },
      error: null,
    });
    (supabase.auth.signInWithIdToken as jest.Mock) = mockSignInWithIdToken;

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signInWithFacebook();
    });

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'facebook',
      token: 'mock-facebook-access-token',
    });
  });

  it('should handle user cancellation gracefully', async () => {
    const Facebook = require('expo-facebook');
    Facebook.logInWithReadPermissionsAsync.mockResolvedValueOnce({
      type: 'cancel',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Should not throw
    await act(async () => {
      await result.current.signInWithFacebook();
    });

    // Should not call Supabase
    expect(supabase.auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('should handle permission denial', async () => {
    const Facebook = require('expo-facebook');
    Facebook.logInWithReadPermissionsAsync.mockResolvedValueOnce({
      type: 'error',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await expect(
      act(async () => {
        await result.current.signInWithFacebook();
      })
    ).rejects.toThrow('Facebook sign in failed');
  });

  it('should handle token exchange errors', async () => {
    const mockError = new Error('Token exchange failed');
    const mockSignInWithIdToken = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });
    (supabase.auth.signInWithIdToken as jest.Mock) = mockSignInWithIdToken;

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await expect(
      act(async () => {
        await result.current.signInWithFacebook();
      })
    ).rejects.toThrow('Token exchange failed');
  });
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm test -- contexts/__tests__/AuthContext.test.tsx --testNamePattern="signInWithFacebook.*native"
```

Expected: FAIL (native flow not implemented)

**Step 3: Commit failing tests**

```bash
git add contexts/__tests__/AuthContext.test.tsx
git commit -m "test: add failing tests for signInWithFacebook native flow"
```

---

## Task 8: Implement signInWithFacebook Native Flow

**Files:**

- Modify: `contexts/AuthContext.tsx`

**Step 1: Import expo-facebook at the top of the file**

Add import after existing imports (around line 7):

```typescript
import * as Facebook from 'expo-facebook';
```

**Step 2: Replace signInWithFacebook implementation**

Replace the previous implementation with full native and web support:

```typescript
const signInWithFacebook = async () => {
  try {
    if (Platform.OS === 'web') {
      // Web flow: Use Supabase OAuth directly
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
          scopes: 'email public_profile',
        },
      });
      if (error) throw error;
    } else {
      // Native flow: Use expo-facebook SDK
      await Facebook.initializeAsync({
        appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
      });

      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile', 'email'],
      });

      if (result.type === 'success') {
        // Exchange Facebook token with Supabase
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: result.token,
        });

        if (error) throw error;

        // Auto-create profile if new user
        if (data.user) {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!existingProfile) {
            // Extract name from user metadata
            const fullName = data.user.user_metadata?.full_name || '';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || 'Facebook';
            const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : 'U';

            // Create profile
            const { error: profileError } = await supabase.from('profiles').insert({
              id: data.user.id,
              first_name: firstName,
              last_initial: lastInitial,
              role: null, // Will be set in onboarding
            });

            if (profileError) {
              console.error('Error creating profile:', profileError);
              throw profileError;
            }
          }
        }
      } else if (result.type === 'cancel') {
        // User cancelled - don't throw error, just return
        return;
      } else {
        throw new Error('Facebook sign in failed');
      }
    }
  } catch (error) {
    console.error('Facebook sign in error:', error);
    throw error;
  }
};
```

**Step 3: Run all signInWithFacebook tests**

Run:

```bash
pnpm test -- contexts/__tests__/AuthContext.test.tsx --testNamePattern="signInWithFacebook"
```

Expected: PASS (all web and native tests passing)

**Step 4: Commit native implementation**

```bash
git add contexts/AuthContext.tsx
git commit -m "feat: implement signInWithFacebook native flow with expo-facebook SDK"
```

---

## Task 9: Add Facebook Sign In Button to Login Screen

**Files:**

- Modify: `app/login.tsx`

**Step 1: Write test for Facebook button rendering**

Add to `__tests__/app/login.test.tsx` after existing Google button test:

```typescript
it('should render Facebook Sign In button', () => {
  render(<Login />);

  const facebookButton = screen.getByRole('button', {
    name: /sign in with facebook/i,
  });

  expect(facebookButton).toBeTruthy();
});

it('should call signInWithFacebook when Facebook button pressed', async () => {
  const mockSignInWithFacebook = jest.fn();
  (useAuth as jest.Mock).mockReturnValue({
    signInWithFacebook: mockSignInWithFacebook,
    loading: false,
  });

  render(<Login />);

  const facebookButton = screen.getByRole('button', {
    name: /sign in with facebook/i,
  });

  fireEvent.press(facebookButton);

  await waitFor(() => {
    expect(mockSignInWithFacebook).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- __tests__/app/login.test.tsx --testNamePattern="Facebook"
```

Expected: FAIL (button not found)

**Step 3: Add Facebook button to login.tsx**

In `app/login.tsx`, add the Facebook button after the Google button (around line 80, after the Google button):

```typescript
{/* Facebook Sign In Button */}
<TouchableOpacity
  onPress={handleFacebookSignIn}
  disabled={loading}
  style={{
    backgroundColor: '#1877F2',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    opacity: loading ? 0.6 : 1,
  }}
  accessibilityLabel="Sign in with Facebook"
  accessibilityRole="button"
>
  <Facebook size={20} color="white" style={{ marginRight: 8 }} />
  <Text
    style={{
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    }}
  >
    Continue with Facebook
  </Text>
</TouchableOpacity>
```

**Step 4: Add handleFacebookSignIn handler**

Add after the `handleGoogleSignIn` function:

```typescript
const handleFacebookSignIn = async () => {
  try {
    await signInWithFacebook();
  } catch (error: any) {
    if (error.message !== 'Facebook sign in was cancelled') {
      Alert.alert('Error', 'Failed to sign in with Facebook. Please try again.');
    }
  }
};
```

**Step 5: Update useAuth destructuring**

Update the `useAuth` call to include `signInWithFacebook`:

```typescript
const { signIn, signInWithGoogle, signInWithFacebook, loading } = useAuth();
```

**Step 6: Import Facebook icon**

Add to imports at top:

```typescript
import { Facebook } from 'lucide-react-native';
```

**Step 7: Run test to verify it passes**

Run:

```bash
pnpm test -- __tests__/app/login.test.tsx --testNamePattern="Facebook"
```

Expected: PASS (2 tests)

**Step 8: Commit login screen changes**

```bash
git add app/login.tsx __tests__/app/login.test.tsx
git commit -m "feat: add Facebook Sign In button to login screen"
```

---

## Task 10: Add Facebook Sign In Button to Signup Screen

**Files:**

- Modify: `app/signup.tsx`

**Step 1: Write test for Facebook button on signup**

Add to `__tests__/app/signup.test.tsx`:

```typescript
it('should render Facebook Sign In button', () => {
  render(<Signup />);

  const facebookButton = screen.getByRole('button', {
    name: /sign up with facebook/i,
  });

  expect(facebookButton).toBeTruthy();
});

it('should call signInWithFacebook when Facebook button pressed', async () => {
  const mockSignInWithFacebook = jest.fn();
  (useAuth as jest.Mock).mockReturnValue({
    signInWithFacebook: mockSignInWithFacebook,
    loading: false,
  });

  render(<Signup />);

  const facebookButton = screen.getByRole('button', {
    name: /sign up with facebook/i,
  });

  fireEvent.press(facebookButton);

  await waitFor(() => {
    expect(mockSignInWithFacebook).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test -- __tests__/app/signup.test.tsx --testNamePattern="Facebook"
```

Expected: FAIL (button not found)

**Step 3: Add Facebook button to signup.tsx**

Add after the Google button (similar to login screen):

```typescript
{/* Facebook Sign Up Button */}
<TouchableOpacity
  onPress={handleFacebookSignUp}
  disabled={loading}
  style={{
    backgroundColor: '#1877F2',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    opacity: loading ? 0.6 : 1,
  }}
  accessibilityLabel="Sign up with Facebook"
  accessibilityRole="button"
>
  <Facebook size={20} color="white" style={{ marginRight: 8 }} />
  <Text
    style={{
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    }}
  >
    Continue with Facebook
  </Text>
</TouchableOpacity>
```

**Step 4: Add handleFacebookSignUp handler**

```typescript
const handleFacebookSignUp = async () => {
  try {
    await signInWithFacebook();
  } catch (error: any) {
    if (error.message !== 'Facebook sign in was cancelled') {
      Alert.alert('Error', 'Failed to sign up with Facebook. Please try again.');
    }
  }
};
```

**Step 5: Update useAuth destructuring**

```typescript
const { signUp, signInWithGoogle, signInWithFacebook, loading } = useAuth();
```

**Step 6: Import Facebook icon**

```typescript
import { Facebook } from 'lucide-react-native';
```

**Step 7: Run test to verify it passes**

Run:

```bash
pnpm test -- __tests__/app/signup.test.tsx --testNamePattern="Facebook"
```

Expected: PASS (2 tests)

**Step 8: Commit signup screen changes**

```bash
git add app/signup.tsx __tests__/app/signup.test.tsx
git commit -m "feat: add Facebook Sign In button to signup screen"
```

---

## Task 11: Verify All Tests Pass

**Step 1: Run full test suite**

Run:

```bash
pnpm test -- --watchAll=false --coverage
```

Expected: All tests pass, coverage ≥80%

**Step 2: Check coverage report**

Check coverage for:

- `contexts/AuthContext.tsx` - should have high coverage for new method
- `app/login.tsx` - should cover Facebook button
- `app/signup.tsx` - should cover Facebook button

**Step 3: If coverage is low, add missing tests**

Add any missing test cases for edge cases.

**Step 4: Commit any additional tests**

```bash
git add <test-files>
git commit -m "test: add missing test coverage for Facebook Sign In"
```

---

## Task 12: Create Facebook Sign In Setup Documentation

**Files:**

- Create: `FACEBOOK_SIGNIN_SETUP.md`

**Step 1: Create documentation file**

Create `FACEBOOK_SIGNIN_SETUP.md` in the root directory with comprehensive setup instructions:

````markdown
# Facebook Sign In Setup Guide

This guide walks through the complete setup process for Facebook Sign In authentication in the 12 Step Tracker app.

## Prerequisites

- Facebook Developer account (https://developers.facebook.com)
- Access to Supabase project dashboard
- App bundle identifiers:
  - iOS: `com.billchirico.12steptracker`
  - Android: `com.billchirico.twelvesteptracker`

---

## Part 1: Facebook Developer Setup

### 1.1 Create Facebook App

1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Select "Consumer" as app type
4. Click "Next"
5. Enter app details:
   - **App Name**: 12 Step Tracker
   - **App Contact Email**: your-email@example.com
6. Click "Create App"
7. Complete security check

### 1.2 Add Facebook Login Product

1. In your app dashboard, find "Facebook Login" in the products list
2. Click "Set Up" under Facebook Login
3. Select "iOS", "Android", and "Web" platforms
4. Click "Next" through the quick start (we'll configure manually)

### 1.3 Configure iOS Platform

1. In left sidebar, go to "Settings" → "Basic"
2. Scroll to "Add Platform" and click it
3. Select "iOS"
4. Enter:
   - **Bundle ID**: `com.billchirico.12steptracker`
   - **iPhone Store ID**: (leave blank for now)
5. Click "Save Changes"
6. Note the **App ID** at the top of the page (e.g., `1234567890`)

**Configure URL Scheme:**

- The URL scheme will be `fb[APP_ID]` (e.g., `fb1234567890`)
- This is auto-configured by the expo-facebook plugin

### 1.4 Configure Android Platform

1. Click "Add Platform" again
2. Select "Android"
3. Enter:
   - **Google Play Package Name**: `com.billchirico.twelvesteptracker`
   - **Class Name**: `com.billchirico.twelvesteptracker.MainActivity`
4. Click "Save Changes"

**Generate Key Hashes:**

For development:

```bash
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
# Password: android
```
````

For production (when you have release keystore):

```bash
keytool -exportcert -alias your-key-alias -keystore path/to/release.keystore | openssl sha1 -binary | openssl base64
```

Add both key hashes to the "Key Hashes" field in Facebook Developer Console.

### 1.5 Configure Web Platform

1. Click "Add Platform" again
2. Select "Website"
3. Enter:
   - **Site URL**: `http://localhost:8081` (for development)
   - For production, add your actual domain
4. Click "Save Changes"

### 1.6 Configure App Domains

1. In "Settings" → "Basic", scroll to "App Domains"
2. Add:
   - `localhost` (for development)
   - Your production domain (when ready)
3. Click "Save Changes"

### 1.7 Get App Credentials

1. In "Settings" → "Basic", note these values:
   - **App ID**: (e.g., `1234567890`)
   - **App Secret**: Click "Show" to reveal (keep this secret!)

---

## Part 2: Supabase Configuration

### 2.1 Enable Facebook Provider

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to "Authentication" → "Providers"
4. Find "Facebook" in the list
5. Toggle "Enable Facebook Sign-In"

### 2.2 Add Facebook Credentials

1. Enter the credentials from Facebook:
   - **Facebook App ID**: Your App ID from Facebook
   - **Facebook App Secret**: Your App Secret from Facebook
2. Click "Save"

### 2.3 Configure Redirect URLs

In the Facebook provider settings, add these redirect URLs:

**Production:**

```
https://vzwdsjphpabtxhmffous.supabase.co/auth/v1/callback
```

**Native (Deep Linking):**

```
12stepstracker://auth/callback
```

**Development (Web):**

```
http://localhost:8081
```

### 2.4 Set Requested Scopes

In the Supabase Facebook provider settings:

- **Scopes**: `email,public_profile`

Click "Save" to apply changes.

---

## Part 3: App Configuration

### 3.1 Add Environment Variable

Create or update `.env` file in the root directory:

```bash
# Existing Supabase config
EXPO_PUBLIC_SUPABASE_URL=vzwdsjphpabtxhmffous.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Facebook Sign In
EXPO_PUBLIC_FACEBOOK_APP_ID=1234567890
```

Replace `1234567890` with your actual Facebook App ID.

### 3.2 Verify app.json Configuration

Ensure `app.json` includes the expo-facebook plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-facebook",
        {
          "appID": "EXPO_PUBLIC_FACEBOOK_APP_ID",
          "displayName": "12 Step Tracker",
          "scheme": "fb${EXPO_PUBLIC_FACEBOOK_APP_ID}",
          "advertiserIDCollectionEnabled": false,
          "autoLogAppEventsEnabled": false
        }
      ]
    ]
  }
}
```

### 3.3 Add to GitHub Secrets (for CI/CD)

1. Go to your GitHub repository
2. Navigate to "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add:
   - **Name**: `EXPO_PUBLIC_FACEBOOK_APP_ID`
   - **Value**: Your Facebook App ID
5. Click "Add secret"

---

## Part 4: Facebook App Review (If Needed)

For basic permissions (`email`, `public_profile`), no app review is required. However, your app must be in "Live" mode for public access.

### 4.1 Privacy Policy Requirement

Facebook requires a publicly accessible privacy policy:

1. Create a privacy policy (can use a template)
2. Host it on your website or use a privacy policy generator
3. In Facebook Developer Console:
   - Go to "Settings" → "Basic"
   - Add "Privacy Policy URL"
   - Add "Terms of Service URL" (optional but recommended)

### 4.2 Data Deletion Instructions

Facebook requires data deletion instructions:

1. In "Settings" → "Basic"
2. Add "User Data Deletion" callback URL or instructions
3. Options:
   - **Callback URL**: Endpoint that handles deletion requests
   - **Instructions**: URL to page with manual deletion instructions

For this app, users can delete their data through the profile settings.

### 4.3 Switch to Live Mode

1. In the top navigation, find the mode toggle
2. Switch from "Development" to "Live"
3. Confirm the switch

**Note:** In Development mode, only accounts listed as developers/testers can use Facebook Sign In.

---

## Part 5: Testing

### 5.1 Test on Web

1. Start development server:
   ```bash
   pnpm dev
   ```
2. Open http://localhost:8081
3. Click "Continue with Facebook"
4. Verify OAuth popup appears
5. Sign in with Facebook account
6. Verify redirect back to app
7. Check that profile is created in Supabase

### 5.2 Test on iOS

1. Build development client:
   ```bash
   eas build --platform ios --profile development --local
   ```
2. Install on device/simulator
3. Click "Continue with Facebook"
4. Verify Facebook app handoff (if Facebook app installed)
5. Sign in with Facebook
6. Verify deep link redirect back to app
7. Check profile creation

### 5.3 Test on Android

1. Build development client:
   ```bash
   eas build --platform android --profile development --local
   ```
2. Install on device/emulator
3. Follow same testing steps as iOS

### 5.4 Test Edge Cases

- [ ] User cancels Facebook Sign In flow
- [ ] User denies email permission
- [ ] Network error during authentication
- [ ] Existing Facebook user signs in again
- [ ] New Facebook user (first time)
- [ ] Sign out and sign back in

---

## Troubleshooting

### "Invalid OAuth redirect URI"

**Problem:** Facebook shows error about invalid redirect URI.

**Solution:**

1. Verify all redirect URLs are added in Supabase Facebook provider settings
2. Ensure URLs match exactly (including http/https and trailing slashes)
3. Check that your Supabase URL is correct

### "App Not Set Up"

**Problem:** Error message saying the app is not set up correctly.

**Solution:**

1. Verify Facebook App ID in `.env` matches Facebook Developer Console
2. Ensure app.json plugin configuration is correct
3. Run `pnpm prebuild` to regenerate native files
4. Rebuild the app

### Key Hash Mismatch (Android)

**Problem:** Android authentication fails silently.

**Solution:**

1. Regenerate key hash using the command in section 1.4
2. Add the key hash to Facebook Developer Console
3. Make sure to add BOTH debug and release key hashes
4. Rebuild the app

### URL Scheme Issues (iOS)

**Problem:** iOS doesn't redirect back to app after Facebook authentication.

**Solution:**

1. Verify URL scheme matches `fb[APP_ID]` format
2. Check that deep link scheme `12stepstracker://` is configured
3. Ensure `expo-auth-session` is installed
4. Rebuild the app

### "This app is in development mode"

**Problem:** Non-developer/tester accounts can't sign in.

**Solution:**

1. Add test users in Facebook Developer Console under "Roles" → "Test Users"
2. OR switch app to "Live" mode (requires privacy policy)

### Profile Not Created

**Problem:** User signs in but no profile appears in database.

**Solution:**

1. Check browser console / device logs for errors
2. Verify RLS policies allow profile insertion
3. Check that user metadata contains `full_name`
4. Manually check Supabase profiles table

---

## Security Checklist

- [ ] Facebook App Secret is NOT in client code (only in Supabase)
- [ ] `.env` file is in `.gitignore`
- [ ] GitHub Secrets configured for CI/CD
- [ ] Redirect URLs are whitelisted in Facebook Developer Console
- [ ] Redirect URLs are configured in Supabase
- [ ] App is only requesting necessary permissions
- [ ] Privacy policy is publicly accessible
- [ ] Data deletion instructions are provided

---

## Additional Resources

- [Facebook Login for Apps](https://developers.facebook.com/docs/facebook-login/)
- [Expo Facebook SDK Documentation](https://docs.expo.dev/versions/latest/sdk/facebook/)
- [Supabase Facebook OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-facebook)
- [Facebook Platform Policies](https://developers.facebook.com/docs/development/release/policies/)
- [Facebook Brand Guidelines](https://about.meta.com/brand/resources/facebookapp/guidelines/)

---

## Support

If you encounter issues not covered in this guide:

1. Check Facebook Developer Console for error messages
2. Check Supabase logs for authentication errors
3. Review device/browser console logs
4. Verify all configuration steps were completed
5. Consult the resources above

````

**Step 2: Commit documentation**

```bash
git add FACEBOOK_SIGNIN_SETUP.md
git commit -m "docs: add comprehensive Facebook Sign In setup guide"
````

---

## Task 13: Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md`

**Step 1: Update authentication section**

Find the authentication section in `CLAUDE.md` and update it to mention Facebook Sign In:

```markdown
## Authentication

- **Supabase Auth**: Email/password, Google OAuth, and Facebook Sign In
- Auto-creates profiles for new users
- Session persistence via platform-specific storage
- Deep linking for OAuth redirects on mobile
```

**Step 2: Add reference to Facebook setup docs**

Add to the "Google OAuth Setup" section:

```markdown
## Facebook Sign In Setup

Facebook Sign-In is integrated using the expo-facebook SDK. See `FACEBOOK_SIGNIN_SETUP.md` for:

- Facebook Developer Console setup
- Supabase provider configuration
- Platform-specific configuration (iOS/Android/Web)
- Testing procedures
- Troubleshooting guide

Key details:

- App ID: Stored in `EXPO_PUBLIC_FACEBOOK_APP_ID` environment variable
- Permissions requested: `email`, `public_profile`
- OAuth implementation in `AuthContext.tsx` handles both web and native flows
```

**Step 3: Commit CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Facebook Sign In information"
```

---

## Task 14: Final Verification

**Step 1: Run complete test suite**

Run:

```bash
pnpm test -- --watchAll=false --coverage
```

Expected: All tests pass (>202 tests), coverage ≥80%

**Step 2: Type check**

Run:

```bash
pnpm typecheck
```

Expected: No TypeScript errors

**Step 3: Lint check**

Run:

```bash
pnpm lint
```

Expected: No linting errors

**Step 4: Verify build**

Run:

```bash
pnpm build:web
```

Expected: Web build succeeds

**Step 5: Manual smoke test (if possible)**

If you have Facebook App credentials configured:

1. Start dev server: `pnpm dev`
2. Test web flow in browser
3. Verify OAuth flow works
4. Check profile creation

**Step 6: Review all changes**

Run:

```bash
git log --oneline origin/main..HEAD
```

Expected: See all commits from the implementation

**Step 7: Create summary commit (optional)**

If all verification passes, you can create a final commit summarizing the feature:

```bash
git commit --allow-empty -m "feat: complete Facebook Sign In implementation

Summary of changes:
- Added expo-facebook dependency
- Implemented signInWithFacebook in AuthContext (web + native)
- Added Facebook Sign In buttons to login and signup screens
- Created comprehensive setup documentation
- Updated CLAUDE.md with Facebook Sign In info
- Full test coverage (TDD approach)

Closes #22"
```

---

## Success Criteria Verification

Before considering this complete, verify:

- [ ] Users can sign in with Facebook on web (Supabase OAuth flow)
- [ ] Users can sign in with Facebook on native (expo-facebook SDK flow)
- [ ] New Facebook users automatically get profiles created
- [ ] Deep linking configured (scheme: `12stepstracker://`)
- [ ] UI matches existing OAuth button design with Facebook brand colors
- [ ] Documentation is complete (`FACEBOOK_SIGNIN_SETUP.md`)
- [ ] CLAUDE.md updated
- [ ] Tests achieve ≥80% coverage
- [ ] Proper permissions requested (`email`, `public_profile`)
- [ ] Error handling covers edge cases (cancellation, denial, network errors)
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors

---

## Next Steps (After Implementation)

1. **Phase 1 Configuration** (if not done yet):
   - Create Facebook Developer account
   - Create Facebook App
   - Configure platforms (iOS, Android, Web)
   - Enable Facebook provider in Supabase
   - Add credentials to `.env`

2. **Testing on Real Devices**:
   - Build development clients for iOS and Android
   - Test Facebook app handoff
   - Test all edge cases on physical devices

3. **CI/CD**:
   - Verify GitHub Secrets are configured
   - Test CI build with Facebook environment variable

4. **Production Preparation**:
   - Create privacy policy
   - Add data deletion instructions
   - Switch Facebook app to Live mode
   - Update production redirect URLs

5. **Create Pull Request**:
   - Push branch to GitHub
   - Create PR targeting `main`
   - Link to issue #22
   - Request review
