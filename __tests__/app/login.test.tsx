/**
 * Login Screen Tests
 * Tests authentication flow, validation, and error handling
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@/test-utils';
import { Alert, Platform } from 'react-native';
import LoginScreen from '@/app/login';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

// Mock react-native to ensure useColorScheme is available
jest.mock('react-native', () => {
  const RN = jest.requireActual('../../__mocks__/react-native.js');
  return RN;
});

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
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
  return { Heart };
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

describe('LoginScreen', () => {
  const mockSignIn = jest.fn();
  const mockSignInWithGoogle = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockSignIn.mockResolvedValue(undefined);
    mockSignInWithGoogle.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      expect(getByText('12-Step Tracker')).toBeTruthy();
      expect(getByText('Your journey to recovery')).toBeTruthy();
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
      expect(getByText('Continue with Google')).toBeTruthy();
      expect(getByText('Create New Account')).toBeTruthy();
    });

    it('should render email and password labels', () => {
      const { getAllByText } = render(<LoginScreen />);

      const emailLabels = getAllByText('Email');
      const passwordLabels = getAllByText('Password');

      expect(emailLabels.length).toBeGreaterThan(0);
      expect(passwordLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Email/Password Sign In', () => {
    it('should allow entering email and password', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      expect(emailInput.props.value).toBe('test@example.com');
      expect(passwordInput.props.value).toBe('password123');
    });

    it('should call signIn with correct credentials when sign in button is pressed', async () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show loading state during sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(getByText('Signing in...')).toBeTruthy();
      });

      await waitFor(
        () => {
          expect(getByText('Sign In')).toBeTruthy();
        },
        { timeout: 200 }
      );
    });

    it('should disable buttons during sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        const signInButton = getByText('Signing in...').parent;
        const googleButton = getByText('Continue with Google').parent;
        const createAccountButton = getByText('Create New Account').parent;

        expect(signInButton?.props.accessibilityState?.disabled).toBe(true);
        expect(googleButton?.props.accessibilityState?.disabled).toBe(true);
        expect(createAccountButton?.props.accessibilityState?.disabled).toBe(true);
      });

      await waitFor(
        () => {
          const signInButton = getByText('Sign In').parent;
          expect(signInButton?.props.accessibilityState?.disabled).toBeFalsy();
        },
        { timeout: 200 }
      );
    });
  });

  describe('Validation', () => {
    it('should show alert when email is empty on native', async () => {
      Platform.OS = 'ios';

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should show alert when password is empty on native', async () => {
      Platform.OS = 'android';

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should show window alert when fields are empty on web', async () => {
      Platform.OS = 'web';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields');
      });

      expect(mockSignIn).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should show alert on sign in error (native)', async () => {
      Platform.OS = 'ios';
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid credentials');
      });
    });

    it('should show window alert on sign in error (web)', async () => {
      Platform.OS = 'web';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error: Invalid credentials');
      });

      alertSpy.mockRestore();
    });

    it('should show generic error message when error has no message', async () => {
      Platform.OS = 'ios';
      mockSignIn.mockRejectedValue({});

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to sign in');
      });
    });

    it('should reset loading state after error', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(getByText('Signing in...')).toBeTruthy();
      });

      await waitFor(() => {
        expect(getByText('Sign In')).toBeTruthy();
      });
    });
  });

  describe('Google Sign In', () => {
    it('should call signInWithGoogle when button is pressed', async () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should show loading state during Google sign in', async () => {
      mockSignInWithGoogle.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(getByText('Signing in with Google...')).toBeTruthy();
      });

      await waitFor(
        () => {
          expect(getByText('Continue with Google')).toBeTruthy();
        },
        { timeout: 200 }
      );
    });

    it('should disable buttons during Google sign in', async () => {
      mockSignInWithGoogle.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        const signInButton = getByText('Sign In').parent;
        const googleButton = getByText('Signing in with Google...').parent;
        const createAccountButton = getByText('Create New Account').parent;

        expect(signInButton?.props.accessibilityState?.disabled).toBe(true);
        expect(googleButton?.props.accessibilityState?.disabled).toBe(true);
        expect(createAccountButton?.props.accessibilityState?.disabled).toBe(true);
      });
    });

    it('should show alert on Google sign in error (native)', async () => {
      Platform.OS = 'ios';
      mockSignInWithGoogle.mockRejectedValue(new Error('Google auth failed'));

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Google auth failed');
      });
    });

    it('should show window alert on Google sign in error (web)', async () => {
      Platform.OS = 'web';
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      mockSignInWithGoogle.mockRejectedValue(new Error('Google auth failed'));

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error: Google auth failed');
      });

      alertSpy.mockRestore();
    });

    it('should show generic error message for Google sign in when error has no message', async () => {
      Platform.OS = 'ios';
      mockSignInWithGoogle.mockRejectedValue({});

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Continue with Google'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to sign in with Google');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to signup when create account button is pressed', () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Create New Account'));

      expect(mockPush).toHaveBeenCalledWith('/signup');
    });

    it('should not allow navigation during sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(getByText('Signing in...')).toBeTruthy();
      });

      fireEvent.press(getByText('Create New Account'));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Input Properties', () => {
    it('should have correct input properties for email', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');

      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.keyboardType).toBe('email-address');
    });

    it('should have secureTextEntry for password', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const passwordInput = getByPlaceholderText('••••••••');

      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should disable inputs during sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('your@email.com');
      const passwordInput = getByPlaceholderText('••••••••');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(emailInput.props.editable).toBe(false);
        expect(passwordInput.props.editable).toBe(false);
      });

      await waitFor(
        () => {
          expect(emailInput.props.editable).toBe(true);
          expect(passwordInput.props.editable).toBe(true);
        },
        { timeout: 200 }
      );
    });
  });
});
