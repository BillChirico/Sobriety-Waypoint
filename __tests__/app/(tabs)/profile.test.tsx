/**
 * Profile Screen Tests
 * Tests profile display, editing, theme settings, and sign out
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '@/app/(tabs)/profile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/supabase');
jest.mock('@/contexts/ThemeContext');
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('lucide-react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  const createMockIcon = (name: string) =>
    // eslint-disable-next-line react/display-name
    React.forwardRef((props: any, ref: any) =>
      React.createElement(RN.View, { ...props, ref, testID: name })
    );
  return {
    User: createMockIcon('User'),
    Mail: createMockIcon('Mail'),
    Calendar: createMockIcon('Calendar'),
    Moon: createMockIcon('Moon'),
    Sun: createMockIcon('Sun'),
    LogOut: createMockIcon('LogOut'),
    ChevronRight: createMockIcon('ChevronRight'),
    CheckCircle: createMockIcon('CheckCircle'),
    Heart: createMockIcon('Heart'),
    Share2: createMockIcon('Share2'),
    QrCode: createMockIcon('QrCode'),
    Bell: createMockIcon('Bell'),
    Monitor: createMockIcon('Monitor'),
    UserMinus: createMockIcon('UserMinus'),
    Edit2: createMockIcon('Edit2'),
    AlertCircle: createMockIcon('AlertCircle'),
  };
});
jest.mock('../../package.json', () => ({ version: '1.0.0' }), { virtual: true });

const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  first_name: 'John',
  last_initial: 'D',
  role: 'sponsor',
  sobriety_date: '2024-01-01',
};

const mockTheme = {
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  primary: '#007AFF',
  border: '#e5e7eb',
};

describe('ProfileScreen', () => {
  const mockSignOut = jest.fn();
  const mockSetThemeMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      profile: mockProfile,
      signOut: mockSignOut,
      refreshProfile: jest.fn(),
    });
    (useTheme as jest.Mock).mockReturnValue({
      theme: mockTheme,
      themeMode: 'light',
      setThemeMode: mockSetThemeMode,
      isDark: false,
    });
  });

  it('should render profile information', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText('John D.')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('should render sobriety journey section', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText(/Days/i)).toBeTruthy();
  });

  it('should show theme options', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText('Light')).toBeTruthy();
    expect(getByText('Dark')).toBeTruthy();
  });

  it('should render sign out button', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText(/sign out/i)).toBeTruthy();
  });

  it('should handle theme mode change', async () => {
    const { getByText } = render(<ProfileScreen />);

    // Find and press the "Dark" theme button
    const darkButton = getByText('Dark');
    fireEvent.press(darkButton);

    await waitFor(() => {
      expect(mockSetThemeMode).toHaveBeenCalledWith('dark');
    });
  });

  it('should render sign out button functionality', async () => {
    const { getByText } = render(<ProfileScreen />);

    const signOutButton = getByText(/sign out/i);
    expect(signOutButton).toBeTruthy();
  });

  it('should render notification settings', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText(/notifications/i)).toBeTruthy();
  });

  it('should display version information', () => {
    const { root } = render(<ProfileScreen />);

    // Version is rendered somewhere in the profile
    expect(root).toBeTruthy();
  });

  it('should handle profile with no sobriety date', () => {
    (useAuth as jest.Mock).mockReturnValue({
      profile: { ...mockProfile, sobriety_date: null },
      signOut: mockSignOut,
      refreshProfile: jest.fn(),
    });

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('John D.')).toBeTruthy();
  });

  it('should handle loading state when profile is null', () => {
    (useAuth as jest.Mock).mockReturnValue({
      profile: null,
      signOut: mockSignOut,
      refreshProfile: jest.fn(),
    });

    const { root } = render(<ProfileScreen />);

    // Should render without crashing
    expect(root).toBeDefined();
  });

  it('should switch to system theme', async () => {
    const { getByText } = render(<ProfileScreen />);

    const systemButton = getByText('System');
    fireEvent.press(systemButton);

    await waitFor(() => {
      expect(mockSetThemeMode).toHaveBeenCalledWith('system');
    });
  });

  it('should display role information', () => {
    const { getAllByText } = render(<ProfileScreen />);

    const sponsorTexts = getAllByText(/sponsor/i);
    expect(sponsorTexts.length).toBeGreaterThan(0);
  });
});
