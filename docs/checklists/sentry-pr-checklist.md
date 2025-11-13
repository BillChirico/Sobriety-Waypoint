# Sentry Integration - Pull Request Checklist

Use this checklist to verify the Sentry integration is complete and ready for production.

## Code Changes

- [ ] Sentry SDK dependencies installed (@sentry/react-native, @sentry/react, sentry-expo)
- [ ] Privacy scrubbing module created (lib/sentry-privacy.ts)
- [ ] Sentry configuration module created (lib/sentry.ts)
- [ ] ErrorBoundary component created (components/ErrorBoundary.tsx)
- [ ] Sentry initialized in root layout (app/\_layout.tsx)
- [ ] AuthContext integrated with Sentry user tracking
- [ ] EAS configuration updated (app.config.ts, eas.json)

## Testing

- [ ] All tests passing (312+ tests)
- [ ] Privacy scrubbing tests added and passing (13 tests)
- [ ] ErrorBoundary tests added and passing (3 tests)
- [ ] AuthContext Sentry integration tests added and passing (3 tests)
- [ ] Edge case tests passing (circular references, large strings, etc.)
- [ ] No test regressions introduced
- [ ] TypeScript compilation successful (0 errors)
- [ ] Linting passing (0 errors)
- [ ] Code formatting verified (Prettier)

## Documentation

- [ ] SENTRY_SETUP.md created with comprehensive setup guide
- [ ] CLAUDE.md updated with Sentry context
- [ ] README.md updated with Sentry section
- [ ] Environment variables documented
- [ ] Privacy scrubbing documented

## Configuration

- [ ] sentry-expo plugin configured in app.config.ts
- [ ] Sentry environment variables added to all EAS build profiles
- [ ] Production-only initialization verified
- [ ] Source map upload configuration verified

## Security & Privacy

- [ ] Sensitive fields list comprehensive (messages, sobriety_date, email, etc.)
- [ ] Email redaction working
- [ ] User PII removal working
- [ ] Circular reference handling implemented
- [ ] Null/undefined handling implemented
- [ ] No secrets committed to git

## Pre-Production Verification

- [ ] Test in development (Sentry disabled)
- [ ] Test in preview build (Sentry enabled)
- [ ] Verify error capture works in preview
- [ ] Verify user context set correctly
- [ ] Verify privacy scrubbing works
- [ ] Verify source maps upload (check EAS build logs)
- [ ] Monitor first production errors in Sentry dashboard

## GitHub Actions / CI

- [ ] Add EXPO_PUBLIC_SENTRY_DSN to GitHub secrets
- [ ] Add SENTRY_ORG to GitHub secrets
- [ ] Add SENTRY_PROJECT to GitHub secrets
- [ ] Add SENTRY_AUTH_TOKEN to GitHub secrets
- [ ] Verify CI builds pass with Sentry configured

## Final Checks

- [ ] All commits follow conventional commit format
- [ ] Branch rebased on latest main
- [ ] No merge conflicts
- [ ] Working tree clean (no uncommitted changes)
- [ ] Memory-keeper checkpoint created

## Post-Merge Actions

- [ ] Monitor Sentry dashboard for first events
- [ ] Verify error grouping is working
- [ ] Set up alert rules for critical errors
- [ ] Configure release tracking
- [ ] Share Sentry access with team

---

## Notes

Add any additional notes or context for reviewers here.
