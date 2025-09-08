import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import api from '@/config/api';
import { useUser } from './UserContext';
// --- CHANGE: Import types from the new types file ---
import { City, Property } from '@/types/index';

export type AppState = {
  propertiesByCity: Record<City, Property[]>;
  allProperties: Property[]; 
  savedProperties: Property[];
  isLoading: boolean;
  error: string | null;
  isSaved: (id: number) => boolean;
  toggleSaved: (id: number) => Promise<void>;
  addProperty: (formData: FormData) => Promise<Property>;
  getPropertyById: (id: number) => Property | undefined;
  // getAllProperties: () => Property[];
  refetchProperties: () => void;
};

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [propertiesByCity, setPropertiesByCity] = useState<Record<City, Property[]>>({
    'Addis Ababa': [], Nairobi: [], Lagos: [],
  });
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { token } = useUser();
  const API_BASE_URL = api.defaults.baseURL;

  const allProperties = useMemo(() => Object.values(propertiesByCity).flat(), [propertiesByCity]);

  const fetchProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/properties');
      const allProps: Property[] = response.data;
      const groupedByCity = allProps.reduce((acc, prop) => {
        const city = prop.city;
        if (!acc[city]) acc[city] = [];
        const imageUrl = prop.media?.[0]?.mediaUrl ? `${API_BASE_URL}${prop.media[0].mediaUrl}` : '';
        acc[city].push({ ...prop, image: imageUrl });
        return acc;
      }, {} as Record<City, Property[]>);
      setPropertiesByCity(groupedByCity);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
      setError("Could not load properties. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      const response = await api.get('/saved');
      const saved = response.data.map((item: { property: { media: { mediaUrl: any; }[]; }; }) => ({
        ...item.property,
        image: item.property.media?.[0]?.mediaUrl ? `${API_BASE_URL}${item.property.media[0].mediaUrl}` : '',
      }));
      setSavedProperties(saved);
    } catch (err) {
      console.error("Failed to fetch saved properties:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
    if (token) {
      console.log("User is authenticated, fetching saved properties...");
      fetchSaved();
    } else {
      console.log("User is not authenticated, clearing saved properties.");
      setSavedProperties([]);
    }
  }, [token]);

  const isSaved = (id: number) => savedProperties.some(p => p.id === id);

  const toggleSaved = async (id: number) => {
    if (!token) {
      Alert.alert("Please Log In", "You need to be logged in to save properties.");
      return;
    }
    const wasSaved = isSaved(id);
    try {
      if (wasSaved) {
        await api.delete(`/saved/${id}`);
      } else {
        await api.post(`/saved/${id}`);
      }
      await fetchSaved();
    } catch (err) {
      console.error("Failed to toggle saved property:", err);
      Alert.alert("Error", "Could not update your saved properties.");
    }
  };

  const getAllProperties = () => Object.values(propertiesByCity).flat();
  const getPropertyById = (id: number) => getAllProperties().find((p) => p.id === id);
  
  const addProperty = async (formData: FormData) => {
    const response = await api.post<Property>('/properties', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    await fetchProperties();
    return response.data;
  };
  
  const value = useMemo(
    () => ({
      propertiesByCity,
      allProperties,
      savedProperties,
      isLoading,
      error,
      isSaved,
      toggleSaved,
      addProperty,
      getPropertyById,
      // getAllProperties,
      refetchProperties: fetchProperties,
    }),
    [propertiesByCity, allProperties, savedProperties, isLoading, error],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
