# CI/CD Documentation

This document provides detailed information about the continuous integration and deployment setup for the 12-Step Tracker project.

## Table of Contents

- [Overview](#overview)
- [Pipeline Flow](#pipeline-flow)
- [Workflow Triggers](#workflow-triggers)
- [Concurrency Control](#concurrency-control)
- [Jobs](#jobs)
  - [Lint, Format, and Type Check](#1-lint-format-and-type-check)
  - [Build for Web](#2-build-for-web)
  - [Build for Android](#3-build-for-android)
  - [Build for iOS](#4-build-for-ios)
- [Required Secrets](#required-secrets)
- [Caching Strategy](#caching-strategy)
- [Performance Optimizations](#performance-optimizations)
- [Troubleshooting](#troubleshooting)
- [Monitoring](#monitoring)
- [Development Workflow](#development-workflow)
- [Quick Reference](#quick-reference)

## Overview

The project uses GitHub Actions for automated testing, linting, type checking, and multi-platform building (Web, Android, iOS). The workflow is defined in `.github/workflows/ci.yml`.

**Key Capabilities**:

- Automated quality checks (TypeScript, ESLint, Prettier)
- Parallel multi-platform builds
- EAS integration for native mobile apps
- Concurrency control to cancel outdated runs
- Build artifact management

## Pipeline Flow

```
Push to main/develop or PR
        ↓
[Lint, Format, Type Check]
        ↓
    ┌───┴───┬─────────┐
    ↓       ↓         ↓
[Web]  [Android]  [iOS]
 (2-3m)  (1-2m)*  (1-2m)*

* GitHub workflow completes in 1-2m
  EAS builds continue async (5-20m)
```

**Job Dependencies**:

- All build jobs wait for lint/typecheck to pass
- Build jobs run in parallel (Web, Android, iOS)
- Mobile builds trigger on EAS but don't block the workflow

## Workflow Triggers

The CI pipeline runs automatically on:

- **Push events** to:
  - `main` branch
  - `develop` branch
- **Pull requests** targeting:
  - `main` branch
  - `develop` branch

## Concurrency Control

The workflow uses GitHub Actions concurrency control to automatically cancel outdated workflow runs when new commits are pushed to the same branch or pull request.

**Configuration**:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**How It Works**:

- **Grouping**: Workflows are grouped by workflow name and git reference (branch/PR)
- **Cancellation**: When a new commit is pushed, any in-progress workflows for the same group are automatically cancelled
- **Resource Efficiency**: Saves CI/CD resources by not running outdated builds
- **Faster Feedback**: Developers get feedback on the latest code faster

**Benefits**:

- **Cost Savings**: Reduces unnecessary workflow runs, saving GitHub Actions minutes
- **Improved Developer Experience**: Latest changes are tested immediately without waiting for outdated runs
- **Cleaner Actions Tab**: Fewer failed/cancelled runs cluttering the workflow history

**Example Scenarios**:

1. **Rapid Commits**: Developer pushes 3 commits in quick succession
   - First workflow starts
   - Second commit triggers new workflow, cancels first
   - Third commit triggers new workflow, cancels second
   - Only the third (latest) workflow completes

2. **Pull Request Updates**: Force push to a PR branch
   - Old workflow run is cancelled immediately
   - New workflow starts with updated code

3. **Multiple Branches**: Work on different branches simultaneously
   - Each branch has its own concurrency group
   - Workflows don't interfere with each other

## Jobs

### 1. Lint, Format, and Type Check

**Purpose**: Validates code quality, formatting, and TypeScript correctness

**Steps**:

1. Checkout code
2. Setup Node.js 22 (latest LTS)
3. Install pnpm (latest version)
4. Setup pnpm cache (for faster builds)
5. Install dependencies with `pnpm install --frozen-lockfile`
6. Run TypeScript type checking (`pnpm typecheck`)
7. Run ESLint (`pnpm lint`)
8. Check code formatting (`pnpm format:check`)

**Duration**: ~2-3 minutes (with cache)

**Failure Scenarios**:

- TypeScript type errors
- ESLint violations
- Code formatting issues (not matching Prettier rules)
- Missing dependencies

### 2. Build for Web

**Purpose**: Creates production web build to verify build process

**Dependencies**: Runs after lint-and-typecheck succeeds

**Steps**:

1. Checkout code
2. Setup Node.js 22 (latest LTS)
3. Install pnpm (latest version)
4. Setup pnpm cache
5. Install dependencies with `pnpm install --frozen-lockfile`
6. Build web application (`pnpm build:web`)
7. Upload build artifacts

**Duration**: ~3-5 minutes (with cache)

**Build Output**: Stored in `dist/` directory and uploaded as GitHub artifact

**Artifact Retention**: 7 days

**Failure Scenarios**:

- Build configuration errors
- Missing environment variables
- Expo build failures

### 3. Build for Android

**Purpose**: Triggers EAS build for Android platform

**Dependencies**: Runs after lint-and-typecheck succeeds

**Steps**:

1. Checkout code
2. Setup Node.js 22 (latest LTS)
3. Install pnpm (latest version)
4. Setup pnpm cache
5. Install dependencies with `pnpm install --frozen-lockfile`
6. Setup Expo and EAS CLI
7. Trigger Android build with EAS (`eas build --platform android --profile preview`)

**Duration**: ~1-2 minutes (workflow) + 5-15 minutes (EAS build on remote infrastructure)

**Build Profile**: Uses `preview` profile from `eas.json`

**Build Location**: Builds run on EAS infrastructure (not GitHub Actions runners)

**Build Output**: Build artifacts are managed by EAS and available in Expo dashboard

**Failure Scenarios**:

- Missing `EXPO_TOKEN` secret
- EAS configuration errors
- Build profile issues in `eas.json`
- Native dependencies conflicts
- Code signing issues (certificates, provisioning profiles)

**Notes**:

- Uses `--no-wait` flag so workflow doesn't wait for EAS build to complete
- Build status can be monitored in Expo dashboard
- Builds are queued on EAS infrastructure
- Environment variables from GitHub secrets are passed to the build

**Preview Profile Configuration** (`eas.json`):

```json
"preview": {
  "distribution": "internal",
  "channel": "preview",
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
  },
  "ios": {
    "buildConfiguration": "Release"
  },
  "android": {
    "buildType": "apk"
  }
}
```

- **distribution**: Internal distribution for testing
- **channel**: OTA update channel for preview builds
- **env**: Environment variables injected into the build
- **ios.buildConfiguration**: Uses Release build for better performance
- **android.buildType**: Produces APK (faster than AAB for testing)

### 4. Build for iOS

**Purpose**: Triggers EAS build for iOS platform

**Dependencies**: Runs after lint-and-typecheck succeeds

**Steps**:

1. Checkout code
2. Setup Node.js 22 (latest LTS)
3. Install pnpm (latest version)
4. Setup pnpm cache
5. Install dependencies with `pnpm install --frozen-lockfile`
6. Setup Expo and EAS CLI
7. Trigger iOS build with EAS (`eas build --platform ios --profile preview`)

**Duration**: ~1-2 minutes (workflow) + 10-20 minutes (EAS build on remote infrastructure)

**Build Profile**: Uses `preview` profile from `eas.json`

**Build Location**: Builds run on EAS infrastructure with macOS workers (not GitHub Actions runners)

**Build Output**: Build artifacts are managed by EAS and available in Expo dashboard

**Failure Scenarios**:

- Missing `EXPO_TOKEN` secret
- EAS configuration errors
- Build profile issues in `eas.json`
- Native dependencies conflicts
- Apple code signing issues (certificates, provisioning profiles)
- App Store Connect API key issues

**Notes**:

- Uses `--no-wait` flag so workflow doesn't wait for EAS build to complete
- Build status can be monitored in Expo dashboard
- Builds use EAS macOS infrastructure (GitHub Actions macOS runners not required)
- iOS builds may take longer due to Apple toolchain compilation
- Environment variables from GitHub secrets are passed to the build
- Uses the same `preview` profile configuration as Android (see above)

## Required Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret Name                     | Description                      | Required For                       |
| ------------------------------- | -------------------------------- | ---------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL        | All build jobs (Web, Android, iOS) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key      | All build jobs (Web, Android, iOS) |
| `EXPO_TOKEN`                    | Expo access token for EAS builds | Android and iOS build jobs         |

**Notes**:

- Secrets are only used during the build process and are not exposed in logs
- To get your `EXPO_TOKEN`: Run `eas login && eas whoami` and copy the token, or create one at https://expo.dev/accounts/[account]/settings/access-tokens

## Caching Strategy

The workflow uses GitHub Actions cache to speed up builds:

- **Cache Key**: Based on `pnpm-lock.yaml` hash
- **Cache Path**: pnpm store directory
- **Cache Restore**: Falls back to latest cache if exact match not found

**Benefits**:

- Reduces build time from ~5-7 minutes to ~2-3 minutes
- Saves bandwidth by not re-downloading unchanged dependencies
- More consistent build times

## Performance Optimizations

1. **Frozen Lockfile**: Uses `--frozen-lockfile` to ensure consistent installations and fail fast if lockfile is out of sync
2. **Parallel Jobs**: Lint/typecheck can run independently, saving time
3. **Dependency Caching**: pnpm cache significantly speeds up installation
4. **Artifact Upload**: Only uploads build artifacts, not all node_modules
5. **Concurrency Control**: Automatically cancels outdated workflow runs to save resources and provide faster feedback

## Troubleshooting

### Build Failing on CI but Passing Locally

**Possible Causes**:

- Different Node.js version (CI uses Node 22)
- Missing environment variables
- Uncommitted changes to `pnpm-lock.yaml`

**Solutions**:

1. Ensure `pnpm-lock.yaml` is committed
2. Run `pnpm install` locally to sync lockfile
3. Verify secrets are configured in GitHub

### Cache Issues

**Symptoms**:

- Slower than expected builds
- Dependency installation errors

**Solutions**:

1. Clear GitHub Actions cache:
   - Go to Actions → Caches
   - Delete relevant caches
2. Push a change to `pnpm-lock.yaml` to invalidate cache

### TypeScript Errors Only on CI

**Possible Causes**:

- Local vs remote TypeScript version mismatch
- Missing type definitions

**Solutions**:

1. Run `pnpm typecheck` locally first
2. Ensure all dependencies are in `pnpm-lock.yaml`
3. Check `typescript` version in `package.json` devDependencies

### ESLint Failures

**Common Issues**:

- Code that passes locally but fails in CI usually means eslint config differences
- Pre-commit hooks not catching issues
- Hooks were skipped with `--no-verify`

**Solutions**:

1. Run `pnpm lint` before pushing
2. Ensure pre-commit hooks are running (see `.github/GIT_HOOKS.md`)
3. Review ESLint configuration in `package.json` or `.eslintrc`
4. Check lint-staged configuration in `package.json`
5. Don't skip pre-commit hooks unless absolutely necessary

### EAS Build Failures (Android/iOS)

**Symptoms**:

- Workflow completes but build fails on EAS
- Missing EXPO_TOKEN error
- Build configuration errors

**Common Issues**:

1. **Missing EXPO_TOKEN**:
   - Error: "Authentication token is required"
   - Solution: Add EXPO_TOKEN to GitHub secrets

2. **EAS Build Quota Exceeded**:
   - Error: Build quota exceeded
   - Solution: Check your Expo plan limits or upgrade

3. **Code Signing Issues**:
   - iOS: Missing provisioning profile or certificate
   - Android: Missing keystore
   - Solution: Run `eas credentials` to configure

4. **Native Dependencies**:
   - Error: Build fails during native compilation
   - Solution: Check `eas.json` configuration and native dependencies

5. **Build Profile Issues**:
   - Error: Profile "preview" not found
   - Solution: Verify `eas.json` has the correct profile configuration

**Monitoring EAS Builds**:

1. Visit Expo dashboard: https://expo.dev/accounts/[account]/projects/12-step-tracker/builds
2. Check build logs for detailed error messages
3. Use `eas build:list` command locally to see build status

**Solutions**:

1. Test builds locally first: `eas build --platform android --profile preview --local`
2. Verify credentials: `eas credentials`
3. Check EAS configuration: Review `eas.json` and `app.json`
4. Review build logs in Expo dashboard for specific errors

## Monitoring

### Viewing Workflow Runs

1. Go to repository → Actions tab
2. Click on workflow run to see details
3. Click on individual jobs to see logs

### Understanding Build Artifacts

**Web Build Artifacts**:

- Located under workflow run → Artifacts section
- Download as zip file
- Extract to view built application
- Useful for debugging production builds
- Retained for 7 days

**Mobile Build Artifacts (Android/iOS)**:

- Managed by EAS, not stored in GitHub Actions artifacts
- Access via Expo dashboard: https://expo.dev/accounts/[account]/projects/12-step-tracker/builds
- Download APK (Android) or IPA (iOS) files from Expo
- Build logs available in Expo dashboard
- Builds retained according to your Expo plan

### Status Badges

Add to README if desired:

```markdown
![CI](https://github.com/YOUR_USERNAME/12-Step-Tracker/workflows/CI/badge.svg)
```

## Future Enhancements

Potential improvements to consider:

1. **Test Job**: Add automated testing when tests are implemented
2. **Deploy Job**: Automatically deploy web build to hosting on main branch pushes
3. **Automatic Submission**: Submit successful builds to app stores automatically
4. **Code Coverage**: Track test coverage over time
5. **Dependabot**: Automatically update dependencies
6. **Security Scanning**: Add CodeQL or similar security analysis
7. **Build Caching**: Cache native build artifacts to speed up EAS builds
8. **Preview Deployments**: Deploy preview builds for each PR

## Development Workflow

Recommended workflow when working with this CI:

1. **Before Committing**:
   - Run `pnpm typecheck` locally
   - Run `pnpm lint` locally
   - Ensure all changes are tested
   - For native code changes, test with `eas build --platform [android|ios] --profile development --local`

2. **Creating Pull Requests**:
   - Wait for CI to pass before requesting review
   - Check CI logs if failures occur
   - For mobile build failures, check Expo dashboard for detailed logs
   - Fix issues and push again

3. **Monitoring Builds**:
   - Web builds: Check GitHub Actions artifacts
   - Mobile builds: Monitor via Expo dashboard
   - Build notifications available in Expo account settings

4. **Merging**:
   - Ensure all CI jobs pass (lint, web build, Android build, iOS build)
   - Squash commits if desired
   - CI will run again on merged commit
   - Check Expo dashboard to verify mobile builds complete successfully

## Quick Reference

### Useful Commands

```bash
# Run checks locally (before pushing)
pnpm typecheck          # Check TypeScript types
pnpm lint               # Run ESLint
pnpm format:check       # Check code formatting
pnpm format             # Auto-format code

# Build locally
pnpm build:web          # Build for web

# EAS builds (local)
eas build --platform android --profile development --local
eas build --platform ios --profile development --local

# EAS builds (remote, same as CI)
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Check build status
eas build:list          # List recent builds
```

### Important Links

- **GitHub Actions**: [Repository Actions Tab](../../actions)
- **EAS Dashboard**: https://expo.dev/accounts/[account]/projects/12-step-tracker/builds
- **CI Workflow**: `.github/workflows/ci.yml`
- **EAS Config**: `eas.json`
- **Git Hooks**: `.github/GIT_HOOKS.md`
- **Project Documentation**: `README.md`, `CLAUDE.md`

### Workflow File Locations

- Main CI: `.github/workflows/ci.yml`
- Code Review: `.github/workflows/claude-code-review.yml`
- Security Review: `.github/workflows/security-review.yml`
- Documentation: `.github/workflows/docs-update.yml`

## Contact

For questions or issues with CI/CD, check:

- GitHub Actions logs
- This documentation
- `.github/workflows/ci.yml` for workflow definition
- Expo dashboard for mobile build issues
