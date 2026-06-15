import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  API_KEY: '@deltarisk_api_key',
  API_SECRET: '@deltarisk_api_secret',
  TOKEN: '@deltarisk_token',
  SETTINGS: '@deltarisk_settings',
  USER_PREFS: '@deltarisk_user_prefs',
};

const simpleEncrypt = (text: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return text;
  }
};

const simpleDecrypt = (encoded: string): string => {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return encoded;
  }
};

export const storage = {
  async setToken(token: string) {
    await AsyncStorage.setItem(KEYS.TOKEN, simpleEncrypt(token));
  },

  async getToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem(KEYS.TOKEN);
    return token ? simpleDecrypt(token) : null;
  },

  async removeToken() {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  },

  async setApiKey(apiKey: string) {
    await AsyncStorage.setItem(KEYS.API_KEY, simpleEncrypt(apiKey));
  },

  async getApiKey(): Promise<string | null> {
    const key = await AsyncStorage.getItem(KEYS.API_KEY);
    return key ? simpleDecrypt(key) : null;
  },

  async setApiSecret(apiSecret: string) {
    await AsyncStorage.setItem(KEYS.API_SECRET, simpleEncrypt(apiSecret));
  },

  async getApiSecret(): Promise<string | null> {
    const secret = await AsyncStorage.getItem(KEYS.API_SECRET);
    return secret ? simpleDecrypt(secret) : null;
  },

  async saveSettings(settings: Record<string, unknown>) {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async getSettings(): Promise<Record<string, unknown> | null> {
    const settings = await AsyncStorage.getItem(KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : null;
  },

  async saveUserPrefs(prefs: Record<string, unknown>) {
    await AsyncStorage.setItem(KEYS.USER_PREFS, JSON.stringify(prefs));
  },

  async getUserPrefs(): Promise<Record<string, unknown> | null> {
    const prefs = await AsyncStorage.getItem(KEYS.USER_PREFS);
    return prefs ? JSON.parse(prefs) : null;
  },

  async clearAll() {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
