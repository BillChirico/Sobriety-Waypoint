# Developer Setup Guide

## Overview

This guide will help you set up the 12-Step Tracker application for local development. The app is built with Expo/React Native, TypeScript, and Supabase.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Supabase Setup](#supabase-setup)
5. [Running the Application](#running-the-application)
6. [Development Workflow](#development-workflow)
7. [Building for Production](#building-for-production)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js** (v22 or higher recommended)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **pnpm** (latest version)
   - Install: `npm install -g pnpm@latest`
   - Verify installation: `pnpm --version`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

4. **Expo CLI**
   - Install globally: `pnpm add -g expo-cli`
   - Verify installation: `expo --version`

### Mobile Development (Optional)

For iOS development (macOS only):

- **Xcode** (latest version)
  - Install from Mac App Store
  - Install Xcode Command Line Tools: `xcode-select --install`

For Android development:

- **Android Studio**
  - Download from [developer.android.com](https://developer.android.com/studio)
  - Install Android SDK and emulator

### Recommended Tools

- **VS Code**: [code.visualstudio.com](https://code.visualstudio.com/)
- **Expo Go App**: Install on your phone for testing
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd 12-Step-Tracker
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages including:

- React Native and Expo SDK
- Supabase client
- Navigation libraries
- TypeScript and type definitions

### 3. Verify Installation

```bash
pnpm typecheck
```

Should complete without errors.

---

## Environment Configuration

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
touch .env
```

### 2. Add Environment Variables

Add the following variables to `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**:

- Never commit `.env` to version control (it's already in `.gitignore`)
- Environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app
- You'll get these values from your Supabase project dashboard

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com/)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - **Name**: 12-Step Tracker (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
5. Wait for project to initialize (~2 minutes)

### 2. Get Project Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: Your `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key**: Your `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Add these to your `.env` file

### 3. Run Database Migrations

The project includes SQL migrations in `supabase/migrations/`. You need to run these to set up your database schema.

#### Option 1: Using Supabase Dashboard (Easiest)

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy contents of each migration file (in order by timestamp)
3. Paste and run each migration
4. Run migrations in this order:
   - `20251111000802_create_initial_schema.sql`
   - `20251111000927_insert_12_steps_content.sql`
   - `20251111004659_update_profile_name_fields.sql`
   - `20251111005338_allow_null_onboarding_fields.sql`
   - `20251111023342_add_sponsee_insert_policy.sql`
   - `20251111023342_add_sponsee_insert_policy.sql`
   - `20251111024303_allow_viewing_sponsor_profiles_via_invite.sql`
   - `20251111030759_create_user_step_progress.sql`
   - `20251111033018_rename_relapses_to_slip_ups.sql`
   - `20251111034411_create_task_templates.sql`
   - `20251111040849_set_default_role_to_both.sql`
   - `20251111041830_make_step_number_nullable.sql`

#### Option 2: Using Supabase CLI

1. Install Supabase CLI:

   ```bash
   pnpm add -g supabase
   ```

2. Link to your project:

   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push migrations:
   ```bash
   supabase db push
   ```

### 4. Verify Database Setup

In Supabase dashboard:

1. Go to **Table Editor**
2. Verify these tables exist:
   - `profiles`
   - `sponsor_sponsee_relationships`
   - `invite_codes`
   - `tasks`
   - `task_templates`
   - `user_step_progress`
   - `steps_content`
   - `slip_ups`
   - `messages`
   - `notifications`

3. Go to **SQL Editor** and run:
   ```sql
   SELECT * FROM steps_content;
   ```
   Should return 12 rows (one for each step)

### 5. Configure Authentication

#### Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   - **Enable Email Confirmations**: Choose based on preference
   - **Secure email change**: Enabled (recommended)

#### Enable Google OAuth (Optional)

See `GOOGLE_OAUTH_SETUP.md` for detailed instructions.

Summary:

1. Create OAuth credentials in Google Cloud Console
2. Configure in Supabase: **Authentication** → **Providers** → **Google**
3. Add credentials:
   - Client ID
   - Client Secret
4. Configure redirect URLs

---

## Running the Application

### Start Development Server

```bash
pnpm dev
```

Or using the full command:

```bash
npx expo start --no-telemetry
```

This starts the Metro bundler and shows a QR code.

### Development Options

#### 1. Web (Fastest for Development)

```bash
# Press 'w' in terminal, or
pnpm build:web
```

Opens in your default browser at `http://localhost:8081`

#### 2. iOS Simulator (macOS only)

```bash
# Press 'i' in terminal
```

Requires Xcode installed. Opens iOS Simulator automatically.

#### 3. Android Emulator

```bash
# Press 'a' in terminal
```

Requires Android Studio and emulator set up.

#### 4. Physical Device (Recommended for Testing)

1. Install **Expo Go** app on your phone
2. Scan QR code from terminal with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

**Note**: Your phone and computer must be on the same WiFi network.

---

## Development Workflow

### Project Structure

```
12-Step-Tracker/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab-based navigation
│   │   ├── index.tsx        # Home screen
│   │   ├── steps.tsx        # Steps screen
│   │   ├── tasks.tsx        # Tasks screen
│   │   ├── profile.tsx      # Profile screen
│   │   └── _layout.tsx      # Tab layout
│   ├── _layout.tsx          # Root layout
│   ├── login.tsx            # Login screen
│   ├── signup.tsx           # Signup screen
│   └── onboarding.tsx       # Onboarding screen
├── contexts/                 # React contexts
│   ├── AuthContext.tsx      # Authentication
│   └── ThemeContext.tsx     # Theming
├── lib/                      # Utilities
│   └── supabase.ts          # Supabase client
├── types/                    # TypeScript types
│   └── database.ts          # Database types
├── components/               # Reusable components
├── supabase/migrations/      # Database migrations
└── docs/                     # Documentation
```

### Common Development Tasks

#### Add a New Screen

1. Create file in `app/` directory:

   ```typescript
   // app/new-screen.tsx
   import { View, Text } from 'react-native';
   import { useTheme } from '@/contexts/ThemeContext';

   export default function NewScreen() {
     const { theme } = useTheme();

     return (
       <View style={{ flex: 1, backgroundColor: theme.background }}>
         <Text style={{ color: theme.text }}>New Screen</Text>
       </View>
     );
   }
   ```

2. Navigate to it:

   ```typescript
   import { router } from 'expo-router';

   router.push('/new-screen');
   ```

#### Add a Database Table

1. Create migration in `supabase/migrations/`:

   ```sql
   -- 20250115_add_new_table.sql
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES profiles(id),
     data TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Add RLS policies
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view own data"
     ON new_table FOR SELECT
     USING (auth.uid() = user_id);
   ```

2. Run migration in Supabase dashboard

3. Add TypeScript types in `types/database.ts`:
   ```typescript
   export interface NewTable {
     id: string;
     user_id: string;
     data: string;
     created_at: string;
   }
   ```

#### Query Database

```typescript
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MyScreen() {
  const { user } = useAuth();
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error:', error);
    } else {
      setData(data);
    }
  };

  return (/* Your UI */);
}
```

### Type Checking

Run TypeScript type checker:

```bash
pnpm typecheck
```

Fix any type errors before committing.

### Linting

Run ESLint:

```bash
pnpm lint
```

Auto-fix issues:

```bash
pnpm lint -- --fix
```

---

## Building for Production

### Web Build

```bash
pnpm build:web
```

Output in `dist/` directory. Deploy to any static hosting service.

### Mobile Builds

Uses EAS (Expo Application Services).

#### Prerequisites

1. Install EAS CLI:

   ```bash
   pnpm add -g eas-cli
   ```

2. Log in to Expo:
   ```bash
   eas login
   ```

#### Build Configuration

Configuration in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

#### Create Development Build

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

#### Create Production Build

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

#### Submit to App Stores

```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

See [Expo EAS documentation](https://docs.expo.dev/build/introduction/) for more details.

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot connect to Metro bundler"

**Solution**:

1. Ensure dev server is running (`pnpm dev`)
2. Check firewall settings
3. Try clearing cache: `npx expo start -c`

#### Issue: "Module not found"

**Solution**:

1. Clear cache: `npx expo start -c`
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

#### Issue: "Supabase connection error"

**Solution**:

1. Verify `.env` file exists and has correct values
2. Check Supabase URL and anon key
3. Ensure Supabase project is active
4. Restart dev server after changing `.env`

#### Issue: "Row Level Security policy error"

**Solution**:

1. Check RLS policies in Supabase dashboard
2. Verify user is authenticated
3. Check policy conditions match your query
4. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```
   (Remember to re-enable after testing!)

#### Issue: iOS build fails

**Solution**:

1. Update Xcode to latest version
2. Clean build folder: `expo prebuild --clean`
3. Check certificates in Apple Developer account

#### Issue: Android build fails

**Solution**:

1. Update Android Studio and SDK
2. Check `android/gradle.properties`
3. Clean and rebuild: `cd android && ./gradlew clean`

### Getting Help

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev/)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **React Native Documentation**: [reactnative.dev](https://reactnative.dev/)
- **Project Issues**: Create an issue in the repository

---

## Development Best Practices

### 1. Use TypeScript Strictly

```typescript
// ❌ Bad
function getUser(id) {
  return supabase.from('profiles').select().eq('id', id);
}

// ✅ Good
import { Profile } from '@/types/database';

async function getUser(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  return error ? null : data;
}
```

### 2. Handle Errors Gracefully

```typescript
try {
  const result = await someAsyncOperation();
  // Use result
} catch (error) {
  console.error('Error:', error);
  // Show user-friendly error message
  Alert.alert('Error', 'Something went wrong. Please try again.');
}
```

### 3. Use Context Hooks

```typescript
// ❌ Bad - Direct Supabase auth check
const session = await supabase.auth.getSession();

// ✅ Good - Use AuthContext
const { user, profile } = useAuth();
```

### 4. Test on Multiple Platforms

Always test on:

- Web browser
- iOS (simulator or device)
- Android (emulator or device)
- Both light and dark themes

### 5. Follow File Structure

- Screens go in `app/`
- Reusable components go in `components/`
- Utilities go in `lib/`
- Types go in `types/`
- Keep files focused and single-purpose

### 6. Commit Often

```bash
git add .
git commit -m "Add user profile screen"
git push
```

Use clear, descriptive commit messages.

---

## Additional Resources

### Documentation

- [Project API Documentation](./API_SUPABASE.md)
- [Context API Documentation](./API_CONTEXTS.md)
- [User Guide for Sponsees](./USER_GUIDE_SPONSEE.md)
- [User Guide for Sponsors](./USER_GUIDE_SPONSOR.md)
- [Google OAuth Setup](../GOOGLE_OAUTH_SETUP.md)

### External Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Expo Router Documentation](https://expo.github.io/router/docs/)

---

## Next Steps

After completing setup:

1. ✅ Run the app: `pnpm dev`
2. ✅ Create a test account
3. ✅ Explore the codebase
4. ✅ Read API documentation
5. ✅ Make your first contribution

**Happy coding!**

---

_Last Updated: January 2025_
_Version: 1.0_
