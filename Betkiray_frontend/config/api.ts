import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOCK_USER, MOCK_PROPERTIES } from "@/data/mockData";

// TOGGLE THIS TO TRUE TO USE MOCK DATA
export const USE_MOCK_DATA = true;

const api = axios.create({
  baseURL: "http://10.0.2.2:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    // Return mock data if enabled
    if (USE_MOCK_DATA) {
      // We can't actually "return" data here to skip the network call in a standard axios interceptor 
      // without throwing a specific error or using a mock adapter. 
      // However, for this simple use case, we will let the request fail or handle it in the response interceptor?
      // Better approach: Use a mock adapter pattern or just check the flag in valid service methods.
      // BUT, since we want to be less intrusive to the calling code, let's use a dirty trick or 
      // actually, just patching the adapter is the "axios way".

      config.adapter = async (config) => {
        return new Promise((resolve, reject) => {
          let data;
          const url = config.url || "";

          if (url.includes("/auth/email/login") || url.includes("/auth/google/login")) {
            data = { accessToken: "mock_token_123", user: MOCK_USER };
          } else if (url.includes("/properties")) {
            // Handle POST properties (add)
            if (config.method === 'post') {
              // Return the data sent as if it was created
              // For FormData, it's complex to parse here, so just return a mock property
              data = MOCK_PROPERTIES[0];
            } else {
              data = MOCK_PROPERTIES;
            }
          } else if (url.includes("/profile/me")) {
            data = MOCK_USER;
          } else if (url.includes("/admin/stats")) {
            data = {
              totalProperties: MOCK_PROPERTIES.length,
              pendingApprovals: 2,
              totalUsers: 15,
              monthlyEarnings: 50000
            };
          } else if (url.includes("/saved")) {
            data = []; // Mock empty saved for now or filter MOCK_PROPERTIES
          } else {
            data = {};
          }

          const response = {
            data,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            request: {},
          };

          // Simulate network delay
          setTimeout(() => {
            resolve(response);
          }, 500);
        });
      };
    }

    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
