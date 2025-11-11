/**
 * ThemeContext Tests
 * Tests theme mode switching, persistence, and system color scheme integration
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text , useColorScheme } from 'react-native';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock useColorScheme
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  useColorScheme: jest.fn(),
}));

// Helper component to test theme values
function ThemeConsumer({ testID = 'theme-consumer' }: { testID?: string }) {
  const { theme, themeMode, isDark } = useTheme();

  return (
    <Text testID={testID}>
      {JSON.stringify({
        background: theme.background,
        text: theme.text,
        themeMode,
        isDark,
      })}
    </Text>
  );
}

// Helper component to test setThemeMode
function ThemeSwitcher() {
  const { setThemeMode } = useTheme();

  React.useEffect(() => {
    setThemeMode('dark');
  }, [setThemeMode]);

  return <Text>Switcher</Text>;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useColorScheme as jest.Mock).mockReturnValue('light');
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe('ThemeProvider', () => {
    it('should provide default light theme when system is light', async () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);

        expect(data.background).toBe('#f9fafb'); // light theme background
        expect(data.text).toBe('#111827'); // light theme text
        expect(data.themeMode).toBe('system');
        expect(data.isDark).toBe(false);
      });
    });

    it('should provide dark theme when system is dark', async () => {
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);

        expect(data.background).toBe('#111827'); // dark theme background
        expect(data.text).toBe('#f9fafb'); // dark theme text
        expect(data.themeMode).toBe('system');
        expect(data.isDark).toBe(true);
      });
    });

    it('should load saved theme preference from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
      (useColorScheme as jest.Mock).mockReturnValue('light'); // System is light

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);

        expect(data.background).toBe('#111827'); // dark theme background
        expect(data.themeMode).toBe('dark');
        expect(data.isDark).toBe(true);
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('theme_mode');
    });

    it('should handle setThemeMode and persist to AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumer testID="consumer-1" />
          <ThemeSwitcher />
        </ThemeProvider>
      );

      await waitFor(() => {
        const consumerText = getByTestId('consumer-1');
        const data = JSON.parse(consumerText.props.children);

        expect(data.themeMode).toBe('dark');
        expect(data.isDark).toBe(true);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_mode', 'dark');
    });

    it('should switch between light and dark themes', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      function ThemeToggler() {
        const { setThemeMode, themeMode } = useTheme();

        return (
          <>
            <Text testID="mode">{themeMode}</Text>
            <Text
              testID="toggle-button"
              onPress={() => {
                const newMode = themeMode === 'light' ? 'dark' : 'light';
                setThemeMode(newMode);
              }}
            >
              Toggle
            </Text>
          </>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeToggler />
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('mode').props.children).toBe('system');
      });

      // Switch to light
      await act(async () => {
        getByTestId('toggle-button').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('mode').props.children).toBe('light');
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);
        expect(data.background).toBe('#f9fafb'); // light background
        expect(data.isDark).toBe(false);
      });

      // Switch to dark
      await act(async () => {
        getByTestId('toggle-button').props.onPress();
      });

      await waitFor(() => {
        expect(getByTestId('mode').props.children).toBe('dark');
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);
        expect(data.background).toBe('#111827'); // dark background
        expect(data.isDark).toBe(true);
      });
    });

    it('should handle system mode with different system color schemes', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('system');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // Start with light system
      (useColorScheme as jest.Mock).mockReturnValue('light');

      const { getByTestId, rerender } = render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);
        expect(data.background).toBe('#f9fafb'); // light
        expect(data.isDark).toBe(false);
      });

      // Change system to dark
      (useColorScheme as jest.Mock).mockReturnValue('dark');

      rerender(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);
        expect(data.background).toBe('#111827'); // dark
        expect(data.isDark).toBe(true);
      });
    });

    it('should handle AsyncStorage errors when loading theme', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);

        // Should still provide default theme
        expect(data.themeMode).toBe('system');
        expect(data.background).toBe('#f9fafb'); // light (system default)
      });

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to load theme preference:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should handle AsyncStorage errors when saving theme', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      function ThemeSetterWithError() {
        const { setThemeMode } = useTheme();

        React.useEffect(() => {
          setThemeMode('dark');
        }, [setThemeMode]);

        return <Text>Setter</Text>;
      }

      render(
        <ThemeProvider>
          <ThemeSetterWithError />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to save theme preference:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should only accept valid theme modes from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-mode');

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        const consumerText = getByTestId('theme-consumer');
        const data = JSON.parse(consumerText.props.children);

        // Should use default 'system' mode for invalid saved value
        expect(data.themeMode).toBe('system');
      });
    });
  });

  describe('useTheme hook', () => {
    it('should provide default theme values when used outside explicit provider', async () => {
      // Note: ThemeContext provides default values, so it won't throw an error
      // This is intentional behavior to allow the hook to work even without explicit provider
      function ComponentOutsideProvider() {
        const { theme, themeMode, isDark } = useTheme();
        return (
          <Text testID="outside-values">
            {JSON.stringify({ themeMode, isDark, background: theme.background })}
          </Text>
        );
      }

      const { getByTestId } = render(<ComponentOutsideProvider />);

      const valuesText = getByTestId('outside-values');
      const data = JSON.parse(valuesText.props.children);

      // Should provide default context values
      expect(data.themeMode).toBe('system');
      expect(data.isDark).toBe(false);
      expect(data.background).toBe('#f9fafb'); // light theme default
    });

    it('should provide all theme context values', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      function ThemeValueChecker() {
        const themeContext = useTheme();

        return (
          <Text testID="values">
            {JSON.stringify({
              hasTheme: !!themeContext.theme,
              hasThemeMode: !!themeContext.themeMode,
              hasSetThemeMode: typeof themeContext.setThemeMode === 'function',
              hasIsDark: typeof themeContext.isDark === 'boolean',
            })}
          </Text>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <ThemeValueChecker />
        </ThemeProvider>
      );

      await waitFor(() => {
        const valuesText = getByTestId('values');
        const data = JSON.parse(valuesText.props.children);

        expect(data.hasTheme).toBe(true);
        expect(data.hasThemeMode).toBe(true);
        expect(data.hasSetThemeMode).toBe(true);
        expect(data.hasIsDark).toBe(true);
      });
    });
  });

  describe('Theme colors', () => {
    it('should provide correct light theme colors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('light');

      function ColorChecker() {
        const { theme } = useTheme();

        return (
          <Text testID="colors">
            {JSON.stringify({
              background: theme.background,
              surface: theme.surface,
              text: theme.text,
              textSecondary: theme.textSecondary,
              primary: theme.primary,
              border: theme.border,
            })}
          </Text>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <ColorChecker />
        </ThemeProvider>
      );

      await waitFor(() => {
        const colorsText = getByTestId('colors');
        const colors = JSON.parse(colorsText.props.children);

        expect(colors.background).toBe('#f9fafb');
        expect(colors.surface).toBe('#ffffff');
        expect(colors.text).toBe('#111827');
        expect(colors.textSecondary).toBe('#6b7280');
        expect(colors.primary).toBe('#007AFF');
        expect(colors.border).toBe('#e5e7eb');
      });
    });

    it('should provide correct dark theme colors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');

      function ColorChecker() {
        const { theme } = useTheme();

        return (
          <Text testID="colors">
            {JSON.stringify({
              background: theme.background,
              surface: theme.surface,
              text: theme.text,
              textSecondary: theme.textSecondary,
              primary: theme.primary,
              border: theme.border,
            })}
          </Text>
        );
      }

      const { getByTestId } = render(
        <ThemeProvider>
          <ColorChecker />
        </ThemeProvider>
      );

      await waitFor(() => {
        const colorsText = getByTestId('colors');
        const colors = JSON.parse(colorsText.props.children);

        expect(colors.background).toBe('#111827');
        expect(colors.surface).toBe('#1f2937');
        expect(colors.text).toBe('#f9fafb');
        expect(colors.textSecondary).toBe('#9ca3af');
        expect(colors.primary).toBe('#007AFF');
        expect(colors.border).toBe('#374151');
      });
    });
  });
});
