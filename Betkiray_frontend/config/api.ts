import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CHANGE ---
// IMPORTANT: Replace this with your computer's local network IP address.
// On Windows, open cmd and type `ipconfig`. Find the "IPv4 Address".
// On Mac, go to System Settings > Wi-Fi > Details... and find the "IP Address".
// Do NOT use 'localhost' or '127.0.0.1'.
const YOUR_LOCAL_IP = '192.168.43.13'; // <--- CHANGE THIS
// const YOUR_LOCAL_IP = '192.168.19.235'
const API_PORT = 3000;

const baseURL = `http://${YOUR_LOCAL_IP}:${API_PORT}`;

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically add the JWT to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;