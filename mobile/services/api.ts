import axios from 'axios';
import { storage } from '../utils/storage';

const DEFAULT_BASE_URL = 'http://localhost:8000/api';

async function getBaseUrl(): Promise<string> {
  const settings = await storage.getSettings();
  let url = (settings?.backendUrl as string) || DEFAULT_BASE_URL;
  // Ensure /api suffix is present
  url = url.replace(/\/$/, '');
  if (!url.endsWith('/api')) {
    url = url + '/api';
  }
  return url;
}

let apiClientInstance: axios.AxiosInstance | null = null;
let currentBaseUrl: string = DEFAULT_BASE_URL;

async function getApiClient(): Promise<axios.AxiosInstance> {
  const baseUrl = await getBaseUrl();
  if (apiClientInstance && currentBaseUrl === baseUrl) {
    return apiClientInstance;
  }
  currentBaseUrl = baseUrl;
  apiClientInstance = axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  apiClientInstance.interceptors.request.use(
    async (config) => {
      const token = await storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClientInstance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.response?.status === 401) {
        storage.removeToken();
      }
      return Promise.reject(error);
    }
  );

  return apiClientInstance;
}

export const api = {
  async apiKeyLogin(apiKey: string, apiSecret: string) {
    const client = await getApiClient();
    const response = await client.post('/auth/api-key-login', { api_key: apiKey, api_secret: apiSecret });
    await storage.setToken(response.token);
    await storage.setApiKey(apiKey);
    await storage.setApiSecret(apiSecret);
    return response;
  },

  async register(email: string, password: string, apiKey: string, apiSecret: string) {
    const client = await getApiClient();
    const response = await client.post('/auth/register', { email, password, api_key: apiKey, api_secret: apiSecret });
    await storage.setToken(response.token);
    await storage.setApiKey(apiKey);
    await storage.setApiSecret(apiSecret);
    return response;
  },

  async login(email: string, password: string) {
    const client = await getApiClient();
    const response = await client.post('/auth/login', { email, password });
    await storage.setToken(response.token);
    return response;
  },

  async updateApiKeys(apiKey: string, apiSecret: string) {
    const client = await getApiClient();
    return client.put('/settings/api-keys', { api_key: apiKey, api_secret: apiSecret });
  },

  async getPositions() {
    const client = await getApiClient();
    return client.get('/positions');
  },

  async getAccount() {
    const client = await getApiClient();
    return client.get('/account');
  },

  async getAlerts() {
    const client = await getApiClient();
    return client.get('/alerts');
  },

  async getAdjustments() {
    const client = await getApiClient();
    return client.get('/adjustments/best');
  },

  async sendAdjustmentFeedback(adjustmentId: string, action: string) {
    const client = await getApiClient();
    return client.post('/adjustments/feedback', { adjustmentId, action });
  },
};
