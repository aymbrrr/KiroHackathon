import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '../../stores/authStore';

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store state
  useAuthStore.setState({ session: null, user: null, isLoading: false, error: null });
});

describe('authStore — initial state', () => {
  it('has correct defaults', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('setSession', () => {
  it('sets session and user', () => {
    const { result } = renderHook(() => useAuthStore());
    const fakeSession = { user: { id: 'u1', email: 'a@b.com' } } as any;
    act(() => result.current.setSession(fakeSession));
    expect(result.current.session).toBe(fakeSession);
    expect(result.current.user).toBe(fakeSession.user);
  });

  it('clears session and user when null', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setSession(null));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });
});

describe('signIn', () => {
  it('success: clears loading and error', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuthStore());
    await act(() => result.current.signIn('a@b.com', 'pass'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('failure: sets error message', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    const { result } = renderHook(() => useAuthStore());
    await act(() => result.current.signIn('a@b.com', 'wrong'));
    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.isLoading).toBe(false);
  });
});

describe('signUp', () => {
  it('success: clears loading', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuthStore());
    await act(() => result.current.signUp('new@b.com', 'pass'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('failure: sets error', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email taken' } });
    const { result } = renderHook(() => useAuthStore());
    await act(() => result.current.signUp('taken@b.com', 'pass'));
    expect(result.current.error).toBe('Email taken');
  });
});

describe('signOut', () => {
  it('calls supabase.auth.signOut and clears session', async () => {
    mockSignOut.mockResolvedValue({});
    useAuthStore.setState({ session: { user: { id: 'u1' } } as any, user: { id: 'u1' } as any });
    const { result } = renderHook(() => useAuthStore());
    await act(() => result.current.signOut());
    expect(mockSignOut).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });
});

describe('clearError', () => {
  it('resets error to null', () => {
    useAuthStore.setState({ error: 'some error' });
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
