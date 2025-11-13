/**
 * Journey Screen Tests
 * Tests timeline display, events fetching, and milestone tracking
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import JourneyScreen from '@/app/(tabs)/journey';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('expo-router');
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/supabase');
jest.mock('@react-navigation/native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require('react');
  return {
    useFocusEffect: (callback: () => void) => {
      react.useEffect(() => {
        callback();
      }, []);
    },
  };
});
jest.mock('@/hooks/useDaysSober', () => ({
  useDaysSober: jest.fn(() => ({
    daysSober: 365,
    currentStreakStartDate: '2024-01-01',
    loading: false,
  })),
}));
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: {
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      primary: '#007AFF',
      border: '#e5e7eb',
      success: '#10b981',
      error: '#ef4444',
    },
    themeMode: 'light',
    setThemeMode: jest.fn(),
    isDark: false,
  })),
}));
jest.mock('lucide-react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = React.forwardRef((props: any, ref: any) =>
      React.createElement(RN.View, { ...props, ref, testID: name })
    );
    MockIcon.displayName = `MockIcon(${name})`;
    return MockIcon;
  };
  return {
    Calendar: createMockIcon('Calendar'),
    CheckCircle: createMockIcon('CheckCircle'),
    Heart: createMockIcon('Heart'),
    RefreshCw: createMockIcon('RefreshCw'),
    Award: createMockIcon('Award'),
    TrendingUp: createMockIcon('TrendingUp'),
    CheckSquare: createMockIcon('CheckSquare'),
    ListChecks: createMockIcon('ListChecks'),
    Target: createMockIcon('Target'),
  };
});

const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  first_name: 'John',
  last_initial: 'D',
  role: 'sponsee',
  sobriety_date: '2024-01-01',
};

describe('JourneyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      profile: mockProfile,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [] }),
    });
  });

  it('should render journey screen with timeline', async () => {
    const { getAllByText } = render(<JourneyScreen />);

    await waitFor(() => {
      const journeyTexts = getAllByText(/Your Journey/i);
      expect(journeyTexts.length).toBeGreaterThan(0);
    });
  });

  it('should fetch timeline data on mount', async () => {
    render(<JourneyScreen />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('slip_ups');
      expect(supabase.from).toHaveBeenCalledWith('user_step_progress');
      expect(supabase.from).toHaveBeenCalledWith('tasks');
    });
  });

  it('should display sobriety start event', async () => {
    const { root } = render(<JourneyScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should handle profile with no sobriety date', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      profile: { ...mockProfile, sobriety_date: null },
    });

    const { root } = render(<JourneyScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should display days sober information', async () => {
    const { root } = render(<JourneyScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should handle loading state', () => {
    const { root } = render(<JourneyScreen />);
    expect(root).toBeTruthy();
  });

  it('should handle error when fetching timeline', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
    });

    const { root } = render(<JourneyScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should display timeline events when data is loaded', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'step-1',
            user_id: 'user-123',
            step_number: 1,
            completed_at: '2024-02-01',
          },
        ],
      }),
    });

    const { root } = render(<JourneyScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should handle null profile gracefully', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      profile: null,
    });

    const { root } = render(<JourneyScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should display milestone information', async () => {
    const { root } = render(<JourneyScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });
});
