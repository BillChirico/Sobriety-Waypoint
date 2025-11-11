/**
 * Custom render function for testing React components
 * Automatically wraps components with necessary providers (Theme, Auth)
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import type { RenderResult } from '@testing-library/react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import type { Profile } from '@/types/database';

// Import AuthContext dynamically to avoid dependency issues
let AuthContext: any;
let AuthContextType: any;

try {
  const authModule = require('@/contexts/AuthContext');
  AuthContext = authModule.AuthContext;
  AuthContextType = authModule.AuthContextType;
} catch (e) {
  // AuthContext not available in test environment
}

/**
 * Options for customizing the test render environment
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial theme mode */
  themeMode?: 'light' | 'dark' | 'system';
  /** Mock authentication state */
  authState?: Partial<any>;
  /** Include AuthContext wrapper (default: false to avoid dependency issues) */
  withAuth?: boolean;
}

/**
 * Default mock profile for authenticated state
 */
export const mockProfile: Profile = {
  id: 'test-user-123',
  email: 'test@example.com',
  first_name: 'Test',
  last_initial: 'U',
  role: 'both',
  sobriety_date: '2024-01-01',
  timezone: 'America/New_York',
  notification_preferences: {
    tasks: true,
    messages: true,
    milestones: true,
    daily: false,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Default mock auth context for authenticated users
 */
export const mockAuthContext: any = {
  session: {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
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
    },
  },
  user: {
    id: mockProfile.id,
    email: mockProfile.email,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: mockProfile.created_at,
    updated_at: mockProfile.updated_at,
  },
  profile: mockProfile,
  loading: false,
  signIn: jest.fn().mockResolvedValue({ error: null }),
  signUp: jest.fn().mockResolvedValue({ error: null }),
  signOut: jest.fn().mockResolvedValue(undefined),
  signInWithGoogle: jest.fn().mockResolvedValue({ error: null }),
};

/**
 * Mock auth context for unauthenticated users
 */
export const mockUnauthenticatedContext: any = {
  session: null,
  user: null,
  profile: null,
  loading: false,
  signIn: jest.fn().mockResolvedValue({ error: null }),
  signUp: jest.fn().mockResolvedValue({ error: null }),
  signOut: jest.fn().mockResolvedValue(undefined),
  signInWithGoogle: jest.fn().mockResolvedValue({ error: null }),
};

/**
 * Create a wrapper component with necessary providers
 */
function createWrapper(options: CustomRenderOptions = {}) {
  const { themeMode = 'light', authState, withAuth = false } = options;

  return function Wrapper({ children }: { children: React.ReactNode }) {
    let content = children;

    // Wrap with AuthContext if requested and available
    if (withAuth && AuthContext) {
      const authValue = authState ? { ...mockAuthContext, ...authState } : mockAuthContext;

      content = <AuthContext.Provider value={authValue}>{content}</AuthContext.Provider>;
    }

    // Always wrap with ThemeProvider
    return <ThemeProvider initialTheme={themeMode}>{content}</ThemeProvider>;
  };
}

/**
 * Custom render function that wraps components with providers
 *
 * @example
 * ```tsx
 * // Render with theme only (default)
 * const { getByText } = renderWithProviders(<MyComponent />);
 *
 * // Render with auth context
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   withAuth: true,
 * });
 *
 * // Render as unauthenticated user
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   withAuth: true,
 *   authState: mockUnauthenticatedContext,
 * });
 *
 * // Render with dark theme
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   themeMode: 'dark',
 * });
 *
 * // Render with custom auth state
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   withAuth: true,
 *   authState: {
 *     profile: { ...mockProfile, role: 'sponsor' },
 *   },
 * });
 * ```
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { themeMode, authState, withAuth, ...renderOptions } = options;

  const Wrapper = createWrapper({ themeMode, authState, withAuth });

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Native Testing Library
export * from '@testing-library/react-native';

// Export our custom render as the default render
export { renderWithProviders as render };
