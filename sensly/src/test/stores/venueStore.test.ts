import { act, renderHook } from '@testing-library/react-native';
import { useVenueStore } from '../../stores/venueStore';

const mockFrom = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: { from: (t: string) => mockFrom(t) },
}));

jest.mock('../../lib/sensoryUtils', () => ({
  scoreToPinStyle: jest.fn(),
  weightedOverallScore: jest.fn(),
}));

const fakeVenue = {
  id: 'v1', osm_id: null, name: 'Test Cafe', category: 'cafe',
  lat: 35.28, lng: -120.66, address: null,
  avg_noise_db: 60, avg_lighting: 3, avg_crowding: 2, avg_smell: null, avg_predictability: null,
  overall_score: 2.8, total_ratings: 5, quiet_hours: null, sensory_features: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useVenueStore.setState({ nearbyVenues: [], venueCache: {}, isLoading: false, error: null });
});

describe('fetchNearbyFromDB', () => {
  it('populates nearbyVenues and venueCache on success', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ gte: () => ({ lte: () => ({ gte: () => ({ lte: () => ({ order: () => ({ limit: () => ({ data: [fakeVenue], error: null }) }) }) }) }) }) }),
    });
    const { result } = renderHook(() => useVenueStore());
    await act(() => result.current.fetchNearbyFromDB(35.28, -120.66));
    expect(result.current.nearbyVenues).toHaveLength(1);
    expect(result.current.venueCache['v1']).toEqual(fakeVenue);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ gte: () => ({ lte: () => ({ gte: () => ({ lte: () => ({ order: () => ({ limit: () => ({ data: null, error: { message: 'DB error' } }) }) }) }) }) }) }),
    });
    const { result } = renderHook(() => useVenueStore());
    await act(() => result.current.fetchNearbyFromDB(35.28, -120.66));
    expect(result.current.error).toBe('DB error');
    expect(result.current.isLoading).toBe(false);
  });
});

describe('getVenueById', () => {
  it('returns cached venue without Supabase call', async () => {
    useVenueStore.setState({ venueCache: { v1: fakeVenue } });
    const { result } = renderHook(() => useVenueStore());
    const venue = await act(() => result.current.getVenueById('v1'));
    expect(venue).toEqual(fakeVenue);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('fetches from Supabase on cache miss and caches result', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => ({ data: fakeVenue, error: null }) }) }),
    });
    const { result } = renderHook(() => useVenueStore());
    const venue = await act(() => result.current.getVenueById('v1'));
    expect(venue).toEqual(fakeVenue);
    expect(result.current.venueCache['v1']).toEqual(fakeVenue);
  });

  it('returns null when not found', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: { message: 'not found' } }) }) }),
    });
    const { result } = renderHook(() => useVenueStore());
    const venue = await act(() => result.current.getVenueById('missing'));
    expect(venue).toBeNull();
  });
});

describe('submitRating', () => {
  it('busts venue cache on success', async () => {
    mockFrom.mockReturnValue({ insert: () => ({ error: null }) });
    useVenueStore.setState({ venueCache: { v1: fakeVenue } });
    const { result } = renderHook(() => useVenueStore());
    await act(() => result.current.submitRating({
      venue_id: 'v1', user_id: 'u1', noise_db: 60, lighting: 3,
      crowding: 2, smell: null, predictability: null, notes: null,
      time_of_day: '14:00', day_of_week: 1,
    }));
    expect(result.current.venueCache['v1']).toBeUndefined();
  });

  it('returns error message on failure', async () => {
    mockFrom.mockReturnValue({ insert: () => ({ error: { message: 'insert failed' } }) });
    const { result } = renderHook(() => useVenueStore());
    const res = await act(() => result.current.submitRating({
      venue_id: 'v1', user_id: 'u1', noise_db: 60, lighting: 3,
      crowding: 2, smell: null, predictability: null, notes: null,
      time_of_day: '14:00', day_of_week: 1,
    }));
    expect(res.error).toBe('insert failed');
  });

  it('submitRating for venue not in cache does not crash', async () => {
    mockFrom.mockReturnValue({ insert: () => ({ error: null }) });
    const { result } = renderHook(() => useVenueStore());
    await expect(act(() => result.current.submitRating({
      venue_id: 'not-cached', user_id: 'u1', noise_db: 60, lighting: 3,
      crowding: 2, smell: null, predictability: null, notes: null,
      time_of_day: '14:00', day_of_week: 1,
    }))).resolves.not.toThrow();
  });
});

describe('clearError', () => {
  it('resets error', () => {
    useVenueStore.setState({ error: 'some error' });
    const { result } = renderHook(() => useVenueStore());
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
