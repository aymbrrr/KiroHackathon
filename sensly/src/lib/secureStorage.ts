/**
 * Secure storage wrapper using expo-secure-store.
 *
 * iOS: backed by Keychain (hardware-encrypted)
 * Android: backed by Keystore (hardware-encrypted)
 *
 * NEVER use AsyncStorage for sensitive values (JWT tokens, refresh tokens,
 * push tokens). AsyncStorage is unencrypted plaintext on the device.
 *
 * Used as the Supabase auth storage adapter and for push token storage.
 */
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value, {
      // Only accessible when device is unlocked — prevents access from backups
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  getItem: async (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key);
  },

  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Supabase-compatible storage adapter.
 * Pass this to createClient({ auth: { storage: supabaseSecureStorageAdapter } })
 */
export const supabaseSecureStorageAdapter = {
  getItem: secureStorage.getItem,
  setItem: secureStorage.setItem,
  removeItem: secureStorage.removeItem,
};
