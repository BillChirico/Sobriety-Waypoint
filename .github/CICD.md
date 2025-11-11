# CI/CD Documentation

This document provides detailed information about the continuous integration and deployment setup for the 12-Step Tracker project.

## Overview

The project uses GitHub Actions for automated testing, linting, type checking, and building. The workflow is defined in `.github/workflows/ci.yml`.

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

### 2. Build

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

## Required Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret Name                     | Description                 | Required For |
| ------------------------------- | --------------------------- | ------------ |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL   | Build job    |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Build job    |

**Note**: These secrets are only used during the build process and are not exposed in logs.

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

**Solutions**:

1. Run `pnpm lint` before pushing
2. Use `pnpm lint` in pre-commit hooks
3. Review ESLint configuration in `.eslintrc` or package.json

## Monitoring

### Viewing Workflow Runs

1. Go to repository → Actions tab
2. Click on workflow run to see details
3. Click on individual jobs to see logs

### Understanding Build Artifacts

Build artifacts contain the compiled web application:

- Located under workflow run → Artifacts section
- Download as zip file
- Extract to view built application
- Useful for debugging production builds

### Status Badges

Add to README if desired:

```markdown
![CI](https://github.com/YOUR_USERNAME/12-Step-Tracker/workflows/CI/badge.svg)
```

## Future Enhancements

Potential improvements to consider:

1. **Test Job**: Add automated testing when tests are implemented
2. **Deploy Job**: Automatically deploy to hosting on main branch pushes
3. **Mobile Builds**: Use EAS Build for native app builds
4. **Code Coverage**: Track test coverage over time
5. **Dependabot**: Automatically update dependencies
6. **Security Scanning**: Add CodeQL or similar security analysis

## Development Workflow

Recommended workflow when working with this CI:

1. **Before Committing**:
   - Run `pnpm typecheck` locally
   - Run `pnpm lint` locally
   - Ensure all changes are tested

2. **Creating Pull Requests**:
   - Wait for CI to pass before requesting review
   - Check CI logs if failures occur
   - Fix issues and push again

3. **Merging**:
   - Ensure CI passes on PR
   - Squash commits if desired
   - CI will run again on merged commit

## Contact

For questions or issues with CI/CD, check:

- GitHub Actions logs
- This documentation
- `.github/workflows/ci.yml` for workflow definition
