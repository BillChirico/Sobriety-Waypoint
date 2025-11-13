# Sentry Setup Guide

This guide provides step-by-step instructions for setting up Sentry error tracking and performance monitoring in the 12-Step Tracker app.

## Overview

The 12-Step Tracker uses Sentry for production error tracking, performance monitoring, and session replay. Key features:

- **Production-only monitoring**: Sentry only initializes when `APP_ENV=production` and not in development mode
- **Privacy-first approach**: All sensitive recovery data is automatically scrubbed before sending to Sentry
- **Full observability**: Error tracking, performance monitoring, and error-focused session replay
- **Automatic source maps**: EAS builds automatically upload source maps for readable stack traces
- **100% sampling**: All errors and performance transactions are captured (configurable based on quota needs)

## Required Environment Variables

Four environment variables are required for Sentry integration:

### 1. EXPO_PUBLIC_SENTRY_DSN (Public - Runtime)

**Purpose**: The Data Source Name (DSN) that tells the Sentry SDK where to send events.

**Visibility**: Public (safe to expose in client-side code)

**Used by**: Runtime initialization in production builds

**Format**: `https://[key]@[org].ingest.sentry.io/[project-id]`

**Example**: `https://abc123def456@o123456.ingest.sentry.io/7890123`

### 2. SENTRY_ORG (Private - Build-time)

**Purpose**: Your Sentry organization slug for source map uploads

**Visibility**: Private (build-time only, not included in app bundle)

**Used by**: sentry-expo plugin during EAS builds

**Format**: Organization slug (lowercase, may contain hyphens)

**Example**: `my-organization` or `volvox-llc`

### 3. SENTRY_PROJECT (Private - Build-time)

**Purpose**: Your Sentry project slug for source map uploads

**Visibility**: Private (build-time only, not included in app bundle)

**Used by**: sentry-expo plugin during EAS builds

**Format**: Project slug (lowercase, may contain hyphens)

**Example**: `12-step-tracker`

### 4. SENTRY_AUTH_TOKEN (Secret - Build-time)

**Purpose**: Authentication token for uploading source maps to Sentry

**Visibility**: Secret (never commit to git, build-time only)

**Used by**: sentry-expo plugin during EAS builds

**Format**: Starts with `sntrys_` followed by random characters

**Example**: `sntrys_abc123def456ghi789jkl012mno345pqr678stu901vwx234`

## Step 1: Create Sentry Account and Project

### 1.1 Sign Up for Sentry

1. Go to [sentry.io](https://sentry.io)
2. Click "Get Started" or "Sign Up"
3. Choose a plan (Free tier includes 5,000 errors/month and 10,000 transactions/month)
4. Complete account creation

### 1.2 Create Organization

1. After signing in, you'll be prompted to create an organization
2. Enter your organization name (e.g., "Volvox LLC" or your personal name)
3. This will generate an organization slug (e.g., `volvox-llc`)
4. Save this slug for the `SENTRY_ORG` environment variable

### 1.3 Create Project

1. Click "Create Project" from the Sentry dashboard
2. Select platform: **React Native**
3. Set alert frequency: Choose "Alert me on every new issue" (recommended for new projects)
4. Name your project: **12-step-tracker**
5. Click "Create Project"

### 1.4 Get Your DSN

After creating the project:

1. You'll see the DSN displayed on the setup page
2. Alternatively, navigate to: **Settings** → **Projects** → **12-step-tracker** → **Client Keys (DSN)**
3. Copy the DSN URL (format: `https://[key]@[org].ingest.sentry.io/[project-id]`)
4. Save this for the `EXPO_PUBLIC_SENTRY_DSN` environment variable

## Step 2: Create Sentry Auth Token

### 2.1 Navigate to Auth Tokens

1. Click your avatar in the top-left corner
2. Select "Account Settings" or "User Settings"
3. Click "Auth Tokens" in the left sidebar
4. Click "Create New Token"

### 2.2 Configure Token

1. **Name**: "12-Step Tracker - EAS Builds"
2. **Scopes**: Select the following (minimum required):
   - `project:read` - Read project data
   - `project:releases` - Create and manage releases
   - `org:read` - Read organization data
3. Click "Create Token"

### 2.3 Save Token

**IMPORTANT**: The token is only displayed once. Copy it immediately and store it securely.

Save this token for the `SENTRY_AUTH_TOKEN` environment variable.

## Step 3: Configure Local Development

### 3.1 Update .env File

Create or update your `.env` file in the project root:

```bash
# Existing Supabase variables
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Facebook Sign In
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# Sentry Configuration (Runtime - Public)
EXPO_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project-id]

# Sentry Configuration (Build-time - Private)
# Note: These are only used during builds, not at runtime
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=12-step-tracker
SENTRY_AUTH_TOKEN=sntrys_your_token_here
```

### 3.2 Verify .env is Gitignored

Ensure your `.gitignore` file contains:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

**NEVER** commit the `.env` file or your Sentry auth token to git.

### 3.3 Test Local Development

In development mode, Sentry will be disabled. When you run:

```bash
pnpm dev
```

You should see in the console:

```
[Sentry] Skipping initialization (not production)
```

This is expected and correct - Sentry only runs in production builds.

## Step 4: Configure EAS Secrets

EAS secrets are used during cloud builds and are more secure than committing environment variables.

### 4.1 Create EAS Secrets

Run these commands from your project root:

```bash
# Add public DSN (used at runtime)
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://[key]@[org].ingest.sentry.io/[project-id]" --type string

# Add build-time configuration
eas secret:create --name SENTRY_ORG --value "your-org-slug" --type string
eas secret:create --name SENTRY_PROJECT --value "12-step-tracker" --type string

# Add auth token (most sensitive)
eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_your_token_here" --type string
```

### 4.2 Verify EAS Secrets

List all configured secrets:

```bash
eas secret:list
```

You should see:

```
┌────────────────────────────┬──────────┐
│ Name                       │ Updated  │
├────────────────────────────┼──────────┤
│ EXPO_PUBLIC_SENTRY_DSN     │ X min ago│
│ SENTRY_ORG                 │ X min ago│
│ SENTRY_PROJECT             │ X min ago│
│ SENTRY_AUTH_TOKEN          │ X min ago│
│ EXPO_PUBLIC_SUPABASE_URL   │ ...      │
│ EXPO_PUBLIC_SUPABASE_ANON_KEY │ ...   │
└────────────────────────────┴──────────┘
```

### 4.3 EAS Configuration

The secrets are automatically injected into your builds via `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_SENTRY_DSN": "",
        "SENTRY_ORG": "",
        "SENTRY_PROJECT": "",
        "SENTRY_AUTH_TOKEN": ""
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_SENTRY_DSN": "",
        "SENTRY_ORG": "",
        "SENTRY_PROJECT": "",
        "SENTRY_AUTH_TOKEN": ""
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production",
        "EXPO_PUBLIC_SENTRY_DSN": "",
        "SENTRY_ORG": "",
        "SENTRY_PROJECT": "",
        "SENTRY_AUTH_TOKEN": ""
      }
    }
  }
}
```

EAS will automatically use the values from `eas secret:create` instead of the empty strings.

## Step 5: Configure GitHub Actions Secrets

If you're using GitHub Actions for CI/CD, add the same secrets to your repository.

### 5.1 Add Repository Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret"
4. Add each of the following secrets:

| Secret Name              | Value                                   |
| ------------------------ | --------------------------------------- |
| `EXPO_PUBLIC_SENTRY_DSN` | Your Sentry DSN                         |
| `SENTRY_ORG`             | Your organization slug                  |
| `SENTRY_PROJECT`         | `12-step-tracker`                       |
| `SENTRY_AUTH_TOKEN`      | Your auth token (starts with `sntrys_`) |

### 5.2 Verify Secrets

After adding secrets, they should appear in the "Repository secrets" list (values are hidden).

### 5.3 GitHub Actions Configuration

Your `.github/workflows/*.yml` files should reference these secrets:

```yaml
env:
  EXPO_PUBLIC_SENTRY_DSN: ${{ secrets.EXPO_PUBLIC_SENTRY_DSN }}
  SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
  SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

## Step 6: Test the Integration

### 6.1 Create a Preview Build

Test Sentry integration with a preview build (not a production build yet):

```bash
# Build for iOS
eas build --platform ios --profile preview

# Build for Android
eas build --platform android --profile preview

# Build for both
eas build --platform all --profile preview
```

**Note**: Preview builds still have `APP_ENV` set to preview mode, so Sentry will be disabled. To test Sentry, you need a production build (see next section).

### 6.2 Create a Production Build

To fully test Sentry with source maps:

```bash
# Build for production
eas build --platform all --profile production
```

This will:

1. Build the app with `APP_ENV=production`
2. Upload source maps to Sentry automatically
3. Create a new release in Sentry

### 6.3 Monitor the Build

1. Watch the EAS build logs
2. Look for Sentry source map upload confirmation
3. Check for any errors related to Sentry auth token or configuration

### 6.4 Verify in Sentry Dashboard

After the build completes:

1. Log in to [sentry.io](https://sentry.io)
2. Navigate to your project: **12-step-tracker**
3. Go to **Releases**
4. You should see a new release with the version from your `app.json`
5. Click the release to see uploaded source maps (artifacts)

### 6.5 Test Error Capture

Install the production build on a device or simulator, then:

1. Trigger a test error in the app (you can temporarily add a button that throws an error)
2. Wait a few seconds
3. Check the Sentry dashboard under **Issues**
4. You should see the error appear with a readable stack trace (thanks to source maps)

## Step 7: Configure Privacy and Monitoring

### 7.1 Review Privacy Scrubbing Rules

All privacy scrubbing is configured in `/lib/sentry-privacy.ts`.

**Sensitive fields that are automatically scrubbed:**

- `message` - User messages
- `content` - Message/task content
- `description` - Task descriptions
- `reflection` - Step reflections
- `sobriety_date` - Sobriety dates
- `relapse_date` - Relapse dates
- `notes` - Personal notes
- `email` - Email addresses
- `phone` - Phone numbers
- `name` - User names
- `password` - Passwords
- `token` - Auth tokens
- `access_token` - Access tokens
- `refresh_token` - Refresh tokens

**Data that IS sent to Sentry:**

- User ID (UUID only, no PII)
- User role (sponsor/sponsee/both)
- Error stack traces (with quoted content redacted)
- Route names (query parameters stripped)
- Database table names (query details stripped)
- Platform and device information
- Performance metrics

### 7.2 Verify Privacy in Test Events

After capturing a test error:

1. Open the error in Sentry
2. Check the "Additional Data" section
3. Verify no sensitive data is present
4. Check breadcrumbs for any leaked information

If you find sensitive data, update `/lib/sentry-privacy.ts` and submit a bug report.

### 7.3 Configure Alert Rules

Set up alerts for critical errors:

1. In Sentry, go to **Alerts**
2. Click "Create Alert"
3. Select "Issues"
4. Configure:
   - **When**: "A new issue is created"
   - **If**: "The issue's level is equal to error"
   - **Then**: "Send a notification via Email" (or Slack, PagerDuty, etc.)
5. Save the alert

### 7.4 Set Up Quota Alerts

Monitor your Sentry usage to avoid hitting free tier limits:

1. Go to **Settings** → **Subscription**
2. Click "Set up quota alerts"
3. Configure alerts at 80% and 90% of your quota
4. Add your email for notifications

## Step 8: Performance Monitoring Configuration

### 8.1 Current Configuration

The app is configured for 100% performance sampling:

```typescript
// lib/sentry.ts
tracesSampleRate: 1.0,  // 100% of transactions
enableTracing: true,
```

This captures all navigation, API calls, and user interactions.

### 8.2 Adjust Sampling (If Needed)

If you exceed your transaction quota (10,000/month on free tier):

1. Edit `/lib/sentry.ts`
2. Change `tracesSampleRate` to a lower value:
   - `0.5` = 50% sampling
   - `0.25` = 25% sampling
   - `0.1` = 10% sampling
3. Rebuild and redeploy

### 8.3 Monitor Performance

1. In Sentry, go to **Performance**
2. Review transaction throughput, response times, and error rates
3. Identify slow operations or bottlenecks
4. Use transaction details to debug performance issues

## Troubleshooting

### Source Maps Not Uploading

**Symptoms:**

- Stack traces in Sentry show minified code
- Source files are not readable
- Release has no artifacts

**Solutions:**

1. **Verify auth token has correct scopes:**
   - Go to Sentry → User Settings → Auth Tokens
   - Ensure token has `project:read`, `project:releases`, and `org:read`

2. **Check EAS build logs:**
   - Look for "Uploading source maps to Sentry" message
   - Check for authentication errors or upload failures

3. **Verify environment variables in EAS:**

   ```bash
   eas secret:list
   ```

   Ensure all four Sentry secrets are present

4. **Check app.config.ts:**
   - Verify sentry-expo plugin is configured
   - Ensure organization and project slugs match your Sentry account

### Events Not Appearing in Sentry

**Symptoms:**

- Errors occur in the app but don't show up in Sentry
- Console shows "Sentry initialized" but no events are captured

**Solutions:**

1. **Verify production mode:**
   - Check that `APP_ENV=production` in your build
   - Ensure you're testing a production build, not development

2. **Check DSN is correct:**
   - Verify `EXPO_PUBLIC_SENTRY_DSN` matches your Sentry project
   - Test the DSN by sending a test event

3. **Verify not in DEV mode:**
   - Production builds should not have `__DEV__ = true`
   - Check build configuration in eas.json

4. **Check network connectivity:**
   - Ensure the app can reach `*.ingest.sentry.io`
   - Check for firewall or proxy issues

5. **Review privacy scrubbing:**
   - If events are being dropped entirely, check `privacyBeforeSend` in `/lib/sentry-privacy.ts`
   - Ensure the function returns the event, not null

### High Event Volume / Quota Exceeded

**Symptoms:**

- Sentry email: "You've exceeded your quota"
- Events being dropped
- Dashboard shows 100% quota usage

**Solutions:**

1. **Reduce error sampling:**
   - Edit `/lib/sentry.ts`
   - Change `sampleRate` from `1.0` to `0.5` or lower

2. **Reduce performance sampling:**
   - Edit `/lib/sentry.ts`
   - Change `tracesSampleRate` from `1.0` to `0.25` or lower

3. **Add error rate limiting:**
   - In Sentry dashboard, go to Settings → Inbound Filters
   - Enable rate limiting for specific error types

4. **Filter noisy errors:**
   - Identify repetitive, non-critical errors
   - Add filtering logic in `privacyBeforeSend`
   - Return `null` to drop specific error types

5. **Upgrade Sentry plan:**
   - If the app has many users, consider upgrading to a paid plan
   - Visit Settings → Subscription

### Session Replay Not Working

**Symptoms:**

- No session replays appear in Sentry
- Replays tab is empty

**Solutions:**

1. **Verify platform:**
   - Session replay only works on web
   - Native mobile apps (iOS/Android) do not support session replay

2. **Check sampling configuration:**

   ```typescript
   replaysOnErrorSampleRate: 1.0,  // Should be 1.0 for error replay
   ```

3. **Ensure web-specific configuration:**
   - Session replay is only initialized for web platform
   - Check Platform.OS check in `/lib/sentry.ts`

### Auth Token Expired or Invalid

**Symptoms:**

- Build fails with "Invalid auth token"
- Source map upload fails

**Solutions:**

1. **Regenerate auth token:**
   - Go to Sentry → User Settings → Auth Tokens
   - Revoke the old token
   - Create a new token with the same scopes

2. **Update EAS secret:**

   ```bash
   eas secret:delete --name SENTRY_AUTH_TOKEN
   eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_new_token"
   ```

3. **Update GitHub secret:**
   - Go to GitHub → Repository Settings → Secrets
   - Update `SENTRY_AUTH_TOKEN` with the new value

## Privacy and Security Best Practices

### 1. Never Commit Secrets

- Keep `.env` in `.gitignore`
- Never commit auth tokens to git
- Use EAS secrets for cloud builds
- Use GitHub secrets for CI/CD

### 2. Review Captured Events Regularly

- Spot-check events in Sentry dashboard
- Look for any PII that slipped through
- Update privacy scrubbing rules as needed

### 3. Minimize Data Retention

- In Sentry, go to Settings → Data Privacy
- Set retention period to minimum needed (7-30 days recommended)
- Enable "Delete old data" automatically

### 4. Use Tags Wisely

- Only tag events with non-sensitive data
- User ID is acceptable (UUID)
- User role is acceptable (sponsor/sponsee/both)
- Never tag with email, name, or message content

### 5. Educate Your Team

- Ensure all developers understand privacy rules
- Review privacy scrubbing before adding new fields
- Test privacy scrubbing in staging before production

## Monitoring and Maintenance

### Daily Checks

- Review new issues in Sentry dashboard
- Check for critical errors that need immediate attention
- Monitor quota usage (if approaching limits)

### Weekly Reviews

- Analyze performance trends
- Review and triage non-critical errors
- Check for privacy leaks in captured events
- Update alert rules based on patterns

### Monthly Maintenance

- Review and update privacy scrubbing rules
- Optimize sampling rates based on quota usage
- Clean up resolved issues
- Review and update alert rules

## Additional Resources

- **Sentry Documentation**: [docs.sentry.io](https://docs.sentry.io/)
- **React Native SDK**: [docs.sentry.io/platforms/react-native](https://docs.sentry.io/platforms/react-native/)
- **Expo Integration**: [docs.expo.dev/guides/using-sentry](https://docs.expo.dev/guides/using-sentry/)
- **EAS Build Secrets**: [docs.expo.dev/build-reference/variables](https://docs.expo.dev/build-reference/variables/)
- **Privacy Best Practices**: [docs.sentry.io/product/data-management-settings/scrubbing/](https://docs.sentry.io/product/data-management-settings/scrubbing/)

## Support

If you encounter issues not covered in this guide:

1. Check the [Sentry community forum](https://forum.sentry.io/)
2. Review Expo's [Sentry integration guide](https://docs.expo.dev/guides/using-sentry/)
3. Open an issue in the project repository with detailed error logs

## Summary Checklist

Before going to production, ensure:

- [ ] Sentry account created
- [ ] Project "12-step-tracker" created in Sentry
- [ ] DSN obtained and configured
- [ ] Auth token created with correct scopes
- [ ] All 4 environment variables configured in `.env`
- [ ] All 4 secrets added to EAS (`eas secret:list`)
- [ ] All 4 secrets added to GitHub Actions (if using CI/CD)
- [ ] Production build created successfully
- [ ] Source maps uploaded to Sentry
- [ ] Test error captured and visible in Sentry
- [ ] Privacy scrubbing verified (no PII in events)
- [ ] Alert rules configured for critical errors
- [ ] Quota alerts set up at 80% and 90%
- [ ] Team educated on privacy and monitoring practices
