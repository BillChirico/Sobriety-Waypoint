# CI/CD Information

## GitHub Actions Workflow

The project uses **GitHub Actions** for continuous integration and deployment.

### Workflow File

Location: `.github/workflows/ci.yml`

### Triggered On

- Push to any branch
- Pull requests

### CI Pipeline Steps

1. **Lint Check**
   - Runs `pnpm lint`
   - Ensures code follows ESLint rules

2. **Format Check**
   - Runs `pnpm format:check`
   - Ensures code is formatted with Prettier

3. **Type Check**
   - Runs `pnpm typecheck`
   - Ensures no TypeScript errors

4. **Unit Tests**
   - Runs `pnpm test:ci`
   - Executes Jest tests with coverage
   - Requires ≥80% coverage for all metrics

5. **Web Build**
   - Runs `pnpm build:web`
   - Ensures web export works
   - Artifacts stored for 7 days

6. **EAS Build Trigger** (Preview Profile)
   - Triggers Android build: `eas build --platform android --profile preview --no-wait`
   - Triggers iOS build: `eas build --platform ios --profile preview --no-wait`
   - Builds run asynchronously on Expo servers
   - Results viewable on Expo dashboard

### CI Secrets Required

The following secrets must be configured in GitHub repository settings:

- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_TOKEN` - Expo authentication token for EAS builds
- `CODECOV_TOKEN` - (Optional) For private repos with Codecov

### Claude Code Review

A sticky PR comment is automatically created/updated that:

- Summarizes CI check results
- Flags TypeScript errors
- Identifies linting issues
- Highlights formatting problems
- Notes TODO comments

## EAS Build Profiles

Configured in `eas.json`:

### Development Profile

```json
{
  "development": {
    "developmentClient": true,
    "distribution": "internal"
  }
}
```

- For dev builds with expo-dev-client
- Internal distribution only
- No OTA updates

### Preview Profile (Used by CI)

```json
{
  "preview": {
    "distribution": "internal",
    "channel": "preview"
  }
}
```

- Used for CI/PR builds
- Internal distribution
- OTA channel: `preview`
- Builds triggered with `--no-wait` flag

### Production Profile

```json
{
  "production": {
    "autoIncrement": true,
    "channel": "production",
    "env": {
      "APP_ENV": "production"
    }
  }
}
```

- Auto-increments version numbers
- OTA channel: `production`
- Sets `APP_ENV=production` environment variable
- Used for App Store/Play Store releases

## EAS Project Configuration

- **Project ID**: `4652ad8b-2e44-4270-8612-64c4587219d8`
- **Owner**: billchirico
- **Slug**: sobriety-waypoint

## Monitoring Builds

### Via GitHub Actions

- GitHub Actions tab shows CI pipeline status
- Web build artifacts available for 7 days
- Links to EAS builds in workflow logs

### Via Expo Dashboard

- Navigate to: https://expo.dev/accounts/billchirico/projects/sobriety-waypoint
- View build status, logs, and download builds
- Access OTA update history

## Sentry Integration

### Production Only

Sentry is **only active in production builds** to avoid development noise.

### Required Secrets for Production

- `EXPO_PUBLIC_SENTRY_DSN` - Sentry Data Source Name
- `SENTRY_ORG` - Sentry organization slug
- `SENTRY_PROJECT` - Sentry project slug
- `SENTRY_AUTH_TOKEN` - Sentry authentication token

### Source Maps

- Automatically uploaded during production builds
- Uses `@sentry/cli` for upload
- Configured via `app.json` postPublish hooks

### Features

- Error tracking with privacy scrubbing
- Navigation instrumentation
- Performance monitoring
- Release tracking

## Git Hooks (Local Development)

### Husky + lint-staged

Pre-commit hook automatically:

- Formats all staged files with Prettier
- Lints and auto-fixes TypeScript/JavaScript files

### Bypass Hooks

```bash
git commit --no-verify    # Skip hooks (not recommended)
```

**Note**: Hooks only run locally, not in CI. CI runs full checks separately.

## Deployment Checklist

Before deploying to production:

1. ✅ All CI checks pass
2. ✅ Coverage ≥80%
3. ✅ No TypeScript errors
4. ✅ No linting errors
5. ✅ Code properly formatted
6. ✅ Sentry secrets configured (for production builds)
7. ✅ Version number updated (auto-incremented in production profile)
8. ✅ Test on iOS, Android, and Web
9. ✅ Review Sentry error reports before release

## Troubleshooting CI/CD

### Build Failures

- Check GitHub Actions logs for specific error
- Verify all secrets are correctly configured
- Ensure dependencies are up to date
- Check EAS build logs on Expo dashboard

### EAS Build Issues

- Verify `EXPO_TOKEN` secret is valid
- Check Expo account has sufficient build credits
- Review `eas.json` configuration
- Check platform-specific build logs on Expo dashboard

### Sentry Upload Failures

- Verify `SENTRY_AUTH_TOKEN` has project write access
- Check `SENTRY_ORG` and `SENTRY_PROJECT` are correct
- Ensure source maps are generated during build
