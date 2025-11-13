import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useDaysSober } from '../useDaysSober';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Set default mock return value
beforeAll(() => {
  mockUseAuth.mockReturnValue({
    user: { id: 'test-user-id' },
    profile: {
      id: 'test-user-id',
      sobriety_date: '2024-01-01',
    },
  });
});

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

  it('should handle fetch errors gracefully', async () => {
    const mockError = new Error('Database connection failed');

    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });

    const { result } = renderHook(() => useDaysSober());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.hasSlipUps).toBe(false);
  });
});

describe('useDaysSober - calculation logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date to 2024-07-01
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-07-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate days from sobriety_date when no slip-ups exist', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });

    const { result } = renderHook(() => useDaysSober());

    // Run all pending promises
    await jest.runAllTimersAsync();

    // sobriety_date is 2024-01-01, current date is 2024-07-01
    // Difference: 182 days
    expect(result.current.daysSober).toBe(182);
    expect(result.current.journeyStartDate).toBe('2024-01-01');
    expect(result.current.currentStreakStartDate).toBe('2024-01-01');
    expect(result.current.hasSlipUps).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should calculate days from recovery_restart_date when slip-ups exist', async () => {
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
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });

    const { result } = renderHook(() => useDaysSober());

    // Run all pending promises
    await jest.runAllTimersAsync();

    // recovery_restart_date is 2024-06-16, current date is 2024-07-01
    // Difference: 15 days
    expect(result.current.daysSober).toBe(15);
    expect(result.current.journeyStartDate).toBe('2024-01-01');
    expect(result.current.currentStreakStartDate).toBe('2024-06-16');
    expect(result.current.hasSlipUps).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should return 0 days when sobriety_date is null', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });

    // Override the useAuth mock for this test - must be done before renderHook
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      profile: {
        id: 'test-user-id',
        sobriety_date: null,
      },
    });

    const { result } = renderHook(() => useDaysSober());

    // Run all pending promises
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(result.current.daysSober).toBe(0);
    expect(result.current.journeyStartDate).toBe(null);
    expect(result.current.currentStreakStartDate).toBe(null);
    expect(result.current.loading).toBe(false);

    // Reset mock to default value
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      profile: {
        id: 'test-user-id',
        sobriety_date: '2024-01-01',
      },
    });
  });

  it('should return 0 days when date is in the future', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });

    // Override the useAuth mock for this test - must be done before renderHook
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      profile: {
        id: 'test-user-id',
        sobriety_date: '2024-08-01', // Future date
      },
    });

    const { result } = renderHook(() => useDaysSober());

    // Run all pending promises
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(result.current.daysSober).toBe(0);
    expect(result.current.loading).toBe(false);

    // Reset mock to default value
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      profile: {
        id: 'test-user-id',
        sobriety_date: '2024-01-01',
      },
    });
  });
});
