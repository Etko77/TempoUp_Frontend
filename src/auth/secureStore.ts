import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'tempoup.access';
const REFRESH_KEY = 'tempoup.refresh';
const USER_KEY = 'tempoup.user';

export interface StoredUser {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export const tokenStorage = {
  async saveTokens(access: string, refresh: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },

  async getAccess(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },

  async getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async saveUser(user: StoredUser): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<StoredUser | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  },
};
