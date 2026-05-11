import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useMotionSensor } from '../../hooks/useMotionSensor';

const mockIsAvailable = jest.fn();
const mockSetUpdateInterval = jest.fn();
const mockAddListener = jest.fn();
const mockRemove = jest.fn();

jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    isAvailableAsync: () => mockIsAvailable(),
    setUpdateInterval: (ms: number) => mockSetUpdateInterval(ms),
    addListener: (cb: any) => { mockAddListener(cb); return { remove: mockRemove }; },
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('useMotionSensor', () => {
  it('returns isAvailable: false when unavailable (simulator)', async () => {
    mockIsAvailable.mockResolvedValue(false);
    const { result } = renderHook(() => useMotionSensor());
    await waitFor(() => expect(result.current.isAvailable).toBe(false));
    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it('subscribes to DeviceMotion when available', async () => {
    mockIsAvailable.mockResolvedValue(true);
    renderHook(() => useMotionSensor());
    await waitFor(() => expect(mockAddListener).toHaveBeenCalled());
  });

  it('sets isAvailable: true when available', async () => {
    mockIsAvailable.mockResolvedValue(true);
    const { result } = renderHook(() => useMotionSensor());
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
  });

  it('unsubscribes on unmount', async () => {
    mockIsAvailable.mockResolvedValue(true);
    const { unmount } = renderHook(() => useMotionSensor());
    await waitFor(() => expect(mockAddListener).toHaveBeenCalled());
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('updates motionLevel when listener fires with acceleration data', async () => {
    mockIsAvailable.mockResolvedValue(true);
    let capturedCb: any;
    mockAddListener.mockImplementation((cb: any) => { capturedCb = cb; return { remove: mockRemove }; });

    const { result } = renderHook(() => useMotionSensor());
    await waitFor(() => expect(capturedCb).toBeDefined());

    // mag = sqrt(3^2 + 4^2 + 0^2) = 5 → raw = clamp(round((5/5)*100), 0, 100) = 100
    await act(async () => {
      capturedCb({ acceleration: { x: 3, y: 4, z: 0 } });
    });
    expect(result.current.motionLevel).toBeGreaterThan(0);
  });

  it('ignores listener data with no acceleration', async () => {
    mockIsAvailable.mockResolvedValue(true);
    let capturedCb: any;
    mockAddListener.mockImplementation((cb: any) => { capturedCb = cb; return { remove: mockRemove }; });

    const { result } = renderHook(() => useMotionSensor());
    await waitFor(() => expect(capturedCb).toBeDefined());
    await act(async () => {
      capturedCb({ acceleration: null });
    });
    expect(result.current.motionLevel).toBe(0);
  });
});
