import React from 'react';
import { Text, View } from 'react-native';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils/render';
import { ErrorBoundary } from '../ErrorBoundary';
import * as Sentry from '@sentry/react-native';

jest.mock('@sentry/react-native');

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for expected errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should render children when no error', () => {
    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <View>
          <Text>Child content</Text>
        </View>
      </ErrorBoundary>
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  it('should capture error and show fallback UI', () => {
    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.any(Object)
    );

    expect(getByText(/something went wrong/i)).toBeTruthy();
  });

  it('should allow retry after error', () => {
    let shouldThrow = true;

    const MaybeThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return (
        <View>
          <Text>Recovered</Text>
        </View>
      );
    };

    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(getByText(/something went wrong/i)).toBeTruthy();

    shouldThrow = false;
    const retryButton = screen.getByText(/try again/i);
    fireEvent.press(retryButton);

    expect(getByText('Recovered')).toBeTruthy();
  });
});
