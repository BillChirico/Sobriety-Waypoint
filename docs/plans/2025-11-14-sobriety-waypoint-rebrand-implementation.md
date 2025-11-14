# Sobriety Waypoint Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete rebrand from "12-Step Tracker" to "Sobriety Waypoint" with fresh infrastructure, generic recovery language, and new technical identifiers.

**Architecture:** Systematic file-by-file updates in 6 phases: (1) Preparation - document old values and create new infrastructure, (2) Configuration - update all config files and identifiers, (3) Source Code - rename user-facing text, (4) Documentation - update all markdown files with terminology transformation, (5) Infrastructure - GitHub/Serena/EAS setup (manual steps), (6) Validation - comprehensive testing and verification.

**Tech Stack:** Expo 54, React Native 0.81.5, TypeScript, Supabase, Sentry, EAS, pnpm

---

## Phase 1: Preparation

### Task 1: Document Current Values

**Files:**

- Create: `docs/plans/rebrand-rollback-values.md`

**Step 1: Create rollback documentation**

Create file with current values for potential rollback:

```markdown
# Rebrand Rollback Values

**Recorded:** 2025-11-14

## Expo Project

- Project ID: `ca075b23-5398-4570-a6c4-286468f78eb1`
- Name: "12-Step Tracker"
- Slug: `twelve-step-tracker`
- Scheme: `twelvesteptracker`

## Bundle Identifiers

- iOS: `com.volvoxllc.twelvesteptracker`
- Android: `com.volvoxllc.twelvesteptracker`

## Sentry

- Organization: `volvox`
- Project: `12-step-tracker`
- DSN: [Check .env file]

## GitHub

- Repository: `github.com/billchirico/12-step-tracker`

## Package

- Name: `12-step-tracker`
```

**Step 2: Commit rollback doc**

```bash
git add docs/plans/rebrand-rollback-values.md
git commit -m "docs: create rebrand rollback documentation

Record all current values before rebrand for potential rollback.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 2: Create New Expo Project

**Manual Step - Document for user:**

**Step 1: Run eas init**

```bash
eas init
```

**Interactive prompts:**

- Account: Select `volvox-llc`
- Project name: Enter `Sobriety Waypoint`

**Step 2: Document new project ID**

After `eas init` completes, open `app.json` and copy the new project ID from `expo.extra.eas.projectId`.

Add to `docs/plans/rebrand-rollback-values.md`:

```markdown
## New Values

### Expo Project

- New Project ID: `[PASTE_HERE]`
```

**Step 3: Commit project ID documentation**

```bash
git add docs/plans/rebrand-rollback-values.md
git commit -m "docs: document new expo project ID

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 3: Create New Sentry Project

**Manual Step - Document for user:**

**Step 1: Create Sentry project**

1. Go to https://sentry.io/organizations/volvox/projects/new/
2. Platform: **React Native**
3. Project name: **sobriety-waypoint**
4. Team: (select appropriate team)
5. Click **Create Project**

**Step 2: Copy DSN**

After project creation, copy the DSN from the setup page or:

1. Go to Settings → Projects → sobriety-waypoint → Client Keys (DSN)
2. Copy the DSN value

**Step 3: Document new Sentry DSN**

Add to `docs/plans/rebrand-rollback-values.md`:

```markdown
### Sentry

- New Project: `sobriety-waypoint`
- New DSN: `[PASTE_HERE]`
```

**Step 4: Commit Sentry documentation**

```bash
git add docs/plans/rebrand-rollback-values.md
git commit -m "docs: document new sentry project details

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: Configuration Files

### Task 4: Update package.json

**Files:**

- Modify: `package.json:2,8-14`

**Step 1: Update package.json identifiers**

Replace lines 2, 8-14 in `package.json`:

```json
  "name": "sobriety-waypoint",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "private": true,
  "author": "Volvox",
  "license": "MIT",
  "homepage": "https://github.com/billchirico/sobriety-waypoint",
  "repository": {
    "type": "git",
    "url": "https://github.com/billchirico/sobriety-waypoint.git"
  },
  "bugs": {
    "url": "https://github.com/billchirico/sobriety-waypoint/issues"
  },
```

**Step 2: Verify JSON syntax**

```bash
pnpm install --dry-run
```

Expected: No syntax errors

**Step 3: Commit package.json**

```bash
git add package.json
git commit -m "chore: update package.json for sobriety waypoint rebrand

- Update package name to sobriety-waypoint
- Update all GitHub URLs to new repository name

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 5: Update app.json

**Files:**

- Modify: `app.json:8-22,29`

**Step 1: Update app.json with new values**

Replace the relevant sections in `app.json`. **IMPORTANT:** Use the NEW_PROJECT_ID from Task 2.

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "[NEW_PROJECT_ID_FROM_TASK_2]"
      }
    },
    "name": "Sobriety Waypoint",
    "owner": "volvox-llc",
    "slug": "sobriety-waypoint",
    "scheme": "sobrietywaypoint",
    "userInterfaceStyle": "automatic",
    "icon": "./assets/images/logo.png",
    "ios": {
      "bundleIdentifier": "com.volvoxllc.sobrietywaypoint",
      "icon": "./assets/images/logo.png",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.volvoxllc.sobrietywaypoint"
    },
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/",
          "project": "sobriety-waypoint",
          "organization": "volvox"
        }
      ]
    ]
  }
}
```

**Step 2: Verify JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('app.json', 'utf8'))"
```

Expected: No output (syntax valid)

**Step 3: Commit app.json**

```bash
git add app.json
git commit -m "chore: update app.json for sobriety waypoint rebrand

- Update project name and slug
- Update bundle identifiers (iOS/Android)
- Update Sentry project reference
- Update Expo project ID

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 6: Update app.config.ts

**Files:**

- Modify: `app.config.ts:10`

**Step 1: Update app.config.ts display name**

Replace line 10 in `app.config.ts`:

```typescript
  name: 'Sobriety Waypoint',
```

**Step 2: Verify TypeScript syntax**

```bash
pnpm typecheck
```

Expected: No errors

**Step 3: Commit app.config.ts**

```bash
git add app.config.ts
git commit -m "chore: update app.config.ts display name

Update app display name to 'Sobriety Waypoint'

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 7: Update .env.example

**Files:**

- Modify: `.env.example` (if exists, or create)

**Step 1: Check if .env.example exists**

```bash
ls -la .env.example 2>/dev/null || echo "CREATE_NEW"
```

**Step 2: Update or create .env.example**

If file exists, update the Sentry project line. If not, create with:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Facebook OAuth
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# Sentry (Production only)
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=volvox
SENTRY_PROJECT=sobriety-waypoint
SENTRY_AUTH_TOKEN=your-auth-token
```

**Step 3: Commit .env.example**

```bash
git add .env.example
git commit -m "chore: update sentry project in env example

Update SENTRY_PROJECT to sobriety-waypoint

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 8: Verify Configuration Phase

**Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: `No errors`

**Step 2: Run lint**

```bash
pnpm lint
```

Expected: `No lint errors`

**Step 3: Verify package.json is valid**

```bash
pnpm install --frozen-lockfile
```

Expected: Installation succeeds without errors

---

## Phase 3: Source Code Changes

### Task 9: Update app/login.tsx

**Files:**

- Modify: `app/login.tsx:100`

**Step 1: Update login screen title**

Find and replace the title text around line 100:

```typescript
<Text style={styles.title}>Sobriety Waypoint</Text>
```

**Step 2: Verify syntax**

```bash
pnpm typecheck
```

Expected: No errors

**Step 3: Commit login.tsx**

```bash
git add app/login.tsx
git commit -m "feat: update login screen title to sobriety waypoint

Update user-facing app name on login screen

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 10: Update app/onboarding.tsx

**Files:**

- Modify: `app/onboarding.tsx:82`

**Step 1: Update onboarding welcome text**

Find and replace the welcome text around line 82:

```typescript
<Text style={styles.title}>Welcome to Sobriety Waypoint</Text>
```

**Step 2: Verify syntax**

```bash
pnpm typecheck
```

Expected: No errors

**Step 3: Commit onboarding.tsx**

```bash
git add app/onboarding.tsx
git commit -m "feat: update onboarding welcome text

Update welcome message to 'Welcome to Sobriety Waypoint'

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 11: Update app/(tabs)/profile.tsx Part 1

**Files:**

- Modify: `app/(tabs)/profile.tsx:265`

**Step 1: Update invite share message**

Find and replace the share message around line 265:

```typescript
message: `Join me on Sobriety Waypoint! Use invite code: ${code}`,
```

**Step 2: Verify syntax**

```bash
pnpm typecheck
```

Expected: No errors

**Step 3: Commit profile.tsx share message**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: update invite share message

Update share message to reference Sobriety Waypoint

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 12: Update app/(tabs)/profile.tsx Part 2

**Files:**

- Modify: `app/(tabs)/profile.tsx:1049`

**Step 1: Update footer version text**

Find and replace the footer text around line 1049:

```typescript
<Text style={styles.footerText}>Sobriety Waypoint v{packageJson.version}</Text>
```

**Step 2: Verify syntax**

```bash
pnpm typecheck
```

Expected: No errors

**Step 3: Commit profile.tsx footer**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: update app footer with new name

Update footer to display 'Sobriety Waypoint v{version}'

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 13: Update Test Files

**Files:**

- Modify: `__tests__/app/onboarding.test.tsx:80`
- Modify: `__tests__/app/login.test.tsx:110`

**Step 1: Update onboarding test**

In `__tests__/app/onboarding.test.tsx`, find and update around line 80:

```typescript
expect(getByText('Welcome to Sobriety Waypoint')).toBeTruthy();
```

**Step 2: Update login test**

In `__tests__/app/login.test.tsx`, find and update around line 110:

```typescript
expect(getByText('Sobriety Waypoint')).toBeTruthy();
```

**Step 3: Run tests to verify**

```bash
pnpm test
```

Expected: All tests pass (312 tests)

**Step 4: Commit test updates**

```bash
git add __tests__/app/onboarding.test.tsx __tests__/app/login.test.tsx
git commit -m "test: update test assertions for new app name

Update test expectations to match new 'Sobriety Waypoint' branding

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 14: Update Maestro Flows

**Files:**

- Modify: `.maestro/flows/01-authentication.yaml:42`
- Modify: `.maestro/flows/02-onboarding.yaml:41,103,156`
- Modify: `.maestro/flows/07-step-progression.yaml:9`

**Step 1: Update authentication flow**

In `.maestro/flows/01-authentication.yaml`, update text assertion around line 42:

```yaml
text: 'Welcome to Sobriety Waypoint'
```

**Step 2: Update onboarding flow**

In `.maestro/flows/02-onboarding.yaml`, update text assertions around lines 41, 103, 156:

```yaml
# Line 41
      text: 'Welcome to Sobriety Waypoint'
# Line 103
      text: 'Welcome to Sobriety Waypoint'
# Line 156
      text: 'Welcome to Sobriety Waypoint'
```

**Step 3: Update step progression description**

In `.maestro/flows/07-step-progression.yaml`, update description around line 9:

```yaml
# Tests recovery program progression and tracking
```

**Step 4: Commit Maestro updates**

```bash
git add .maestro/flows/
git commit -m "test: update maestro flows for new branding

Update E2E test flows to expect 'Sobriety Waypoint' branding

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 15: Verify Source Code Phase

**Step 1: Run full test suite**

```bash
pnpm test -- --coverage
```

Expected: All tests pass with ≥80% coverage

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: No errors

**Step 3: Run lint**

```bash
pnpm lint
```

Expected: No lint errors

---

## Phase 4: Documentation Updates

### Task 16: Update CLAUDE.md

**Files:**

- Modify: `CLAUDE.md:3,34,48,108,125-133`

**Step 1: Update header**

Line 3:

```markdown
Guidance for Claude Code when contributing to Sobriety Waypoint. Keep this doc handy—most review feedback happens when one of these requirements gets skipped.
```

**Step 2: Update project snapshot**

Line 34:

```markdown
- **App**: Expo 54 · React Native 0.81.5 · React 19 companion app for AA sponsors/sponsees using Sobriety Waypoint.
```

**Step 3: Update architecture diagram**

Line 48:

```
Sobriety-Waypoint/
├── app/                Expo Router entry; `(tabs)` gated behind auth
├── contexts/           AuthContext (Supabase session + OAuth), ThemeContext
├── components/         Shared UI
├── lib/supabase.ts     Typed Supabase client + platform storage adapter
├── supabase/migrations Schema + RLS (source of truth)
├── types/database.ts   Generated DB types
└── docs/               Testing, CI/CD, feature designs
```

**Step 4: Update Sentry reference**

Line 108:

```markdown
5. **EAS profiles** (`eas.json`): `development` (dev client), `preview` (CI/QA, OTA `preview`), `production` (auto version bump, OTA `production`). Project ID: [NEW_PROJECT_ID].
```

**Step 5: Update source-of-truth docs**

Lines 125-133, update any references but keep structure the same.

**Step 6: Commit CLAUDE.md**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for sobriety waypoint rebrand

Update all references to new project name and identifiers

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 17: Update README.md

**Files:**

- Modify: `README.md`

**Step 1: Update title and badge**

Update lines 1-5:

```markdown
# Sobriety Waypoint

![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)](https://expo.dev/accounts/BillChirico/projects/sobriety-waypoint)

A cross-platform companion app that helps sponsors and sponsees stay connected, complete recovery program work, and celebrate sobriety milestones together.
```

**Step 2: Update description section**

Update the description paragraph (around line 21):

```markdown
Sobriety Waypoint combines recovery content, accountability tools, and secure messaging so sponsors can guide sponsees through the AA program without losing context. Everything—tasks, reflections, relapse resets, and progress—lives in one privacy-first workspace.
```

**Step 3: Update features**

Update feature list (around line 29):

```markdown
- Full recovery program content with prompts and personal reflections
```

**Step 4: Update links**

Update Expo dashboard link (around line 173):

```markdown
- Monitor native builds at [Expo builds dashboard](https://expo.dev/accounts/BillChirico/projects/sobriety-waypoint/builds)
```

**Step 5: Commit README.md**

```bash
git add README.md
git commit -m "docs: update README.md for sobriety waypoint rebrand

- Update title and project name
- Update terminology to generic recovery language
- Update Expo dashboard links

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 18: Update CONTRIBUTING.md

**Files:**

- Modify: `CONTRIBUTING.md:1,3,319,384`

**Step 1: Update title**

Line 1:

```markdown
# Contributing to Sobriety Waypoint
```

**Step 2: Update intro**

Line 3:

```markdown
Thank you for your interest in contributing to Sobriety Waypoint! This document provides guidelines and instructions for contributing to the project.
```

**Step 3: Update features section**

Line 319:

```markdown
- `steps` - Recovery program content
```

**Step 4: Update license section**

Line 384:

```markdown
By contributing to Sobriety Waypoint, you agree that your contributions will be licensed under the same license as the project.
```

**Step 5: Commit CONTRIBUTING.md**

```bash
git add CONTRIBUTING.md
git commit -m "docs: update CONTRIBUTING.md for rebrand

Update project name and terminology references

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 19: Update .github/CICD.md

**Files:**

- Modify: `.github/CICD.md:3,399,431,513`

**Step 1: Update header**

Line 3:

```markdown
This document provides detailed information about the continuous integration and deployment setup for the Sobriety Waypoint project.
```

**Step 2: Update Expo URLs**

Update all Expo dashboard URLs:

```markdown
- Line 399: https://expo.dev/accounts/[account]/projects/sobriety-waypoint/builds
- Line 431: https://expo.dev/accounts/[account]/projects/sobriety-waypoint/builds
- Line 513: https://expo.dev/accounts/[account]/projects/sobriety-waypoint/builds
```

**Step 3: Commit CICD.md**

```bash
git add .github/CICD.md
git commit -m "docs: update CI/CD documentation for rebrand

Update project name and Expo URLs

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 20: Update User Guides

**Files:**

- Modify: `docs/USER_GUIDE_SPONSEE.md`
- Modify: `docs/USER_GUIDE_SPONSOR.md`

**Step 1: Update sponsee guide**

Update `docs/USER_GUIDE_SPONSEE.md`:

```markdown
# Line 3

## Welcome to Sobriety Waypoint

# Line 5

This guide will help you navigate the Sobriety Waypoint app as a sponsee working through your recovery journey with the support of a sponsor.

# Line 12

4. [Exploring the Recovery Program](#exploring-the-recovery-program)

# Line 327

The Sobriety Waypoint is here to support your recovery journey. Use it as a tool to stay connected with your sponsor, track your progress, and work through the program steps at your own pace.
```

Apply terminology transformations:

- "12-step program" → "recovery program"
- "12 steps" → "recovery steps"
- "work through the 12 steps" → "work through the recovery program"

**Step 2: Update sponsor guide**

Update `docs/USER_GUIDE_SPONSOR.md`:

```markdown
# Line 3

## Welcome to Sobriety Waypoint

# Line 5

This guide will help you use the Sobriety Waypoint app as a sponsor, supporting your sponsees through their recovery journey using the recovery program.

# Line 537

Thank you for being a sponsor and supporting others in their recovery journey. The Sobriety Waypoint is designed to make your sponsorship more effective and organized, allowing you to focus on what matters most: helping others achieve sobriety.
```

**Step 3: Commit user guides**

```bash
git add docs/USER_GUIDE_SPONSEE.md docs/USER_GUIDE_SPONSOR.md
git commit -m "docs: update user guides for rebrand

- Update app name to Sobriety Waypoint
- Transform terminology to generic recovery language

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 21: Update Developer Documentation

**Files:**

- Modify: `docs/DEVELOPER_GUIDE.md:5,130`
- Modify: `docs/TESTING.md:3`
- Modify: `docs/TESTING_IMPLEMENTATION_SUMMARY.md:9`

**Step 1: Update DEVELOPER_GUIDE.md**

```markdown
# Line 5

This guide will help you set up the Sobriety Waypoint application for local development. The app is built with Expo/React Native, TypeScript, and Supabase.

# Line 130

- **Name**: Sobriety Waypoint (or your choice)
```

**Step 2: Update TESTING.md**

```markdown
# Line 3

This document describes the testing infrastructure and patterns for the Sobriety Waypoint application.
```

**Step 3: Update TESTING_IMPLEMENTATION_SUMMARY.md**

```markdown
# Line 9

The comprehensive testing infrastructure for the Sobriety Waypoint application has been successfully implemented. The project now has a robust testing foundation with 223 passing tests across 21 test suites, comprehensive E2E test flows, and complete documentation.
```

**Step 4: Commit developer docs**

```bash
git add docs/DEVELOPER_GUIDE.md docs/TESTING.md docs/TESTING_IMPLEMENTATION_SUMMARY.md
git commit -m "docs: update developer documentation for rebrand

Update project name references in developer guides

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 22: Update Integration Documentation

**Files:**

- Modify: `docs/SENTRY_SETUP.md`
- Modify: `docs/FACEBOOK_SIGNIN_SETUP.md`
- Modify: `docs/API_*.md` (all API docs)

**Step 1: Update SENTRY_SETUP.md**

Replace all occurrences:

```markdown
# Line 3

This guide provides step-by-step instructions for setting up Sentry error tracking and performance monitoring in the Sobriety Waypoint app.

# Line 7

The Sobriety Waypoint uses Sentry for production error tracking, performance monitoring, and session replay. Key features:

# Line 53

**Example**: `sobriety-waypoint`

# Line 88

4. Name your project: **sobriety-waypoint**

# Line 96

2. Alternatively, navigate to: **Settings** → **Projects** → **sobriety-waypoint** → **Client Keys (DSN)**

# Line 111

1. **Name**: "Sobriety Waypoint - EAS Builds"

# Line 144

SENTRY_PROJECT=sobriety-waypoint

# Line 191

eas secret:create --name SENTRY_PROJECT --value "sobriety-waypoint" --type string

# Line 273

| `SENTRY_PROJECT` | `sobriety-waypoint` |

# Line 337

2. Navigate to your project: **sobriety-waypoint**

# Line 735

- [ ] Project "sobriety-waypoint" created in Sentry
```

**Step 2: Update FACEBOOK_SIGNIN_SETUP.md**

```markdown
# Line 3

This guide walks you through setting up Facebook authentication for the Sobriety Waypoint app.

# Line 26

- **App Name**: Sobriety Waypoint

# Line 133

          "displayName": "Sobriety Waypoint",
```

**Step 3: Update API\_\*.md files**

Update all `docs/API_*.md` files:

- `docs/API_SUPABASE.md:5`
- `docs/API_CONTEXTS.md:5`

Replace project description:

```markdown
This document provides comprehensive API documentation for the [component] integration in the Sobriety Waypoint application.
```

**Step 4: Commit integration docs**

```bash
git add docs/SENTRY_SETUP.md docs/FACEBOOK_SIGNIN_SETUP.md docs/API_*.md
git commit -m "docs: update integration documentation for rebrand

- Update Sentry project references
- Update Facebook app name
- Update API documentation headers

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 23: Update docs/README.md

**Files:**

- Modify: `docs/README.md:1,3,24,43,328,336`

**Step 1: Update main documentation index**

```markdown
# Line 1

# Sobriety Waypoint Documentation

# Line 3

Welcome to the comprehensive documentation for the Sobriety Waypoint application. This directory contains all the guides and references you need to use, develop, and maintain the application.

# Line 24

**Audience**: Individuals working through the recovery program with a sponsor

# Line 43

**Audience**: Individuals sponsoring others through the recovery program

# Line 328

**Thank you for using Sobriety Waypoint!**

# Line 336

_This documentation is maintained by the Sobriety Waypoint development team._
```

**Step 2: Commit docs README**

```bash
git add docs/README.md
git commit -m "docs: update documentation index for rebrand

Update project name and terminology in main docs index

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 24: Update Plan Documents

**Files:**

- Modify: All `docs/plans/*.md` files

**Step 1: Update each plan document**

For each file in `docs/plans/`, update references to:

- "12-Step Tracker" → "Sobriety Waypoint"
- "12-step program" → "recovery program"

Files to update:

- `docs/plans/2025-01-11-testing-infrastructure-design.md`
- `docs/plans/2025-11-13-sentry-integration-implementation.md`
- `docs/plans/2025-11-13-maestro-e2e-complete-suite-design.md`
- `docs/plans/2025-11-13-e2e-testing-design.md`
- `docs/plans/2025-11-13-sentry-integration-design.md`
- `docs/plans/2025-11-12-facebook-signin-design.md`
- `docs/plans/2025-11-12-facebook-signin-implementation.md`

**Step 2: Commit plan updates**

```bash
git add docs/plans/
git commit -m "docs: update plan documents for rebrand

Update all historical plan documents with new project name

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Task 25: Search for Remaining References

**Step 1: Search for "12-step" references**

```bash
grep -r "12-step" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.worktrees --exclude="*.lock" --exclude="pnpm-lock.yaml" | grep -v "Step 1" | grep -v "Step 2" | grep -v rebrand-rollback
```

Expected: Only matches should be in:

- `docs/plans/2025-11-14-sobriety-waypoint-rebrand-design.md` (design doc)
- `docs/plans/rebrand-rollback-values.md` (rollback reference)
- Specific numbered steps like "Step 1", "Step 2", etc. (which we keep)

**Step 2: Search for "Twelve-Step" references**

```bash
grep -r "Twelve-Step" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.worktrees --exclude="*.lock"
```

Expected: No results (or only in design/rollback docs)

**Step 3: Search for "12 Step" references**

```bash
grep -r "12 Step" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.worktrees --exclude="*.lock" | grep -v "Step 1" | grep -v rebrand-rollback
```

Expected: Only in design/rollback docs

**Step 4: Document search results**

If any unexpected matches found, document them for manual review.

---

## Phase 5: Infrastructure (Manual Steps)

### Task 26: Rename GitHub Repository

**Manual Step - Document for user:**

**Step 1: Navigate to GitHub Settings**

1. Go to https://github.com/billchirico/12-step-tracker/settings
2. Scroll to "Repository name"
3. Enter new name: `sobriety-waypoint`
4. Click "Rename"

**Step 2: Verify redirect**

Test that old URL redirects: https://github.com/billchirico/12-step-tracker

Expected: Redirects to https://github.com/billchirico/sobriety-waypoint

**Step 3: Update local remote**

```bash
git push origin main
```

Expected: Remote URL updates automatically

### Task 27: Update EAS Secrets

**Manual Step - Document for user:**

**Step 1: Update Sentry project secret**

```bash
eas secret:create --name SENTRY_PROJECT --value "sobriety-waypoint" --scope project --force
```

**Step 2: Update Sentry DSN secret**

Using the DSN from Task 3:

```bash
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "[DSN_FROM_TASK_3]" --scope project --force
```

**Step 3: Verify secrets**

```bash
eas secret:list
```

Expected: Shows updated SENTRY_PROJECT and EXPO_PUBLIC_SENTRY_DSN values

### Task 28: Update Local Environment

**Manual Step - Document for user:**

**Step 1: Update .env file**

Create or update `.env` file (DO NOT commit this file):

```bash
# From Task 3
EXPO_PUBLIC_SENTRY_DSN=[DSN_FROM_TASK_3]
SENTRY_ORG=volvox
SENTRY_PROJECT=sobriety-waypoint
SENTRY_AUTH_TOKEN=[your-auth-token]

# Existing values (don't change)
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_FACEBOOK_APP_ID=...
```

**Step 2: Verify .env not tracked**

```bash
git status | grep .env
```

Expected: No output (file is gitignored)

### Task 29: Recreate Serena Project

**Manual Step - Document for user:**

This step will be handled by the user manually after implementation completes. Document the process:

**Step 1: Export current memories**

```bash
# In main project directory
cp -r .serena/memories /tmp/waypoint-memories-backup
```

**Step 2: Deactivate current project**

Use Serena MCP to deactivate "12-Step-Tracker"

**Step 3: Create new project**

Use Serena MCP to create "Sobriety-Waypoint" at current path

**Step 4: Recreate memory files**

Update and recreate memory files with new branding from backup

---

## Phase 6: Validation & Testing

### Task 30: Run Full Quality Checks

**Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: ✓ No errors found

**Step 2: Run lint**

```bash
pnpm lint
```

Expected: ✓ No lint errors

**Step 3: Run format check**

```bash
pnpm format:check
```

Expected: ✓ All files formatted correctly

### Task 31: Run Test Suite

**Step 1: Run unit tests**

```bash
pnpm test
```

Expected: All 312 tests pass, 28 test suites

**Step 2: Run coverage check**

```bash
pnpm test -- --coverage
```

Expected: ≥80% coverage on all metrics

**Step 3: Review coverage report**

Check that coverage is maintained across:

- Statements: ≥80%
- Branches: ≥80%
- Functions: ≥80%
- Lines: ≥80%

### Task 32: Test Development Build

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Test on web**

1. Open browser to http://localhost:8081
2. Verify login screen shows "Sobriety Waypoint"
3. Create test account or login
4. Verify onboarding shows "Welcome to Sobriety Waypoint"
5. Navigate through app, check footer shows "Sobriety Waypoint v1.0.0"

**Step 3: Test on iOS (if available)**

```bash
pnpm ios
```

Verify same UI elements on iOS simulator

**Step 4: Test on Android (if available)**

```bash
pnpm android
```

Verify same UI elements on Android emulator

**Step 5: Stop dev server**

Press Ctrl+C to stop

### Task 33: Test Preview Build

**Step 1: Trigger preview build**

```bash
eas build --platform all --profile preview --non-interactive
```

**Step 2: Monitor build progress**

```bash
eas build:list --limit 2
```

Wait for builds to complete (check Expo dashboard)

**Step 3: Verify build artifacts**

When builds complete:

- Check iOS build has bundle ID: `com.volvoxllc.sobrietywaypoint`
- Check Android build has package: `com.volvoxllc.sobrietywaypoint`

**Step 4: Install and test build**

Download and install preview build on test device:

- Verify app displays "Sobriety Waypoint"
- Test authentication flow
- Verify Sentry integration (check Sentry dashboard for test events)

### Task 34: Verify OAuth Configuration

**Manual verification checklist:**

**Step 1: Google OAuth**

- [ ] Google Cloud Console has new bundle IDs added
  - iOS: `com.volvoxllc.sobrietywaypoint`
  - Android: `com.volvoxllc.sobrietywaypoint`
- [ ] Test Google Sign In on preview build

**Step 2: Facebook OAuth**

- [ ] Facebook Developer Console has new bundle IDs added
  - iOS: `com.volvoxllc.sobrietywaypoint`
  - Android: `com.volvoxllc.sobrietywaypoint`
- [ ] Test Facebook Sign In on preview build

**Step 3: Document results**

Note any OAuth issues for resolution before production release

### Task 35: Final Verification

**Step 1: Search for old references**

```bash
# Should only find references in design/rollback docs
grep -r "12-step-tracker" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.worktrees | grep -v "rebrand"
```

**Step 2: Verify all commits**

```bash
git log --oneline origin/main..HEAD
```

Expected: ~20-25 commits for the rebrand

**Step 3: Verify no uncommitted changes**

```bash
git status
```

Expected: Working tree clean (except .env which is gitignored)

**Step 4: Create final summary**

Document verification results:

```markdown
# Rebrand Verification Results

**Date:** [TODAY]

## Quality Checks

- ✓ TypeScript: No errors
- ✓ ESLint: No errors
- ✓ Prettier: All files formatted
- ✓ Tests: 312 passing (28 suites)
- ✓ Coverage: ≥80% all metrics

## Builds

- ✓ Web: Development build working
- ✓ iOS: [Pass/Fail]
- ✓ Android: [Pass/Fail]
- ✓ EAS Preview: [Build IDs]

## OAuth Testing

- [ ] Google Sign In: [Pass/Fail/Pending]
- [ ] Facebook Sign In: [Pass/Fail/Pending]

## Outstanding Items

- [ ] GitHub repository renamed
- [ ] Serena project recreated
- [ ] EAS secrets updated
- [ ] OAuth providers updated
```

---

## Post-Implementation Checklist

After all phases complete, verify:

- [ ] All source code updated
- [ ] All configuration files updated
- [ ] All documentation updated
- [ ] All tests passing
- [ ] Preview builds successful with new bundle IDs
- [ ] No "12-step-tracker" references (except design/rollback docs)
- [ ] All commits use proper format with Claude attribution
- [ ] OAuth redirect URIs documented for manual update
- [ ] EAS secrets updated
- [ ] Local .env updated

## Next Steps (User Action Required)

1. **GitHub Repository**: Manually rename via Settings (Task 26)
2. **OAuth Providers**: Update bundle IDs in Google/Facebook consoles (Task 34)
3. **Serena Project**: Recreate with new branding (Task 29)
4. **App Store Submissions**: Create new listings with new bundle IDs
5. **User Communication**: Plan announcement for app rebrand
6. **Production Release**: Build and submit to app stores

## Rollback Procedure (If Needed)

If critical issues found:

1. Revert all commits: `git revert [first-commit]..HEAD`
2. Restore GitHub repository name (if renamed)
3. Use old Expo project ID from `docs/plans/rebrand-rollback-values.md`
4. Use old Sentry project configuration
5. Keep old app store listings active
