import { renderHook, act } from '@testing-library/react-native';
import { useAudioMeter } from '../../hooks/useAudioMeter';

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockCreateAsync = jest.fn();
const mockStopAndUnload = jest.fn();
const mockSetAudioMode = jest.fn();

jest.mock('expo-av', () => ({
  Audio: {
    getPermissionsAsync: () => mockGetPermissions(),
    requestPermissionsAsync: () => mockRequestPermissions(),
    setAudioModeAsync: (opts: any) => mockSetAudioMode(opts),
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
    Recording: {
      createAsync: (opts: any, cb: any, interval: any) => mockCreateAsync(opts, cb, interval),
    },
  },
}));

function grantedPermission() {
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
}

function deniedPermission() {
  mockGetPermissions.mockResolvedValue({ status: 'denied' });
  mockRequestPermissions.mockResolvedValue({ status: 'denied' });
}

function mockRecording() {
  const recording = { stopAndUnloadAsync: mockStopAndUnload };
  mockCreateAsync.mockResolvedValue({ recording });
  mockStopAndUnload.mockResolvedValue(undefined);
  return recording;
}

beforeEach(() => jest.clearAllMocks());

describe('useAudioMeter — initial state', () => {
  it('starts with correct defaults', () => {
    const { result } = renderHook(() => useAudioMeter());
    expect(result.current.db).toBe(0);
    expect(result.current.isListening).toBe(false);
    expect(result.current.permissionGranted).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('start()', () => {
  it('returns false and sets error when permission denied', async () => {
    deniedPermission();
    const { result } = renderHook(() => useAudioMeter());
    let success: boolean;
    await act(async () => { success = await result.current.start(); });
    expect(success!).toBe(false);
    expect(result.current.permissionGranted).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('returns true and sets isListening when permission granted', async () => {
    grantedPermission();
    mockRecording();
    const { result } = renderHook(() => useAudioMeter());
    let success: boolean;
    await act(async () => { success = await result.current.start(); });
    expect(success!).toBe(true);
    expect(result.current.isListening).toBe(true);
    expect(result.current.permissionGranted).toBe(true);
  });

  it('stops existing recording before starting new one', async () => {
    grantedPermission();
    mockRecording();
    const { result } = renderHook(() => useAudioMeter());
    await act(() => result.current.start());
    // Second start — should stop first
    mockRecording();
    await act(() => result.current.start());
    expect(mockStopAndUnload).toHaveBeenCalled();
  });
});

describe('dBFS → dBSPL conversion (clampDb)', () => {
  // clampDb(metering) = max(30, min(100, metering + 90))
  it('-60 dBFS → 30 dBSPL', () => {
    expect(Math.max(30, Math.min(100, -60 + 90))).toBe(30);
  });
  it('0 dBFS → 90 dBSPL', () => {
    expect(Math.max(30, Math.min(100, 0 + 90))).toBe(90);
  });
  it('-100 dBFS clamps to 30', () => {
    expect(Math.max(30, Math.min(100, -100 + 90))).toBe(30);
  });
  it('10 dBFS clamps to 100', () => {
    expect(Math.max(30, Math.min(100, 10 + 90))).toBe(100);
  });
});

describe('stop()', () => {
  it('returns null when no recording active', async () => {
    const { result } = renderHook(() => useAudioMeter());
    let res: any;
    await act(async () => { res = await result.current.stop(); });
    expect(res).toBeNull();
  });

  it('resets audio mode after stopping', async () => {
    grantedPermission();
    mockRecording();
    const { result } = renderHook(() => useAudioMeter());
    await act(() => result.current.start());
    await act(() => result.current.stop());
    expect(mockSetAudioMode).toHaveBeenCalledWith({ allowsRecordingIOS: false });
  });

  it('sets isListening to false after stop', async () => {
    grantedPermission();
    mockRecording();
    const { result } = renderHook(() => useAudioMeter());
    await act(() => result.current.start());
    await act(() => result.current.stop());
    expect(result.current.isListening).toBe(false);
  });
});
