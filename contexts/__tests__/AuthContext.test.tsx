import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { setSentryUser, clearSentryUser, setSentryContext } from '@/lib/sentry';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole } from '@/types/database';

jest.mock('@/lib/sentry');
jest.mock('@/lib/supabase');

const mockProfile: Profile = {
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_initial: 'U',
  role: 'sponsor' as UserRole,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  sobriety_date: null,
  notification_preferences: {},
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  user: mockUser,
  expires_at: Date.now() + 3600000,
  expires_in: 3600,
  token_type: 'bearer',
};

describe('AuthContext - Sentry Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase auth methods
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    });
  });

  it('should set Sentry user context on sign in', async () => {
    let authCallback: ((event: string, session: any) => void) | null = null;

    // Mock auth state change subscription to capture callback
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(callback => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });

    // Mock successful sign in
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: mockSession, user: mockUser },
      error: null,
    });

    // Mock profile fetch
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger sign in
    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
      // Simulate auth state change
      if (authCallback) {
        await authCallback('SIGNED_IN', mockSession);
      }
    });

    // Wait for auth state to update
    await waitFor(() => {
      expect(setSentryUser).toHaveBeenCalledWith(mockProfile.id, mockProfile.role);
      expect(setSentryContext).toHaveBeenCalledWith('profile', {
        role: mockProfile.role,
      });
    });
  });

  it('should clear Sentry user context on sign out', async () => {
    // Mock successful sign out
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger sign out
    await act(async () => {
      await result.current.signOut();
    });

    // Verify Sentry user was cleared
    expect(clearSentryUser).toHaveBeenCalled();
  });

  it('should update Sentry context when profile changes', async () => {
    // Mock initial session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock profile fetch
    const profileFetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ...mockProfile, role: 'both' as UserRole },
        error: null,
      });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: profileFetchMock,
        }),
      }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).toEqual(mockProfile);
    });

    // Verify initial Sentry context was set
    expect(setSentryUser).toHaveBeenCalledWith(mockProfile.id, mockProfile.role);
    expect(setSentryContext).toHaveBeenCalledWith('profile', {
      role: mockProfile.role,
    });

    // Refresh profile
    await act(async () => {
      await result.current.refreshProfile();
    });

    // Wait for profile update
    await waitFor(() => {
      expect(result.current.profile?.role).toBe('both');
    });

    // Verify Sentry context was updated
    expect(setSentryUser).toHaveBeenCalledWith(mockProfile.id, 'both');
    expect(setSentryContext).toHaveBeenCalledWith('profile', {
      role: 'both',
    });
  });
});
