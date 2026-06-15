import axios from 'axios';
import { storage } from '../utils/storage';

const BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      storage.removeToken();
    }
    return Promise.reject(error);
  }
);

export const api = {
  async login(apiKey, apiSecret) {
    const response = await apiClient.post('/auth/login', { apiKey, apiSecret });
    await storage.setToken(response.token);
    return response;
  },

  async getPositions() {
    return apiClient.get('/positions');
  },

  async getAccount() {
    return apiClient.get('/account');
  },

  async getAlerts() {
    return apiClient.get('/alerts');
  },

  async getAdjustments() {
    return apiClient.get('/adjustments');
  },

  async sendAdjustmentFeedback(adjustmentId, action) {
    return apiClient.post('/adjustments/feedback', { adjustmentId, action });
  },
};
