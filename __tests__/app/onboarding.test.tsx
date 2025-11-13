import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import OnboardingScreen from '@/app/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

// Mock dependencies
jest.mock('expo-router');
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/supabase');
jest.mock('@react-native-community/datetimepicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');

  const DateTimePicker = (props: any) =>
    React.createElement(View, { ...props, testID: 'DateTimePicker' });
  DateTimePicker.displayName = 'DateTimePicker';

  return {
    __esModule: true,
    default: DateTimePicker,
  };
});

const mockReplace = jest.fn();
const mockRefreshProfile = jest.fn();

describe('OnboardingScreen', () => {
  beforeAll(() => {
    if (typeof global.window === 'undefined') {
      (global as any).window = {};
    }
    global.window.alert = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';

    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      profile: null,
      refreshProfile: mockRefreshProfile,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    jest.spyOn(Alert, 'alert').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Step 1: Name Entry (when needed)', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'User', last_initial: null, role: null },
        refreshProfile: mockRefreshProfile,
      });
    });

    it('should render name entry step when profile needs name', () => {
      const { getByText, getByPlaceholderText } = render(<OnboardingScreen />);

      expect(getByText('Welcome to 12-Step Tracker')).toBeTruthy();
      expect(getByText("Let's get to know you")).toBeTruthy();
      expect(getByText("What's your name?")).toBeTruthy();
      expect(getByPlaceholderText('John')).toBeTruthy();
      expect(getByPlaceholderText('D')).toBeTruthy();
      expect(getByText('Continue')).toBeTruthy();
    });

    it('should update first name on input', () => {
      const { getByPlaceholderText } = render(<OnboardingScreen />);

      const firstNameInput = getByPlaceholderText('John');
      fireEvent.changeText(firstNameInput, 'Jane');

      expect(firstNameInput.props.value).toBe('Jane');
    });

    it('should convert last initial to uppercase automatically', () => {
      const { getByPlaceholderText } = render(<OnboardingScreen />);

      const lastInitialInput = getByPlaceholderText('D');
      fireEvent.changeText(lastInitialInput, 'd');

      expect(lastInitialInput.props.value).toBe('D');
    });

    // Note: Tests for disabled button states are omitted because fireEvent.press() bypasses
    // the disabled prop in RNTL. These scenarios will be covered by E2E tests with Maestro.

    it('should navigate to step 2 when continue is pressed with valid name', () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<OnboardingScreen />);

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.press(getByText('Continue'));

      // Step 2 should now be visible
      expect(queryByText('Your Sobriety Date')).toBeTruthy();
      expect(queryByText("What's your name?")).toBeFalsy();
    });

    it('should have correct input properties', () => {
      const { getByPlaceholderText } = render(<OnboardingScreen />);

      const firstNameInput = getByPlaceholderText('John');
      expect(firstNameInput.props.autoCapitalize).toBe('words');

      const lastInitialInput = getByPlaceholderText('D');
      expect(lastInitialInput.props.maxLength).toBe(1);
      expect(lastInitialInput.props.autoCapitalize).toBe('characters');
    });
  });

  describe('Step 2: Sobriety Date', () => {
    it('should render sobriety date step when profile has name', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      const { getByText } = render(<OnboardingScreen />);

      expect(getByText('Your Sobriety Date')).toBeTruthy();
      expect(getByText('When did you begin your sobriety journey?')).toBeTruthy();
      expect(getByText('Complete Setup')).toBeTruthy();
    });

    it('should display current date initially', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      const { getByText } = render(<OnboardingScreen />);

      const today = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      expect(getByText(today)).toBeTruthy();
    });

    it('should display days sober calculation', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      const { getByText } = render(<OnboardingScreen />);

      expect(getByText('0')).toBeTruthy(); // 0 days sober for today
      expect(getByText('Days Sober')).toBeTruthy();
    });

    it('should show back button when user needs name', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'User', last_initial: null, role: null },
        refreshProfile: mockRefreshProfile,
      });

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Navigate to step 2
      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.press(getByText('Continue'));

      expect(getByText('Back')).toBeTruthy();
    });

    it('should navigate back to step 1 when back button is pressed', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'User', last_initial: null, role: null },
        refreshProfile: mockRefreshProfile,
      });

      const { getByPlaceholderText, getByText, queryByText } = render(<OnboardingScreen />);

      // Navigate to step 2
      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.press(getByText('Continue'));

      // Go back
      fireEvent.press(getByText('Back'));

      expect(queryByText("What's your name?")).toBeTruthy();
      expect(queryByText('Your Sobriety Date')).toBeFalsy();
    });

    it('should not show back button when user already has name', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      const { queryByText } = render(<OnboardingScreen />);

      expect(queryByText('Back')).toBeFalsy();
    });
  });

  describe('Complete Setup', () => {
    it('should complete setup with name and sobriety date (new user)', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'User', last_initial: null, role: null },
        refreshProfile: mockRefreshProfile,
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Fill in name
      fireEvent.changeText(getByPlaceholderText('John'), 'Jane');
      fireEvent.changeText(getByPlaceholderText('D'), 'S');
      fireEvent.press(getByText('Continue'));

      // Complete setup
      fireEvent.press(getByText('Complete Setup'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'both',
            first_name: 'Jane',
            last_initial: 'S',
            sobriety_date: expect.any(String),
          })
        );
      });

      await waitFor(() => {
        expect(mockRefreshProfile).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('should complete setup with only sobriety date (existing user with name)', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const { getByText } = render(<OnboardingScreen />);

      fireEvent.press(getByText('Complete Setup'));

      await waitFor(() => {
        const updateCall = mockUpdate.mock.calls[0][0];
        expect(updateCall).toEqual(
          expect.objectContaining({
            role: 'both',
            sobriety_date: expect.any(String),
          })
        );
        // Should NOT include first_name or last_initial
        expect(updateCall.first_name).toBeUndefined();
        expect(updateCall.last_initial).toBeUndefined();
      });
    });

    it('should show loading state during setup', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      let resolveUpdate: () => void;
      const updatePromise = new Promise<void>(resolve => {
        resolveUpdate = resolve;
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(updatePromise),
        }),
      });

      const { getByText } = render(<OnboardingScreen />);

      fireEvent.press(getByText('Complete Setup'));

      await waitFor(() => {
        expect(getByText('Setting up...')).toBeTruthy();
      });

      resolveUpdate!();

      await waitFor(() => {
        expect(getByText('Complete Setup')).toBeTruthy();
      });
    });

    it('should show error alert on setup failure (native)', async () => {
      Platform.OS = 'ios';

      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
        }),
      });

      const { getByText } = render(<OnboardingScreen />);

      fireEvent.press(getByText('Complete Setup'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Database error');
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should show window alert on setup failure (web)', async () => {
      Platform.OS = 'web';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
        }),
      });

      const { getByText } = render(<OnboardingScreen />);

      fireEvent.press(getByText('Complete Setup'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error: Database error');
      });

      expect(mockReplace).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should disable buttons during loading', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'User', last_initial: null, role: null },
        refreshProfile: mockRefreshProfile,
      });

      let resolveUpdate: () => void;
      const updatePromise = new Promise<void>(resolve => {
        resolveUpdate = resolve;
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(updatePromise),
        }),
      });

      const { getByPlaceholderText, getByText } = render(<OnboardingScreen />);

      // Fill in name and go to step 2
      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.press(getByText('Continue'));

      // Start setup
      fireEvent.press(getByText('Complete Setup'));

      await waitFor(() => {
        expect(getByText('Setting up...')).toBeTruthy();
      });

      // Note: Cannot verify buttons are disabled during loading with fireEvent.press()
      // because it bypasses the disabled prop. This will be covered by E2E tests.

      resolveUpdate!();
    });

    it('should handle missing user gracefully', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      const mockUpdate = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const { getByText } = render(<OnboardingScreen />);

      fireEvent.press(getByText('Complete Setup'));

      // Should not attempt to update without user
      await waitFor(() => {
        expect(mockUpdate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Date Picker', () => {
    it('should show date picker when date button is pressed', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        profile: { first_name: 'John', last_initial: 'D', role: null },
        refreshProfile: mockRefreshProfile,
      });

      const { getByText, UNSAFE_getByType } = render(<OnboardingScreen />);

      const today = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      fireEvent.press(getByText(today));

      // DateTimePicker should be rendered (on iOS, it's always visible when showDatePicker is true)
      expect(UNSAFE_getByType(DateTimePicker)).toBeTruthy();
    });
  });
});
