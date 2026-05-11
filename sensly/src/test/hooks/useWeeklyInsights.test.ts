import { renderHook, waitFor } from '@testing-library/react-native';
import { useWeeklyInsights } from '../../hooks/useWeeklyInsights';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockInvoke = jest.fn();
const mockScheduleNotification = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (t: string) => mockFrom(t),
    functions: { invoke: (fn: string, opts: any) => mockInvoke(fn, opts) },
  },
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (opts: any) => mockScheduleNotification(opts),
}));

// Suppress AppState subscription in tests by mocking just AppState
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  currentState: 'active',
}));

beforeEach(() => jest.clearAllMocks());

describe('useWeeklyInsights', () => {
  it('does nothing when no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    renderHook(() => useWeeklyInsights());
    await waitFor(() => expect(mockGetUser).toHaveBeenCalled());
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('does not generate when insights already exist for this week', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: { id: 'i1' }, error: null }) }) }) }),
    });
    renderHook(() => useWeeklyInsights());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('calls generate-insights when no insights exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null, error: { code: 'PGRST116' } }) }) }) }),
    });
    mockInvoke.mockResolvedValue({ data: { insights: [{ text: 'You tend to be calmer on Sundays.' }] }, error: null });
    renderHook(() => useWeeklyInsights());
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('generate-insights', expect.any(Object)));
  });

  it('schedules notification on successful generation', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null, error: {} }) }) }) }),
    });
    mockInvoke.mockResolvedValue({ data: { insights: [{ text: 'Pattern found.' }] }, error: null });
    renderHook(() => useWeeklyInsights());
    await waitFor(() => expect(mockScheduleNotification).toHaveBeenCalled());
    const call = mockScheduleNotification.mock.calls[0][0];
    expect(call.content.title).toBeTruthy();
    expect(call.trigger).toBeNull(); // immediate
  });

  it('does not schedule notification when generation fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null, error: {} }) }) }) }),
    });
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'edge fn error' } });
    renderHook(() => useWeeklyInsights());
    await waitFor(() => expect(mockInvoke).toHaveBeenCalled());
    expect(mockScheduleNotification).not.toHaveBeenCalled();
  });

  it('does not schedule notification when insights array is empty', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null, error: {} }) }) }) }),
    });
    mockInvoke.mockResolvedValue({ data: { insights: [] }, error: null });
    renderHook(() => useWeeklyInsights());
    await waitFor(() => expect(mockInvoke).toHaveBeenCalled());
    expect(mockScheduleNotification).not.toHaveBeenCalled();
  });

  it('uses fallback body text when insights[0].text is undefined', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null, error: {} }) }) }) }),
    });
    mockInvoke.mockResolvedValue({ data: { insights: [{}] }, error: null });
    renderHook(() => useWeeklyInsights());
    await waitFor(() => expect(mockScheduleNotification).toHaveBeenCalled());
    const call = mockScheduleNotification.mock.calls[0][0];
    expect(call.content.body).toBeTruthy(); // fallback text
  });
});
