/**
 * Signup Screen Tests
 * Tests account creation flow, validation, and error handling
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import SignupScreen from '@/app/signup';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

// Mock react-native to ensure components are available
jest.mock('react-native', () => {
  const RN = jest.requireActual('../../__mocks__/react-native.js');
  return RN;
});

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: {
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      primary: '#007AFF',
      border: '#e5e7eb',
    },
    themeMode: 'light',
    setThemeMode: jest.fn(),
    isDark: false,
  })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  const Heart = React.forwardRef((props: any, ref: any) =>
    React.createElement(RN.View, { ...props, ref, testID: 'Heart' })
  );
  Heart.displayName = 'Heart';
  const ArrowLeft = React.forwardRef((props: any, ref: any) =>
    React.createElement(RN.View, { ...props, ref, testID: 'ArrowLeft' })
  );
  ArrowLeft.displayName = 'ArrowLeft';
  return { Heart, ArrowLeft };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  const SvgDefault = React.forwardRef((props: any, ref: any) =>
    React.createElement(RN.View, { ...props, ref })
  );
  SvgDefault.displayName = 'SvgDefault';
  const Svg = React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement(RN.View, { ...props, ref }, children)
  );
  Svg.displayName = 'Svg';
  const Path = React.forwardRef((props: any, ref: any) =>
    React.createElement(RN.View, { ...props, ref })
  );
  Path.displayName = 'Path';
  return {
    __esModule: true,
    default: SvgDefault,
    Svg,
    Path,
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('SignupScreen', () => {
  const mockSignUp = jest.fn().mockResolvedValue(undefined);
  const mockSignInWithGoogle = jest.fn().mockResolvedValue(undefined);
  const mockBack = jest.fn();
  const mockReplace = jest.fn();

  // Mock window for web tests
  beforeAll(() => {
    if (typeof global.window === 'undefined') {
      (global as any).window = {};
    }
    global.window.alert = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
      signInWithGoogle: mockSignInWithGoogle,
      signInWithFacebook: jest.fn().mockResolvedValue(undefined),
      signInWithApple: jest.fn().mockResolvedValue(undefined),
    });

    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      replace: mockReplace,
    });

    mockSignUp.mockResolvedValue(undefined);
    mockSignInWithGoogle.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render signup form with all elements', () => {
      const { getAllByText, getByText, getByPlaceholderText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      expect(getAllByText('Create Account')).toHaveLength(2); // Title and button
      expect(getByText('Begin your recovery journey')).toBeTruthy();
      expect(getByPlaceholderText('John')).toBeTruthy();
      expect(getByPlaceholderText('D')).toBeTruthy();
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(getAllByPlaceholderText('••••••••')).toHaveLength(2); // Two password fields
      expect(getByText('Continue with Google')).toBeTruthy();
      expect(getByText(/Already have an account/)).toBeTruthy();
    });

    it('should render back button', () => {
      const { getByTestId } = render(<SignupScreen />);
      expect(getByTestId('ArrowLeft')).toBeTruthy();
    });

    it('should have proper input labels', () => {
      const { getByText } = render(<SignupScreen />);

      expect(getByText('First Name')).toBeTruthy();
      expect(getByText('Last Initial')).toBeTruthy();
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
      expect(getByText('Confirm Password')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should show alert when all fields are empty (native)', async () => {
      Platform.OS = 'ios';

      const { getAllByText } = render(<SignupScreen />);
      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should show window alert when all fields are empty (web)', async () => {
      Platform.OS = 'web';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      const { getAllByText } = render(<SignupScreen />);
      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields');
      });

      expect(mockSignUp).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should show alert when last initial is missing', async () => {
      Platform.OS = 'ios';

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
      });
    });

    it('should show alert when last initial is more than 1 character', async () => {
      Platform.OS = 'ios';

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'DO');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');
      fireEvent.changeText(passwordFields[1], 'password123');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Last initial must be a single letter');
      });
    });

    it('should show alert when passwords do not match', async () => {
      Platform.OS = 'ios';

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');
      fireEvent.changeText(passwordFields[1], 'different');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should show alert when password is too short', async () => {
      Platform.OS = 'ios';

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], '12345');
      fireEvent.changeText(passwordFields[1], '12345');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 6 characters');
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('should convert last initial to uppercase', () => {
      const { getByPlaceholderText } = render(<SignupScreen />);

      const lastInitialInput = getByPlaceholderText('D');
      fireEvent.changeText(lastInitialInput, 'd');

      expect(lastInitialInput.props.value).toBe('D');
    });
  });

  describe('Account Creation', () => {
    it('should successfully create account with valid inputs', async () => {
      Platform.OS = 'ios';

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');
      fireEvent.changeText(passwordFields[1], 'password123');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'John', 'D');
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Account created successfully!',
          expect.any(Array)
        );
      });
    });

    it('should show loading state during signup', async () => {
      let resolveSignUp: () => void;
      const signUpPromise = new Promise<void>(resolve => {
        resolveSignUp = resolve;
      });
      mockSignUp.mockReturnValue(signUpPromise);

      const { getByPlaceholderText, getByText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');
      fireEvent.changeText(passwordFields[1], 'password123');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(getByText('Creating account...')).toBeTruthy();
      });

      resolveSignUp!();

      await waitFor(() => {
        expect(getByText('Create Account')).toBeTruthy();
      });
    });

    it('should show error alert on signup failure (native)', async () => {
      Platform.OS = 'ios';
      mockSignUp.mockRejectedValue(new Error('Email already in use'));

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'existing@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');
      fireEvent.changeText(passwordFields[1], 'password123');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Email already in use');
      });
    });

    it('should show window alert on signup failure (web)', async () => {
      Platform.OS = 'web';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      mockSignUp.mockRejectedValue(new Error('Email already in use'));

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'existing@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');
      fireEvent.changeText(passwordFields[1], 'password123');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error: Email already in use');
      });

      alertSpy.mockRestore();
    });

    it('should navigate to onboarding after successful signup (native)', async () => {
      Platform.OS = 'ios';

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');
      fireEvent.changeText(passwordFields[1], 'password123');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          'Account created successfully!',
          expect.arrayContaining([expect.objectContaining({ text: 'OK' })])
        );
      });

      // Simulate pressing OK on the alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const okButton = alertCall[2][0];
      okButton.onPress();

      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });

    it('should navigate to onboarding after successful signup (web)', async () => {
      Platform.OS = 'web';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      const { getByPlaceholderText, getAllByText, getAllByPlaceholderText } = render(
        <SignupScreen />
      );

      fireEvent.changeText(getByPlaceholderText('John'), 'John');
      fireEvent.changeText(getByPlaceholderText('D'), 'D');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');

      const passwordFields = getAllByPlaceholderText('••••••••');
      fireEvent.changeText(passwordFields[0], 'password123');
      fireEvent.changeText(passwordFields[1], 'password123');

      const createAccountButtons = getAllByText('Create Account');
      fireEvent.press(createAccountButtons[1]); // Press button, not title

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Account created successfully!');
        expect(mockReplace).toHaveBeenCalledWith('/onboarding');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Google Sign In', () => {
    it('should call signInWithGoogle when button is pressed', async () => {
      const { getByText } = render(<SignupScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should show loading state during Google sign in', async () => {
      let resolveGoogleSignIn: () => void;
      const googleSignInPromise = new Promise<void>(resolve => {
        resolveGoogleSignIn = resolve;
      });
      mockSignInWithGoogle.mockReturnValue(googleSignInPromise);

      const { getByText } = render(<SignupScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(getByText('Signing in with Google...')).toBeTruthy();
      });

      resolveGoogleSignIn!();

      await waitFor(() => {
        expect(getByText('Continue with Google')).toBeTruthy();
      });
    });

    it('should show error alert on Google sign in failure (native)', async () => {
      Platform.OS = 'ios';
      mockSignInWithGoogle.mockRejectedValue(new Error('Google auth failed'));

      const { getByText } = render(<SignupScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google auth failed');
      });
    });

    it('should show window alert on Google sign in failure (web)', async () => {
      Platform.OS = 'web';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      mockSignInWithGoogle.mockRejectedValue(new Error('Google auth failed'));

      const { getByText } = render(<SignupScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error: Google auth failed');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Apple Sign In', () => {
    it('renders Apple Sign In button', () => {
      const { getByText } = render(<SignupScreen />);
      expect(getByText('Continue with Apple')).toBeTruthy();
    });

    it('calls signInWithApple when button is pressed', async () => {
      const mockSignInWithApple = jest.fn().mockResolvedValue(undefined);
      (useAuth as jest.Mock).mockReturnValue({
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithFacebook: jest.fn(),
        signInWithApple: mockSignInWithApple,
      });

      const { getByText } = render(<SignupScreen />);
      const appleButton = getByText('Continue with Apple');

      fireEvent.press(appleButton);

      await waitFor(() => {
        expect(mockSignInWithApple).toHaveBeenCalled();
      });
    });

    it('shows loading state during Apple sign in', async () => {
      const mockSignInWithApple = jest.fn(() => new Promise(() => {})); // Never resolves
      (useAuth as jest.Mock).mockReturnValue({
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithFacebook: jest.fn(),
        signInWithApple: mockSignInWithApple,
      });

      const { getByText, queryByText } = render(<SignupScreen />);
      const appleButton = getByText('Continue with Apple');

      fireEvent.press(appleButton);

      await waitFor(() => {
        expect(getByText('Signing in with Apple...')).toBeTruthy();
        expect(queryByText('Continue with Apple')).toBeNull();
      });
    });

    it('shows error alert when Apple sign in fails', async () => {
      Platform.OS = 'ios';
      const mockSignInWithApple = jest.fn().mockRejectedValue(new Error('Apple auth failed'));
      (useAuth as jest.Mock).mockReturnValue({
        signUp: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithFacebook: jest.fn(),
        signInWithApple: mockSignInWithApple,
      });

      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByText } = render(<SignupScreen />);
      const appleButton = getByText('Continue with Apple');

      fireEvent.press(appleButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Apple auth failed');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByTestId } = render(<SignupScreen />);

      const backButton = getByTestId('ArrowLeft').parent;
      if (backButton) {
        fireEvent.press(backButton);
      }

      expect(mockBack).toHaveBeenCalled();
    });

    it('should navigate back when sign in link is pressed', () => {
      const { getByText } = render(<SignupScreen />);

      fireEvent.press(getByText(/Already have an account/));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Input Properties', () => {
    it('should have correct properties for first name input', () => {
      const { getByPlaceholderText } = render(<SignupScreen />);

      const firstNameInput = getByPlaceholderText('John');
      expect(firstNameInput.props.editable).toBe(true);
    });

    it('should have correct properties for last initial input', () => {
      const { getByPlaceholderText } = render(<SignupScreen />);

      const lastInitialInput = getByPlaceholderText('D');
      expect(lastInitialInput.props.maxLength).toBe(1);
      expect(lastInitialInput.props.autoCapitalize).toBe('characters');
      expect(lastInitialInput.props.editable).toBe(true);
    });

    it('should have correct properties for email input', () => {
      const { getByPlaceholderText } = render(<SignupScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.editable).toBe(true);
    });

    it('should have correct properties for password inputs', () => {
      const { getAllByPlaceholderText } = render(<SignupScreen />);

      const passwordInputs = getAllByPlaceholderText('••••••••');
      expect(passwordInputs).toHaveLength(2);

      passwordInputs.forEach(input => {
        expect(input.props.secureTextEntry).toBe(true);
        expect(input.props.editable).toBe(true);
      });
    });
  });
});
