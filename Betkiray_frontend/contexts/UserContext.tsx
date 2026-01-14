import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/config/api';
import { router } from 'expo-router';
import { UserData } from '@/types';
import { Alert } from 'react-native';

interface AuthResponse {
  accessToken: string;
  user: UserData;
}

interface UserContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  signInWithEmail: (data: any) => Promise<void>;
  signUpWithEmail: (data: any) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => void;
  getProfile: (token: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const processUserImage = (user: UserData): UserData => {
  if (user.image && !user.image.startsWith('http')) {
    return { ...user, image: `${api.defaults.baseURL}${user.image}` };
  }
  return user;
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = async () => {
    await AsyncStorage.removeItem('accessToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    router.replace('/(auth)/sign-in');
  };

  const getProfile = useCallback(async (authToken: string) => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      const response = await api.get('/profile/me');
      const processedUser = processUserImage(response.data);
      setUser(processedUser);
    } catch (error) {
      console.error("Failed to fetch profile, signing out.", error);
      await signOut();
    }
  }, []);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem('accessToken');
      if (storedToken) {
        setToken(storedToken);
        await getProfile(storedToken);
      }
      setIsLoading(false);
    };
    loadUserFromStorage();
  }, [getProfile]);

  const handleAuthSuccess = async (data: AuthResponse) => {
    const { accessToken, user: apiUser } = data;
    await AsyncStorage.setItem('accessToken', accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    const processedUser = processUserImage(apiUser);
    setToken(accessToken);
    setUser(processedUser);
    router.replace('/(tabs)');
  };

  const signInWithEmail = async (data: any) => {
    // By passing mock flag in API config, this call now goes through the mock adapter
    const response = await api.post<AuthResponse>('/auth/email/login', data);
    await handleAuthSuccess(response.data);
  };

  const signUpWithEmail = async (data: any) => {
    try {
      // Mock signup just logs in immediately with mock user
      if (api.defaults.adapter) { // Check if we are mocking
        await signInWithEmail({ email: data.email, password: data.password });
        return;
      }

      await api.post('/auth/email/register', data);
      await signInWithEmail({ email: data.email, password: data.password });
    } catch (error: any) {
      console.error("--- SIGN UP API CALL FAILED ---", error.response?.data);
      throw error;
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/google/login', { id_token: idToken });
      await handleAuthSuccess(response.data);
    } catch (error: any) {
      console.error("Google sign-in failed", error.response?.data);
      Alert.alert("Login Error", "Could not sign in with Google.");
    }
  };

  return (
    <UserContext.Provider value={{ user, token, isLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, getProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}