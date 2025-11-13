# Facebook Sign In Setup Guide

This guide walks you through setting up Facebook authentication for the 12-Step Tracker app.

## Prerequisites

- A Facebook Developer account ([developers.facebook.com](https://developers.facebook.com))
- Supabase project configured (see existing documentation)
- Access to your app's source code and environment variables

## Overview

The Facebook Sign In integration supports:

- **Web**: OAuth flow with redirect
- **Native (iOS/Android)**: Native Facebook SDK with app switching

## Part 1: Facebook App Configuration

### 1.1 Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Select "Consumer" as the app type
4. Fill in:
   - **App Name**: 12 Step Tracker
   - **App Contact Email**: Your email
5. Click "Create App"

### 1.2 Configure Facebook Login

1. In your app dashboard, click "+ Add Products"
2. Find "Facebook Login" and click "Set Up"
3. Select your platform:
   - For web testing: Select "Web"
   - For mobile: Select "iOS" and/or "Android"

### 1.3 Get Your App ID

1. Go to Settings → Basic
2. Copy your **App ID** - you'll need this for environment variables
3. Keep your App Secret secure (not needed for client-side integration)

### 1.4 Configure OAuth Redirect URIs (Web)

1. Go to Facebook Login → Settings
2. Under "Valid OAuth Redirect URIs", add:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
3. Replace `your-project` with your actual Supabase project reference
4. Click "Save Changes"

### 1.5 Configure iOS Settings (Native)

1. Go to Settings → Basic → iOS
2. Add:
   - **Bundle ID**: `com.billchirico.12steptracker`
   - Enable "Single Sign On"
3. Save changes

### 1.6 Configure Android Settings (Native)

1. Go to Settings → Basic → Android
2. Add:
   - **Package Name**: `com.billchirico.twelvesteptracker`
   - **Class Name**: Leave default or use your main activity
   - **Key Hashes**: Generate and add your development/production key hashes
3. Save changes

### 1.7 Make App Live

1. Go to Settings → Basic
2. Toggle "App Mode" from "Development" to "Live"
3. Note: You may need to complete App Review for certain permissions in production

## Part 2: Supabase Configuration

### 2.1 Enable Facebook Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find "Facebook" and click to configure
4. Enable the Facebook provider
5. Add your Facebook App credentials:
   - **Facebook client ID**: Your Facebook App ID (from Step 1.3)
   - **Facebook client secret**: Your Facebook App Secret (from Settings → Basic)
6. Set the **Callback URL** to:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
7. Click "Save"

### 2.2 Configure Authorization Settings

1. In the Facebook provider settings, ensure these scopes are requested:
   - `email`
   - `public_profile`
2. These are the default scopes and match what the app requests

## Part 3: App Configuration

### 3.1 Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Add your Facebook App ID to `.env`:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
   ```

3. **Important**: Never commit `.env` to version control. It's already in `.gitignore`.

### 3.2 Configure app.json

The app.json is already configured with the Facebook plugin:

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

This configuration:

- References the environment variable for the App ID
- Sets up the URL scheme for deep linking
- Disables tracking for privacy

### 3.3 Install Dependencies

Dependencies are already installed. If needed:

```bash
pnpm install
```

## Part 4: Testing

### 4.1 Run Tests

The implementation includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run only Facebook-related tests
pnpm test -- __tests__/contexts/AuthContext.test.tsx --testNamePattern="signInWithFacebook"
```

All tests should pass (210 tests total, including 8 Facebook Sign In tests).

### 4.2 Test Web Flow

1. Start the development server:

   ```bash
   pnpm dev
   ```

2. Open the app in your browser
3. Click "Continue with Facebook" on the login/signup screen
4. You should be redirected to Facebook for authentication
5. After authorizing, you'll be redirected back to the app

### 4.3 Test Native Flow (iOS/Android)

1. Build a development client:

   ```bash
   # For iOS
   npx expo run:ios

   # For Android
   npx expo run:android
   ```

2. The Facebook SDK will attempt app-switching to the Facebook app
3. If Facebook app is not installed, it falls back to web view
4. After authentication, the app receives the access token and exchanges it with Supabase

## Part 5: Troubleshooting

### Common Issues

#### "Facebook App ID not configured"

- **Cause**: Environment variable missing or not loaded
- **Solution**: Ensure `.env` exists and contains `EXPO_PUBLIC_FACEBOOK_APP_ID`
- **Solution**: Restart the development server after adding environment variables

#### "Invalid OAuth redirect URI"

- **Cause**: Mismatch between Supabase callback URL and Facebook settings
- **Solution**: Verify the redirect URI in Facebook Login settings matches exactly:
  ```
  https://your-project.supabase.co/auth/v1/callback
  ```

#### "User cancelled Facebook login"

- **Cause**: User clicked "Cancel" in Facebook login dialog
- **Solution**: This is expected behavior - the app handles it gracefully by returning without error

#### Native app doesn't open Facebook

- **Cause**: Facebook app not installed or URL scheme not configured
- **Solution**:
  - Install Facebook app on the device/simulator
  - Verify `expo-facebook` plugin is properly configured in app.json
  - Rebuild the native app after configuration changes

#### "Facebook sign in failed"

- **Cause**: Various issues (network, permissions, etc.)
- **Solution**:
  - Check Facebook app status (Development vs Live)
  - Verify all permissions are granted
  - Check network connectivity
  - Review Supabase logs for detailed error messages

#### Tests failing with "process.env.EXPO_PUBLIC_FACEBOOK_APP_ID is undefined"

- **Cause**: Test environment not loading environment variables
- **Solution**: Tests mock this value - if you see this error, check that test setup is correct

## Part 6: Production Deployment

### Before Going Live

1. **App Review**: If you need permissions beyond `email` and `public_profile`, submit for Facebook App Review
2. **Privacy Policy**: Facebook requires a valid Privacy Policy URL
3. **Terms of Service**: Recommended to have Terms of Service
4. **Data Deletion**: Implement data deletion callback if required by Facebook
5. **Switch to Live Mode**: Change your Facebook app from Development to Live mode
6. **Update Redirect URIs**: Ensure production URLs are added to Facebook Login settings

### Environment Variables in Production

1. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
2. For EAS builds, add to `eas.json`:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_FACEBOOK_APP_ID": "your-facebook-app-id"
         }
       }
     }
   }
   ```

## Part 7: Implementation Details

### Architecture

The Facebook Sign In implementation follows the same pattern as Google OAuth:

1. **Web Platform**:
   - Uses Supabase `signInWithOAuth` with Facebook provider
   - Redirects to Facebook for authentication
   - Facebook redirects back to Supabase callback URL
   - Supabase handles the token exchange and session creation

2. **Native Platform**:
   - Uses `expo-facebook` SDK for native experience
   - Initializes Facebook SDK with App ID
   - Requests `public_profile` and `email` permissions
   - Receives Facebook access token
   - Exchanges token with Supabase using `signInWithIdToken`
   - Creates user profile if first-time login

### Profile Creation

When a user signs in with Facebook for the first time:

1. Supabase creates a user account
2. The app automatically creates a profile in the `profiles` table
3. First name and last initial are extracted from Facebook's `full_name` field
4. If full name is not available, defaults to "User U"

### Code Locations

- **Authentication Logic**: `contexts/AuthContext.tsx`
- **Login Screen**: `app/login.tsx`
- **Signup Screen**: `app/signup.tsx`
- **Tests**: `__tests__/contexts/AuthContext.test.tsx`
- **Mock**: `__mocks__/expo-facebook.ts`

## Support

For issues specific to:

- **Facebook Platform**: [Facebook Developers Support](https://developers.facebook.com/support)
- **Supabase**: [Supabase Documentation](https://supabase.com/docs)
- **expo-facebook**: [Expo Facebook Documentation](https://docs.expo.dev/versions/latest/sdk/facebook/)

For app-specific issues, create an issue in the project repository.
