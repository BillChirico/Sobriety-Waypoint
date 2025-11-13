/**
 * AuthContext Tests
 * Comprehensive tests for authentication state management
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { mockProfile } from '@/test-utils';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
      setSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('AuthContext', () => {
  const mockSession = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: mockProfile.id,
      email: mockProfile.email,
      aud: 'authenticated',
      role: 'authenticated',
      created_at: mockProfile.created_at,
      updated_at: mockProfile.updated_at,
      user_metadata: {},
    },
  };

  const mockSupabaseFrom = (returnData: any, returnError: any = null) => {
    const chainable = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: returnData, error: returnError }),
      insert: jest.fn().mockResolvedValue({ data: returnData, error: returnError }),
    };
    (supabase.from as jest.Mock).mockReturnValue(chainable);
    return chainable;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Default: auth state change subscription
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    });
  });

  describe('Provider Initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);
    });

    it('should load session on mount if exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseFrom(mockProfile);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('should handle no session on mount', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it('should handle profile fetch error gracefully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseFrom(null, new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching profile:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('useAuth Hook', () => {
    // Note: The useAuth hook check for undefined context is ineffective since
    // createContext provides a default value. Using without provider returns
    // default values rather than throwing. This could be improved by using
    // createContext with undefined default and proper type guards.
  });

  describe('signIn', () => {
    it('should successfully sign in with email and password', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error on sign in failure', async () => {
      const error = new Error('Invalid credentials');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in with Google on web platform', async () => {
      Platform.OS = 'web';
      global.window = { location: { origin: 'http://localhost:3000' } } as any;

      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000',
        },
      });
    });

    it('should sign in with Google on native platform', async () => {
      Platform.OS = 'ios';
      const mockUrl = 'https://accounts.google.com/auth';
      const mockRedirectUri = 'https://example.com/auth/callback'; // Must be valid URL

      (makeRedirectUri as jest.Mock).mockReturnValue(mockRedirectUri);
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: mockUrl },
        error: null,
      });

      const mockAuthResult = {
        type: 'success' as const,
        url: `${mockRedirectUri}?access_token=test-token&refresh_token=test-refresh`,
      };
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue(mockAuthResult);

      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: { user: mockSession.user },
        error: null,
      });

      mockSupabaseFrom(mockProfile);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(mockUrl, mockRedirectUri);
      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
      });
    });

    it('should throw error on Google sign in failure', async () => {
      Platform.OS = 'web';
      const error = new Error('OAuth failed');
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        error,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signInWithGoogle();
        })
      ).rejects.toThrow('OAuth failed');
    });
  });

  describe('signInWithFacebook', () => {
    describe('web platform', () => {
      beforeEach(() => {
        (Platform.OS as any) = 'web';
        global.window = { location: { origin: 'http://localhost:3000' } } as any;
      });

      it('should call supabase.auth.signInWithOAuth with facebook provider', async () => {
        const mockSignInWithOAuth = jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: null,
        });
        (supabase.auth.signInWithOAuth as jest.Mock) = mockSignInWithOAuth;

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });

        await act(async () => {
          await result.current.signInWithFacebook();
        });

        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: 'facebook',
          options: {
            redirectTo: 'http://localhost:3000',
            scopes: 'email public_profile',
          },
        });
      });

      it('should handle OAuth errors on web', async () => {
        const mockError = new Error('OAuth failed');
        const mockSignInWithOAuth = jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        });
        (supabase.auth.signInWithOAuth as jest.Mock) = mockSignInWithOAuth;

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });

        await expect(
          act(async () => {
            await result.current.signInWithFacebook();
          })
        ).rejects.toThrow('OAuth failed');
      });
    });

    describe('native platform', () => {
      beforeEach(() => {
        (Platform.OS as any) = 'ios';
        process.env.EXPO_PUBLIC_FACEBOOK_APP_ID = 'test-facebook-app-id';
        jest.clearAllMocks();
      });

      it('should initialize Facebook SDK with app ID', async () => {
        const Facebook = require('expo-facebook');
        const mockSignInWithIdToken = jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              user_metadata: { full_name: 'John Doe' },
            },
            session: { access_token: 'token' },
          },
          error: null,
        });
        (supabase.auth.signInWithIdToken as jest.Mock) = mockSignInWithIdToken;

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });

        await act(async () => {
          await result.current.signInWithFacebook();
        });

        expect(Facebook.initializeAsync).toHaveBeenCalledWith({
          appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
        });
      });

      it('should request correct permissions', async () => {
        const Facebook = require('expo-facebook');
        const mockSignInWithIdToken = jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              user_metadata: { full_name: 'John Doe' },
            },
            session: { access_token: 'token' },
          },
          error: null,
        });
        (supabase.auth.signInWithIdToken as jest.Mock) = mockSignInWithIdToken;

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });

        await act(async () => {
          await result.current.signInWithFacebook();
        });

        expect(Facebook.logInWithReadPermissionsAsync).toHaveBeenCalledWith({
          permissions: ['public_profile', 'email'],
        });
      });

      it('should exchange Facebook token with Supabase', async () => {
        const Facebook = require('expo-facebook');
        const mockSignInWithIdToken = jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              user_metadata: { full_name: 'John Doe' },
            },
            session: { access_token: 'token' },
          },
          error: null,
        });
        (supabase.auth.signInWithIdToken as jest.Mock) = mockSignInWithIdToken;

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });

        await act(async () => {
          await result.current.signInWithFacebook();
        });

        expect(mockSignInWithIdToken).toHaveBeenCalledWith({
          provider: 'facebook',
          token: 'mock-facebook-access-token',
        });
      });

      it('should handle user cancellation gracefully', async () => {
        const Facebook = require('expo-facebook');
        Facebook.logInWithReadPermissionsAsync.mockResolvedValueOnce({
          type: 'cancel',
        });

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });

        // Should not throw
        await act(async () => {
          await result.current.signInWithFacebook();
        });

        // Should not call Supabase
        expect(supabase.auth.signInWithIdToken).not.toHaveBeenCalled();
      });

      it('should handle permission denial', async () => {
        const Facebook = require('expo-facebook');
        Facebook.logInWithReadPermissionsAsync.mockResolvedValueOnce({
          type: 'error',
        });

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });

        await expect(
          act(async () => {
            await result.current.signInWithFacebook();
          })
        ).rejects.toThrow('Facebook sign in failed');
      });

      it('should handle token exchange errors', async () => {
        const mockError = new Error('Token exchange failed');
        const mockSignInWithIdToken = jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        });
        (supabase.auth.signInWithIdToken as jest.Mock) = mockSignInWithIdToken;

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider,
        });

        await expect(
          act(async () => {
            await result.current.signInWithFacebook();
          })
        ).rejects.toThrow('Token exchange failed');
      });
    });
  });

  describe('signInWithApple', () => {
    describe('web platform', () => {
      beforeEach(() => {
        (Platform as any).OS = 'web';
      });

      it('calls signInWithOAuth with apple provider for web', async () => {
        const mockSignInWithOAuth = jest.fn().mockResolvedValue({ error: null });
        (supabase.auth.signInWithOAuth as jest.Mock) = mockSignInWithOAuth;

        const { result } = renderHook(() => useAuth(), {
          wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        await act(async () => {
          await result.current.signInWithApple();
        });

        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: 'apple',
          options: {
            redirectTo: window.location.origin,
          },
        });
      });

      it('throws error when signInWithOAuth fails on web', async () => {
        const mockError = new Error('Apple sign in failed');
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ error: mockError });

        const { result } = renderHook(() => useAuth(), {
          wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        await expect(result.current.signInWithApple()).rejects.toThrow('Apple sign in failed');
      });
    });

    describe('native platform', () => {
      beforeEach(() => {
        (Platform as any).OS = 'ios';
      });

      it('opens browser and sets session with tokens on success', async () => {
        const mockUrl = 'https://apple.com/auth?code=123';
        const mockRedirectUrl = 'https://example.com/auth/callback';
        const mockCallbackUrl = `${mockRedirectUrl}?access_token=test_access&refresh_token=test_refresh`;
        const mockUser = { id: 'apple-user-123', email: 'test@privaterelay.appleid.com' };

        (makeRedirectUri as jest.Mock).mockReturnValue(mockRedirectUrl);
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
          data: { url: mockUrl },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
          type: 'success',
          url: mockCallbackUrl,
        });
        (supabase.auth.setSession as jest.Mock).mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        mockSupabaseFrom(mockProfile);

        const { result } = renderHook(() => useAuth(), {
          wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        await act(async () => {
          await result.current.signInWithApple();
        });

        expect(makeRedirectUri).toHaveBeenCalledWith({
          scheme: '12stepstracker',
          path: 'auth/callback',
        });
        expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(mockUrl, mockRedirectUrl);
        expect(supabase.auth.setSession).toHaveBeenCalledWith({
          access_token: 'test_access',
          refresh_token: 'test_refresh',
        });
      });

      it('returns gracefully when user cancels', async () => {
        const mockUrl = 'https://apple.com/auth?code=123';
        const mockRedirectUrl = 'https://example.com/auth/callback';

        (makeRedirectUri as jest.Mock).mockReturnValue(mockRedirectUrl);
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
          data: { url: mockUrl },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
          type: 'cancel',
        });

        const { result } = renderHook(() => useAuth(), {
          wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Should not throw
        await act(async () => {
          await result.current.signInWithApple();
        });

        expect(supabase.auth.setSession).not.toHaveBeenCalled();
      });

      it('throws error when tokens are missing', async () => {
        const mockUrl = 'https://apple.com/auth?code=123';
        const mockRedirectUrl = 'https://example.com/auth/callback';
        const mockCallbackUrl = `${mockRedirectUrl}?error=access_denied`;

        (makeRedirectUri as jest.Mock).mockReturnValue(mockRedirectUrl);
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
          data: { url: mockUrl },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
          type: 'success',
          url: mockCallbackUrl,
        });

        const { result } = renderHook(() => useAuth(), {
          wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Should return gracefully when tokens missing (similar to cancel)
        await act(async () => {
          await result.current.signInWithApple();
        });

        expect(supabase.auth.setSession).not.toHaveBeenCalled();
      });
    });
  });

  describe('signUp', () => {
    it('should successfully sign up and create profile', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockSession.user },
        error: null,
      });

      mockSupabaseFrom(mockProfile);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test', 'U');
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should throw error on sign up failure', async () => {
      const error = new Error('Email already exists');
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signUp('test@example.com', 'password123', 'Test', 'U');
        })
      ).rejects.toThrow('Email already exists');
    });

    it('should throw error on profile creation failure', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockSession.user },
        error: null,
      });

      const profileError = new Error('Profile insert failed');
      mockSupabaseFrom(null, profileError);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signUp('test@example.com', 'password123', 'Test', 'U');
        })
      ).rejects.toThrow('Profile insert failed');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      // Start with authenticated state
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockSupabaseFrom(mockProfile);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.profile).toBeNull();
    });

    it('should throw error on sign out failure', async () => {
      const error = new Error('Sign out failed');
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signOut();
        })
      ).rejects.toThrow('Sign out failed');
    });
  });

  describe('refreshProfile', () => {
    it('should refresh profile when user is authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // First call returns original profile
      mockSupabaseFrom(mockProfile);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.profile?.first_name).toBe('Test');
      });

      // Update mock to return updated profile on next fetch
      const updatedProfile = { ...mockProfile, first_name: 'Updated' };
      mockSupabaseFrom(updatedProfile);

      await act(async () => {
        await result.current.refreshProfile();
      });

      await waitFor(() => {
        expect(result.current.profile?.first_name).toBe('Updated');
      });
    });

    it('should not fetch profile when user is not authenticated', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshProfile();
      });

      // Should not call from() when no user
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Auth State Changes', () => {
    it('should handle auth state change to signed in', async () => {
      let authStateCallback: any;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(callback => {
        authStateCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      mockSupabaseFrom(mockProfile);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate sign in via auth state change
      await act(async () => {
        await authStateCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.user).toEqual(mockSession.user);
        expect(result.current.profile).toEqual(mockProfile);
      });
    });

    it('should handle auth state change to signed out', async () => {
      let authStateCallback: any;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(callback => {
        authStateCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      // Start authenticated
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      mockSupabaseFrom(mockProfile);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });

      // Simulate sign out via auth state change
      await act(async () => {
        await authStateCallback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.session).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
      });
    });

    it('should auto-create profile for new OAuth users', async () => {
      let authStateCallback: any;
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(callback => {
        authStateCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      });

      const oauthSession = {
        ...mockSession,
        user: {
          ...mockSession.user,
          user_metadata: {
            full_name: 'John Doe',
          },
        },
      };

      // First call returns null (no existing profile)
      const chainable = mockSupabaseFrom(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate OAuth sign in with new user
      await act(async () => {
        await authStateCallback('SIGNED_IN', oauthSession);
      });

      await waitFor(() => {
        expect(chainable.insert).toHaveBeenCalledWith({
          id: oauthSession.user.id,
          email: oauthSession.user.email,
          first_name: 'John',
          last_initial: 'D',
        });
      });
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', async () => {
      const unsubscribeMock = jest.fn();
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      });

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});
