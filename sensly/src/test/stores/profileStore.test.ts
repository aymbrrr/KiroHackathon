import { act, renderHook } from '@testing-library/react-native';
import { useProfileStore, selectEffectiveNoiseThreshold } from '../../stores/profileStore';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => mockFrom(table),
  },
}));

const fakeProfile = {
  id: 'p1',
  user_id: 'u1',
  display_name: 'Test',
  noise_threshold: 55,
  lighting_preference: 'dim' as const,
  crowding_threshold: 2,
  triggers: [],
  trigger_categories: [],
  comfort_items: [],
  diagnosis_tags: ['autism'],
  diagnosis_consent: true,
  is_default: true,
  created_at: '2024-01-01',
};

beforeEach(() => {
  jest.clearAllMocks();
  useProfileStore.setState({ profile: null, isLoading: false, error: null, dailyThresholdOverride: null });
});

describe('selectEffectiveNoiseThreshold', () => {
  it('returns 65 when no profile and no override', () => {
    const state = useProfileStore.getState();
    expect(selectEffectiveNoiseThreshold(state)).toBe(65);
  });

  it('returns profile.noise_threshold when no override', () => {
    useProfileStore.setState({ profile: fakeProfile });
    expect(selectEffectiveNoiseThreshold(useProfileStore.getState())).toBe(55);
  });

  it('returns override when set, ignoring profile', () => {
    useProfileStore.setState({ profile: fakeProfile, dailyThresholdOverride: 70 });
    expect(selectEffectiveNoiseThreshold(useProfileStore.getState())).toBe(70);
  });

  it('override of 0 is respected (not treated as falsy)', () => {
    useProfileStore.setState({ profile: fakeProfile, dailyThresholdOverride: 0 });
    // 0 ?? profile.noise_threshold → 0 (nullish coalescing, not ||)
    expect(selectEffectiveNoiseThreshold(useProfileStore.getState())).toBe(0);
  });
});

describe('setDailyOverride', () => {
  it('sets override', () => {
    const { result } = renderHook(() => useProfileStore());
    act(() => result.current.setDailyOverride(60));
    expect(result.current.dailyThresholdOverride).toBe(60);
  });

  it('clears override with null', () => {
    useProfileStore.setState({ dailyThresholdOverride: 60 });
    const { result } = renderHook(() => useProfileStore());
    act(() => result.current.setDailyOverride(null));
    expect(result.current.dailyThresholdOverride).toBeNull();
  });
});

describe('fetchProfile', () => {
  it('sets profile on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: fakeProfile, error: null }) }) }) }),
    });
    const { result } = renderHook(() => useProfileStore());
    await act(() => result.current.fetchProfile());
    expect(result.current.profile).toEqual(fakeProfile);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns early when no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useProfileStore());
    await act(() => result.current.fetchProfile());
    expect(result.current.profile).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('creates default profile on PGRST116', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const insertMock = jest.fn().mockReturnValue({
      select: () => ({ single: () => ({ data: fakeProfile, error: null }) }),
    });
    mockFrom
      .mockReturnValueOnce({
        select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null, error: { code: 'PGRST116' } }) }) }) }),
      })
      .mockReturnValueOnce({ insert: insertMock });

    const { result } = renderHook(() => useProfileStore());
    await act(() => result.current.fetchProfile());
    expect(insertMock).toHaveBeenCalled();
    expect(result.current.profile).toEqual(fakeProfile);
  });

  it('sets error on other Supabase error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: null, error: { code: '500', message: 'DB error' } }) }) }) }),
    });
    const { result } = renderHook(() => useProfileStore());
    await act(() => result.current.fetchProfile());
    expect(result.current.error).toBe('DB error');
  });
});

describe('clear', () => {
  it('resets all state', () => {
    useProfileStore.setState({ profile: fakeProfile, dailyThresholdOverride: 60, error: 'err' });
    const { result } = renderHook(() => useProfileStore());
    act(() => result.current.clear());
    expect(result.current.profile).toBeNull();
    expect(result.current.dailyThresholdOverride).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
