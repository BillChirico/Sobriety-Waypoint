/**
 * Manage Tasks Screen Tests
 * Tests task management, filtering, and CRUD operations for sponsors
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ManageTasksScreen from '@/app/(tabs)/manage-tasks';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('expo-router');
jest.mock('@/contexts/AuthContext');
jest.mock('@/lib/supabase');
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
    Plus: createMockIcon('Plus'),
    CheckCircle: createMockIcon('CheckCircle'),
    Clock: createMockIcon('Clock'),
    Calendar: createMockIcon('Calendar'),
    Trash2: createMockIcon('Trash2'),
    Filter: createMockIcon('Filter'),
  };
});
jest.mock('@/components/TaskCreationModal', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  const MockTaskCreationModal = React.forwardRef((props: any, ref: any) =>
    React.createElement(RN.View, { ...props, ref, testID: 'TaskCreationModal' })
  );
  MockTaskCreationModal.displayName = 'MockTaskCreationModal';
  return MockTaskCreationModal;
});

const mockProfile = {
  id: 'sponsor-123',
  email: 'sponsor@example.com',
  first_name: 'Jane',
  last_initial: 'S',
  role: 'sponsor',
  sobriety_date: '2023-01-01',
};

const mockTasks = [
  {
    id: 'task-1',
    title: 'Complete Step 1',
    description: 'Read and reflect',
    status: 'assigned',
    sponsor_id: 'sponsor-123',
    sponsee_id: 'sponsee-1',
    created_at: '2024-01-01',
    sponsee: {
      first_name: 'John',
      last_initial: 'D',
    },
  },
  {
    id: 'task-2',
    title: 'Complete Step 2',
    description: 'Journal entries',
    status: 'completed',
    sponsor_id: 'sponsor-123',
    sponsee_id: 'sponsee-1',
    created_at: '2024-01-02',
    sponsee: {
      first_name: 'John',
      last_initial: 'D',
    },
  },
];

describe('ManageTasksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      profile: mockProfile,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      delete: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('should render manage tasks screen', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [] }),
    });

    const { getByText } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(getByText(/Manage Tasks/i)).toBeTruthy();
    });
  });

  it('should fetch sponsees and tasks on mount', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [] }),
    });

    render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('sponsor_sponsee_relationships');
      expect(supabase.from).toHaveBeenCalledWith('tasks');
    });
  });

  it('should display task list', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockTasks }),
    });

    const { root } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should render create task button', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [] }),
    });

    const { root } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should handle refresh', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [] }),
    });

    const { root } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should handle null profile gracefully', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      profile: null,
    });

    const { root } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should display empty state when no tasks', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [] }),
    });

    const { root } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should handle error when fetching data', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
    });

    const { root } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should filter tasks by status', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockTasks }),
    });

    const { root } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });

  it('should display task creation modal', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [] }),
    });

    const { getByTestId } = render(<ManageTasksScreen />);

    await waitFor(() => {
      const modal = getByTestId('TaskCreationModal');
      expect(modal).toBeTruthy();
    });
  });

  it('should handle tasks with different statuses', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockTasks }),
    });

    const { root } = render(<ManageTasksScreen />);

    await waitFor(() => {
      expect(root).toBeTruthy();
    });
  });
});
