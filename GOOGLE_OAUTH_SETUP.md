# Google OAuth Setup Instructions

To enable Google Sign-In in your app, you need to configure Google OAuth in your Supabase project.

## Steps to Configure Google OAuth

### 1. Set up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. Select **Web application** as the application type

### 2. Configure Authorized Redirect URIs

Add the following redirect URIs to your Google OAuth client:

- `https://vzwdsjphpabtxhmffous.supabase.co/auth/v1/callback`
- `myapp://` (for mobile app)

### 3. Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/project/vzwdsjphpabtxhmffous)
2. Navigate to **Authentication** → **Providers** → **Google**
3. Enable the Google provider
4. Enter your Google OAuth **Client ID** and **Client Secret**
5. Save the configuration

### 4. Test the Integration

After configuration:

1. The "Continue with Google" button will appear on both login and signup screens
2. Clicking it will open a browser window for Google authentication
3. After successful authentication, users will be redirected back to the app
4. New Google users will be automatically created in the profiles table
5. Users without onboarding data will be redirected to complete onboarding

## Mobile App Considerations

For the mobile app to work with Google OAuth:

1. The app uses the deep link scheme `myapp://`
2. Make sure this matches the scheme in `app.json`
3. For iOS, ensure the bundle identifier is correct: `com.billchirico.12steptracker`
4. For Android, ensure the package name is correct: `com.billchirico.twelvesteptracker`

## Troubleshooting

If Google Sign-In doesn't work:

1. Verify redirect URIs are correctly configured in Google Cloud Console
2. Check that the Google provider is enabled in Supabase
3. Ensure Client ID and Client Secret are correct
4. Check browser console for error messages
5. Verify the app scheme matches in both `app.json` and Google Cloud Console
