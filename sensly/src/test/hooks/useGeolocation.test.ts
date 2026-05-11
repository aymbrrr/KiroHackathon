import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGeolocation } from '../../hooks/useGeolocation';

const mockGetForegroundPermissions = jest.fn();
const mockRequestForegroundPermissions = jest.fn();
const mockGetCurrentPosition = jest.fn();
const mockWatchPosition = jest.fn();

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: () => mockGetForegroundPermissions(),
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissions(),
  getCurrentPositionAsync: (opts: any) => mockGetCurrentPosition(opts),
  watchPositionAsync: (opts: any, cb: any) => mockWatchPosition(opts, cb),
  Accuracy: { Balanced: 3 },
}));

const fakeLocation = {
  coords: { latitude: 35.28, longitude: -120.66, accuracy: 10 },
};

const fakeSubscription = { remove: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  mockWatchPosition.mockResolvedValue(fakeSubscription);
  mockGetCurrentPosition.mockResolvedValue(fakeLocation);
});

describe('useGeolocation — initial state', () => {
  it('starts with correct defaults', async () => {
    mockGetForegroundPermissions.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useGeolocation());
    expect(result.current.position).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('on mount — permission already granted', () => {
  it('starts watch without prompting', async () => {
    mockGetForegroundPermissions.mockResolvedValue({ status: 'granted' });
    renderHook(() => useGeolocation());
    await waitFor(() => expect(mockWatchPosition).toHaveBeenCalled());
    expect(mockRequestForegroundPermissions).not.toHaveBeenCalled();
  });

  it('sets permissionGranted: true', async () => {
    mockGetForegroundPermissions.mockResolvedValue({ status: 'granted' });
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.permissionGranted).toBe(true));
  });
});

describe('on mount — permission denied', () => {
  it('sets permissionGranted: false, no watch', async () => {
    mockGetForegroundPermissions.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.permissionGranted).toBe(false));
    expect(mockWatchPosition).not.toHaveBeenCalled();
  });
});

describe('requestPermission', () => {
  it('denied: sets error, no watch', async () => {
    mockGetForegroundPermissions.mockResolvedValue({ status: 'denied' });
    mockRequestForegroundPermissions.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.requestPermission());
    expect(result.current.error).toBeTruthy();
    expect(mockWatchPosition).not.toHaveBeenCalled();
  });

  it('granted: calls getCurrentPositionAsync then watchPositionAsync', async () => {
    mockGetForegroundPermissions.mockResolvedValue({ status: 'denied' });
    mockRequestForegroundPermissions.mockResolvedValue({ status: 'granted' });
    const { result } = renderHook(() => useGeolocation());
    await act(() => result.current.requestPermission());
    expect(mockGetCurrentPosition).toHaveBeenCalled();
    expect(mockWatchPosition).toHaveBeenCalled();
  });
});

describe('cleanup', () => {
  it('removes watch subscription on unmount', async () => {
    mockGetForegroundPermissions.mockResolvedValue({ status: 'granted' });
    const { unmount } = renderHook(() => useGeolocation());
    await waitFor(() => expect(mockWatchPosition).toHaveBeenCalled());
    unmount();
    expect(fakeSubscription.remove).toHaveBeenCalled();
  });
});
