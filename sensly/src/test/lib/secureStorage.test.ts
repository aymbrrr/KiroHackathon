import * as SecureStore from 'expo-secure-store';
import { secureStorage, supabaseSecureStorageAdapter } from '../../lib/secureStorage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue('stored-value'),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

describe('secureStorage', () => {
  afterEach(() => jest.clearAllMocks());

  it('setItem calls SecureStore.setItemAsync with WHEN_UNLOCKED_THIS_DEVICE_ONLY', async () => {
    await secureStorage.setItem('token', 'abc123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'token',
      'abc123',
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
    );
  });

  it('getItem delegates to SecureStore.getItemAsync', async () => {
    const result = await secureStorage.getItem('token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('token');
    expect(result).toBe('stored-value');
  });

  it('getItem returns null for missing key', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    const result = await secureStorage.getItem('missing');
    expect(result).toBeNull();
  });

  it('removeItem calls SecureStore.deleteItemAsync with correct key', async () => {
    await secureStorage.removeItem('token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
  });
});

describe('supabaseSecureStorageAdapter', () => {
  it('has getItem, setItem, removeItem', () => {
    expect(typeof supabaseSecureStorageAdapter.getItem).toBe('function');
    expect(typeof supabaseSecureStorageAdapter.setItem).toBe('function');
    expect(typeof supabaseSecureStorageAdapter.removeItem).toBe('function');
  });

  it('adapter setItem delegates to secureStorage (enforces keychain access level)', async () => {
    await supabaseSecureStorageAdapter.setItem('key', 'val');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'key',
      'val',
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
    );
  });

  it('adapter getItem delegates to secureStorage', async () => {
    await supabaseSecureStorageAdapter.getItem('key');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key');
  });

  it('adapter removeItem delegates to secureStorage', async () => {
    await supabaseSecureStorageAdapter.removeItem('key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
  });
});
