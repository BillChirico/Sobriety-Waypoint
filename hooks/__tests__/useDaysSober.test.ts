import { renderHook, waitFor } from '@testing-library/react-native';
import { useDaysSober } from '../useDaysSober';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    profile: {
      id: 'test-user-id',
      sobriety_date: '2024-01-01',
    },
  }),
}));

describe('useDaysSober', () => {
  it('should return the correct structure', () => {
    const { result } = renderHook(() => useDaysSober());

    expect(result.current).toHaveProperty('daysSober');
    expect(result.current).toHaveProperty('journeyStartDate');
    expect(result.current).toHaveProperty('currentStreakStartDate');
    expect(result.current).toHaveProperty('hasSlipUps');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
  });
});

describe('useDaysSober - slip-up fetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch the most recent slip-up for the user', async () => {
    const mockSlipUp = {
      id: 'slip-up-1',
      user_id: 'test-user-id',
      slip_up_date: '2024-06-15',
      recovery_restart_date: '2024-06-16',
      notes: 'Test slip-up',
      created_at: '2024-06-15T10:00:00Z',
    };

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({ data: [mockSlipUp], error: null });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      order: mockOrder,
    });
    mockOrder.mockReturnValue({
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDaysSober());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(supabase.from).toHaveBeenCalledWith('slip_ups');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'test-user-id');
    expect(mockOrder).toHaveBeenCalledWith('slip_up_date', { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(result.current.hasSlipUps).toBe(true);
  });

  it('should handle no slip-ups', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      order: mockOrder,
    });
    mockOrder.mockReturnValue({
      limit: mockLimit,
    });

    const { result } = renderHook(() => useDaysSober());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasSlipUps).toBe(false);
  });
});
