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
const mockUseAuth = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

/**
 * Integration Tests for useDaysSober Hook
 *
 * These tests verify end-to-end scenarios combining multiple features:
 * - Slip-up fetching + days calculation
 * - Different user profiles + calculation
 * - Error handling + fallback behavior
 */
describe('useDaysSober - integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      profile: {
        id: 'test-user-id',
        sobriety_date: '2024-01-01',
      },
    });
  });

  it('should calculate days correctly when user has slip-ups', async () => {
    // Scenario: User with original sobriety date + recent slip-up
    const mockSlipUp = {
      id: 'slip-up-1',
      user_id: 'test-user-id',
      slip_up_date: '2024-06-15',
      recovery_restart_date: '2024-06-16',
      notes: 'Had a slip-up',
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify it uses recovery_restart_date for current streak
    expect(result.current.currentStreakStartDate).toBe('2024-06-16');
    // Verify it preserves journey start date
    expect(result.current.journeyStartDate).toBe('2024-01-01');
    // Verify hasSlipUps flag is set
    expect(result.current.hasSlipUps).toBe(true);
    // Verify no errors
    expect(result.current.error).toBe(null);
    // Days should be calculated from recovery_restart_date, not sobriety_date
    expect(result.current.daysSober).toBeGreaterThanOrEqual(0);
  });

  it('should fetch and use different user profile when userId provided', async () => {
    const sponseeId = 'sponsee-user-id';

    const mockSlipUp = {
      id: 'slip-up-2',
      user_id: sponseeId,
      slip_up_date: '2024-07-01',
      recovery_restart_date: '2024-07-02',
      notes: 'Sponsee slip-up',
      created_at: '2024-07-01T10:00:00Z',
    };

    const mockProfile = {
      id: sponseeId,
      sobriety_date: '2024-01-01',
      first_name: 'John',
      last_initial: 'D',
    };

    const mockFrom = jest.fn((table: string) => {
      const mockSelect = jest.fn().mockReturnThis();

      if (table === 'profiles') {
        const mockEq = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: mockProfile, error: null });

        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ single: mockSingle });
      } else if (table === 'slip_ups') {
        const mockEq = jest.fn().mockReturnThis();
        const mockOrder = jest.fn().mockReturnThis();
        const mockLimit = jest.fn().mockResolvedValue({ data: [mockSlipUp], error: null });

        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ order: mockOrder });
        mockOrder.mockReturnValue({ limit: mockLimit });
      }

      return { select: mockSelect };
    });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const { result } = renderHook(() => useDaysSober(sponseeId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify it fetched the different user's profile
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    // Verify it uses that user's data
    expect(result.current.journeyStartDate).toBe('2024-01-01');
    expect(result.current.currentStreakStartDate).toBe('2024-07-02');
    expect(result.current.hasSlipUps).toBe(true);
  });

  it('should handle complete user journey without slip-ups', async () => {
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

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // When no slip-ups, journey start and current streak should be the same
    expect(result.current.journeyStartDate).toBe('2024-01-01');
    expect(result.current.currentStreakStartDate).toBe('2024-01-01');
    expect(result.current.hasSlipUps).toBe(false);
    expect(result.current.daysSober).toBeGreaterThanOrEqual(0);
  });

  it('should handle database errors gracefully', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockReturnThis();
    const mockLimit = jest
      .fn()
      .mockResolvedValue({ data: null, error: new Error('Database error') });

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

    // Should set error but still fall back to sobriety_date calculation
    expect(result.current.error).toBeTruthy();
    expect(result.current.hasSlipUps).toBe(false);
    // Falls back to calculating from sobriety_date
    expect(result.current.daysSober).toBeGreaterThanOrEqual(0);
    expect(result.current.journeyStartDate).toBe('2024-01-01');
  });
});
