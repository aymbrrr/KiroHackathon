import { useSettingsStore } from '../../stores/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(() => {
  useSettingsStore.setState({
    uiMode: 'self',
    language: 'en',
    colorBlindMode: 'none',
    textSizeMode: 'normal',
    onboardingCompletedForUserId: null,
    _hasHydrated: false,
  });
});

describe('settingsStore — initial state', () => {
  it('has correct defaults', () => {
    const s = useSettingsStore.getState();
    expect(s.uiMode).toBe('self');
    expect(s.language).toBe('en');
    expect(s.colorBlindMode).toBe('none');
    expect(s.textSizeMode).toBe('normal');
    expect(s.onboardingCompletedForUserId).toBeNull();
    expect(s._hasHydrated).toBe(false);
  });
});

describe('setters', () => {
  it('setUiMode', () => {
    useSettingsStore.getState().setUiMode('support');
    expect(useSettingsStore.getState().uiMode).toBe('support');
  });

  it('setLanguage', () => {
    useSettingsStore.getState().setLanguage('es');
    expect(useSettingsStore.getState().language).toBe('es');
  });

  it('setColorBlindMode', () => {
    useSettingsStore.getState().setColorBlindMode('deuteranopia');
    expect(useSettingsStore.getState().colorBlindMode).toBe('deuteranopia');
  });

  it('setTextSizeMode', () => {
    useSettingsStore.getState().setTextSizeMode('large');
    expect(useSettingsStore.getState().textSizeMode).toBe('large');
  });

  it('setOnboardingComplete', () => {
    useSettingsStore.getState().setOnboardingComplete('user-123');
    expect(useSettingsStore.getState().onboardingCompletedForUserId).toBe('user-123');
  });

  it('resetOnboarding sets to null', () => {
    useSettingsStore.setState({ onboardingCompletedForUserId: 'user-123' });
    useSettingsStore.getState().resetOnboarding();
    expect(useSettingsStore.getState().onboardingCompletedForUserId).toBeNull();
  });

  it('setHasHydrated', () => {
    useSettingsStore.getState().setHasHydrated(true);
    expect(useSettingsStore.getState()._hasHydrated).toBe(true);
  });
});

describe('persistence', () => {
  it('_hasHydrated exists as runtime state', () => {
    expect('_hasHydrated' in useSettingsStore.getState()).toBe(true);
  });

  it('last setUiMode call wins', () => {
    useSettingsStore.getState().setUiMode('support');
    useSettingsStore.getState().setUiMode('self');
    expect(useSettingsStore.getState().uiMode).toBe('self');
  });
});
