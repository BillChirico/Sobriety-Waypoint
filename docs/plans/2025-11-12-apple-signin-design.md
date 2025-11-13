# Apple Sign In Implementation Design

**Date:** November 12, 2025
**Issue:** #21 - Add Apple Sign In as authentication provider
**Status:** Approved Design
**Approach:** Documentation-First Implementation

## Overview

Add Apple Sign In as an authentication option alongside existing email/password, Google OAuth, and Facebook OAuth methods. This implementation will meet App Store requirements for apps offering third-party social login and provide iOS users with their expected privacy-focused authentication method.

## Success Criteria

- Users can sign in with Apple on iOS, Android, and Web
- New Apple users automatically get profiles created (matching Google/Facebook OAuth pattern)
- Deep linking works correctly for native mobile apps
- UI matches existing OAuth button design and follows Apple's branding guidelines
- Comprehensive documentation enables configuration without external assistance
- 80% test coverage maintained

## Implementation Strategy

**Approach:** Documentation-First

Create comprehensive setup documentation first, allowing external configuration (Apple Developer Console + Supabase) to proceed in parallel with code implementation. This approach:

- Provides clear instructions for complex external setup
- Enables early detection of configuration issues
- Allows code implementation to reference specific config values
- Maintains quality pattern established by existing OAuth documentation

## Design Details

### 1. Documentation Structure

**File:** `APPLE_SIGNIN_SETUP.md`

The setup guide will follow the proven pattern from `GOOGLE_OAUTH_SETUP.md` and `FACEBOOK_SIGNIN_SETUP.md`.

**Document Sections:**

1. **Prerequisites**
   - Apple Developer account requirements
   - Supabase project access
   - Bundle ID information (`com.billchirico.12steptracker`)

2. **Apple Developer Console Setup**
   - Creating/configuring Services ID for "Sign in with Apple"
   - Enabling capability for bundle ID
   - Generating and downloading private key (.p8 file)
   - Configuring return URLs (web and native redirect URIs)
   - Locating Team ID, Services ID, and Key ID

3. **Supabase Configuration**
   - Enabling Apple provider in Authentication settings
   - Uploading .p8 private key file
   - Entering Services ID, Team ID, and Key ID
   - Configuring redirect URLs:
     - Production: `https://vzwdsjphpabtxhmffous.supabase.co/auth/v1/callback`
     - Native: `12stepstracker://auth/callback`
     - Development: `localhost` URLs
   - Testing the connection

4. **Platform-Specific Notes**
   - **iOS:** App Store requirements, entitlements, deep linking setup
   - **Android:** Redirect URI configuration, testing considerations
   - **Web:** OAuth callback handling, browser compatibility

5. **Troubleshooting**
   - Common issues: "Invalid client" errors, redirect mismatches
   - Missing email handling (Apple allows hiding email)
   - Configuration validation checklist

**Deliverables:**

- Comprehensive setup guide with code snippets
- Screenshot placeholders for Apple Developer Console and Supabase UI
- Testing checklist
- Troubleshooting decision tree

### 2. AuthContext Implementation

**File:** `contexts/AuthContext.tsx`

Add `signInWithApple` method following the established pattern from `signInWithGoogle` (lines 144-192).

**Type Updates:**

```typescript
interface AuthContextType {
  // ... existing properties
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>; // NEW
}
```

**Method Placement:**
Position between `signInWithFacebook` and the context provider for logical grouping.

**Web Flow:**

```typescript
if (Platform.OS === 'web') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
}
```

**Native Flow:**

```typescript
else {
  const redirectUrl = makeRedirectUri({
    scheme: '12stepstracker',
    path: 'auth/callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const access_token = url.searchParams.get('access_token');
      const refresh_token = url.searchParams.get('refresh_token');

      if (access_token && refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) throw sessionError;

        if (sessionData.user) {
          await createOAuthProfileIfNeeded(sessionData.user);
        }
      }
    }
  }
}
```

**Key Implementation Notes:**

- Reuses existing imports: `expo-web-browser`, `expo-auth-session`
- Identical error handling pattern as Google/Facebook
- Calls `createOAuthProfileIfNeeded` for new users
- Handles user cancellation gracefully (return without throwing)
- Approximately 50 lines, nearly identical to `signInWithGoogle`

### 3. UI Components & Styling

#### AppleLogo Component

**File:** `components/auth/SocialLogos.tsx`

Add `AppleLogo` export following the `GoogleLogo` and `FacebookLogo` pattern:

```typescript
export const AppleLogo = ({ size = 20 }: LogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
    <Path
      d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09l-.1-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      fill="#000000"
    />
  </Svg>
);
```

**Design Compliance:**

- Official Apple logo shape per Apple's Human Interface Guidelines
- Black color (#000000) as required by Apple branding
- Consistent size prop and margin with other logos

#### Login Screen Updates

**File:** `app/login.tsx`

**State Management:**

```typescript
const [appleLoading, setAppleLoading] = useState(false);
const { signIn, signInWithGoogle, signInWithFacebook, signInWithApple } = useAuth();
```

**Handler Function:**

```typescript
const handleAppleSignIn = async () => {
  setAppleLoading(true);
  try {
    await signInWithApple();
  } catch (error: any) {
    if (Platform.OS === 'web') {
      window.alert('Error: ' + (error.message || 'Failed to sign in with Apple'));
    } else {
      Alert.alert('Error', error.message || 'Failed to sign in with Apple');
    }
  } finally {
    setAppleLoading(false);
  }
};
```

**Button Component:**
Position between Facebook button and "Create New Account" button:

```typescript
<TouchableOpacity
  style={[styles.appleButton, appleLoading && styles.buttonDisabled]}
  onPress={handleAppleSignIn}
  disabled={loading || googleLoading || facebookLoading || appleLoading}
>
  {!appleLoading && <AppleLogo size={20} />}
  <Text style={styles.appleButtonText}>
    {appleLoading ? 'Signing in with Apple...' : 'Continue with Apple'}
  </Text>
</TouchableOpacity>
```

**Styling:**

```typescript
appleButton: {
  backgroundColor: '#000000', // Apple branding requires black
  borderRadius: 12,
  padding: 16,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
},
appleButtonText: {
  color: '#ffffff', // White text on black background
  fontSize: 16,
  fontFamily: theme.fontRegular,
  fontWeight: '600',
},
```

#### Signup Screen Updates

**File:** `app/signup.tsx`

Apply identical changes as login screen to maintain consistency:

- Add `appleLoading` state
- Add `handleAppleSignIn` handler
- Add Apple Sign In button with same positioning and styling
- Import `AppleLogo` component

### 4. Testing Strategy

#### Unit Tests - AuthContext

**File:** `contexts/__tests__/AuthContext.test.tsx`

Test cases following existing Google/Facebook test patterns:

1. **Web Flow:**
   - Mock `supabase.auth.signInWithOAuth`
   - Verify called with `provider: 'apple'` and correct `redirectTo`
   - Test error handling

2. **Native Flow:**
   - Mock `Platform.OS` as 'ios'/'android'
   - Mock `WebBrowser.openAuthSessionAsync` success response
   - Verify token extraction from callback URL
   - Verify `setSession` called with correct tokens
   - Test `createOAuthProfileIfNeeded` called for new users

3. **Error Scenarios:**
   - Network failures
   - User cancellation (`result.type === 'cancel'`)
   - Missing tokens in callback URL
   - Session creation errors

4. **Platform Detection:**
   - Test both web and native code paths
   - Mock `Platform.OS` for cross-platform coverage

#### Component Tests

**File:** `components/auth/__tests__/SocialLogos.test.tsx`

```typescript
describe('AppleLogo', () => {
  it('renders with default size', () => {
    const { container } = render(<AppleLogo />);
    expect(container).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { container } = render(<AppleLogo size={32} />);
    expect(container).toBeTruthy();
  });
});
```

**Files:** `app/__tests__/login.test.tsx`, `app/__tests__/signup.test.tsx`

Test cases for both screens:

1. Apple Sign In button renders
2. Button shows correct text and logo
3. Click handler calls `signInWithApple`
4. Loading state shows "Signing in with Apple..."
5. Logo hidden during loading
6. Error alerts display properly
7. Button disabled when any auth in progress

#### Integration Tests

**Optional E2E Maestro Flow** (after configuration):

- Complete Apple Sign In journey
- Profile creation for new users
- Error handling scenarios

**Test IDs for E2E:**

```typescript
testID = 'apple-sign-in-button';
```

#### Coverage Requirements

- Maintain 80% coverage threshold across:
  - Statements
  - Branches
  - Functions
  - Lines
- Use MSW handlers for Supabase API mocking
- Use `renderWithProviders` from test-utils for context tests

### 5. Error Handling & Edge Cases

#### Error Scenarios

1. **User Cancellation**

   ```typescript
   if (result.type === 'cancel') {
     return; // Graceful exit, no error thrown
   }
   ```

2. **Missing Tokens**

   ```typescript
   if (!access_token || !refresh_token) {
     throw new Error('Authentication failed: missing tokens');
   }
   ```

3. **Network Failures**
   - Wrap all async operations in try-catch
   - Re-throw Supabase errors for Alert display
   - Provide user-friendly error messages

4. **Hidden Email**
   - Apple allows users to hide email with private relay
   - `user_metadata.email` may be `*@privaterelay.appleid.com`
   - Profile creation logic handles missing/relay emails
   - Document in setup guide's troubleshooting section

5. **Configuration Errors**
   - Document common setup issues in `APPLE_SIGNIN_SETUP.md`
   - Invalid client errors → check Services ID
   - Redirect mismatches → verify all URLs configured
   - Missing private key → ensure .p8 uploaded to Supabase

#### Platform-Specific Considerations

**iOS:**

- Ensure Sign in with Apple capability in `app.json` for production builds
- Test with both iOS Simulator and physical device
- Verify deep linking with `12stepstracker://` scheme

**Android:**

- Apple Sign In uses web view flow
- Ensure redirect URIs match exactly (case-sensitive)
- Test on physical device (better than emulator for OAuth)

**Web:**

- Modern browser support (Chrome, Safari, Firefox, Edge)
- OAuth popup/redirect handling
- Local development with `localhost` redirect URIs

#### Fallback Strategy

If Apple Sign In fails or is misconfigured:

- Users can use email/password authentication
- Users can use Google or Facebook OAuth
- Error messages guide users: "Please try another sign-in method"

#### Type Safety

- Update `AuthContextType` interface with `signInWithApple` method
- No additional types needed (reuses Supabase types)
- TypeScript strict mode enforced throughout

## Implementation Plan

### Phase 1: Documentation (Priority: High)

**Deliverable:** `APPLE_SIGNIN_SETUP.md`

1. Research Apple Developer Console flow
2. Document step-by-step setup process
3. Add screenshots/placeholders
4. Include code snippets for configuration
5. Write troubleshooting section
6. Review against `GOOGLE_OAUTH_SETUP.md` for completeness

**Enables:** User can begin Apple Developer + Supabase configuration

### Phase 2: Code Implementation (Priority: High)

**Test-Driven Development Approach**

1. **AppleLogo Component:**
   - Write tests first
   - Implement component
   - Verify tests pass

2. **AuthContext:**
   - Write tests for `signInWithApple` (web + native flows)
   - Implement method following Google pattern
   - Add to interface and context provider
   - Verify tests pass

3. **Login & Signup Screens:**
   - Write component tests for Apple button
   - Add state management and handlers
   - Implement Apple Sign In button UI
   - Add styles following Apple guidelines
   - Verify tests pass

**Enables:** Full Apple Sign In functionality (requires external configuration to test end-to-end)

### Phase 3: Documentation Updates (Priority: Medium)

1. Update `CLAUDE.md`:
   - Add Apple Sign In to authentication section
   - Reference `APPLE_SIGNIN_SETUP.md`
   - Update Tech Stack section

2. Update README (if needed):
   - Mention Apple Sign In in features list

**Enables:** Complete project documentation

### Phase 4: Verification (Priority: High)

1. Run test suite: `pnpm test`
2. Verify 80% coverage maintained
3. Run type checking: `pnpm typecheck`
4. Run linting: `pnpm lint`
5. Test builds: `pnpm build:web`
6. After configuration: Manual testing on iOS, Android, Web

## Dependencies

**External:**

- Apple Developer account (for Services ID, private key)
- Supabase project access (to configure provider)

**Code:**

- `expo-web-browser` ✓ (already installed)
- `expo-auth-session` ✓ (already installed)
- `react-native-svg` ✓ (already installed for other logos)

**No new dependencies required**

## Risks & Mitigations

| Risk                           | Impact                    | Mitigation                                          |
| ------------------------------ | ------------------------- | --------------------------------------------------- |
| Apple Developer account delays | Blocks E2E testing        | Implement with mocks first; test when ready         |
| Complex Apple setup process    | User frustration          | Comprehensive documentation with screenshots        |
| Hidden email edge cases        | Profile creation issues   | Handle relay emails in `createOAuthProfileIfNeeded` |
| Platform-specific bugs         | Poor UX on some platforms | Thorough testing on iOS, Android, Web               |
| App Store review requirements  | Rejection risk            | Follow Apple HIG exactly, test thoroughly           |

## Timeline Estimate

- **Documentation:** 2-3 hours
- **Implementation:** 3-4 hours (including tests)
- **Documentation Updates:** 30 minutes
- **Verification:** 1-2 hours
- **Total:** 6.5-9.5 hours of development time

External configuration time depends on Apple Developer account access.

## Success Metrics

- [ ] All tests pass with 80%+ coverage
- [ ] Type checking passes with no errors
- [ ] Linting passes with no errors
- [ ] Documentation complete and reviewed
- [ ] Manual testing successful on all platforms (after configuration)
- [ ] UI matches Apple's branding guidelines
- [ ] Error handling covers all edge cases
- [ ] Code review approved

## References

- [Apple Sign In Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
- [Supabase Apple Provider Documentation](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- Existing implementations: `GOOGLE_OAUTH_SETUP.md`, `FACEBOOK_SIGNIN_SETUP.md`
- GitHub Issue #21: https://github.com/BillChirico/12-Step-Tracker/issues/21
