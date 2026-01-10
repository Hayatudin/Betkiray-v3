import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- CHANGE ---
// IMPORTANT: Replace this with your computer's local network IP address.
const YOUR_LOCAL_IP = '192.168.29.32';
// const YOUR_LOCAL_IP = 'desktop-et';

const API_PORT = 3000;

const baseURL = `http://${YOUR_LOCAL_IP}:${API_PORT}`;

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to automatically add the JWT to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
