import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import api from "@/config/api";
import { useUser } from "./UserContext";
import { City, Property } from "@/types/index";

export type AppState = {
  propertiesByCity: Record<City, Property[]>;
  allProperties: Property[];
  savedProperties: Property[];
  isLoading: boolean;
  error: string | null;
  isSaved: (id: number) => boolean;
  toggleSaved: (id: number) => Promise<void>;
  addProperty: (formData: FormData) => Promise<Property>;
  deleteProperty: (id: number) => Promise<void>;
  getPropertyById: (id: number) => Property | undefined;
  refetchProperties: () => void;
};

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [propertiesByCity, setPropertiesByCity] = useState<
    Record<City, Property[]>
  >({
    "Addis Ababa": [],
    Jimma: [],
  } as unknown as Record<City, Property[]>);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token } = useUser();
  const API_BASE_URL = api.defaults.baseURL;

  const allProperties = useMemo(
    () => Object.values(propertiesByCity).flat(),
    [propertiesByCity]
  );

  const fetchProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/properties");
      const allProps: Property[] = response.data;

      const processedProps = allProps.map((prop) => {
        let imageUrl = prop.image;

        // If no direct image, try to get from media
        if (!imageUrl) {
          imageUrl = prop.media?.find((m) => m.mediaType === "IMAGE")
            ?.mediaUrl
            ? `${API_BASE_URL}${prop.media.find((m) => m.mediaType === "IMAGE")?.mediaUrl
            }`
            : "";
        }

        const location = [prop.address, prop.subCity, prop.city]
          .filter(Boolean)
          .join(", ");

        return { ...prop, image: imageUrl, location };
      });

      const groupedByCity = processedProps.reduce((acc, prop) => {
        const city = prop.city as City;
        if (!acc[city]) acc[city] = [];
        acc[city].push(prop);
        return acc;
      }, {} as Record<City, Property[]>);

      setPropertiesByCity(groupedByCity);
    } catch (err: any) {
      console.error("--- FETCH PROPERTIES FAILED ---", err);
      setError("Could not load properties. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      const response = await api.get("/saved");
      const saved = response.data.map((item: any) => {
        const prop = item.property;

        let imageUrl = prop.image;
        if (!imageUrl) {
          imageUrl = prop.media?.find((m: any) => m.mediaType === "IMAGE")
            ?.mediaUrl
            ? `${API_BASE_URL}${prop.media.find((m: any) => m.mediaType === "IMAGE").mediaUrl
            }`
            : "";
        }

        const location = [prop.address, prop.subCity, prop.city]
          .filter(Boolean)
          .join(", ");
        return { ...prop, image: imageUrl, location };
      });
      setSavedProperties(saved);
    } catch (err) {
      console.error("Failed to fetch saved properties:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
    if (token) {
      fetchSaved();
    } else {
      setSavedProperties([]);
    }
  }, [token]);

  const isSaved = (id: number) => savedProperties.some((p) => p.id === id);

  const toggleSaved = async (id: number) => {
    if (!token) {
      Alert.alert(
        "Please Log In",
        "You need to be logged in to save properties."
      );
      return;
    }

    // 1️⃣ Optimistic update: immediately update local UI
    setSavedProperties((prev) => {
      const alreadySaved = prev.some((p) => p.id === id);
      if (alreadySaved) {
        return prev.filter((p) => p.id !== id); // remove from saved instantly
      } else {
        const propertyToAdd = allProperties.find((p) => p.id === id);
        return propertyToAdd ? [...prev, propertyToAdd] : prev;
      }
    });

    try {
      // 2️⃣ Send request to server (real API call)
      if (isSaved(id)) {
        await api.delete(`/saved/${id}`);
      } else {
        await api.post(`/saved/${id}`);
      }
    } catch (err) {
      console.error("Failed to toggle saved property:", err);
      Alert.alert("Error", "Could not update saved properties.");

      // 3️⃣ Rollback (revert optimistic change if request fails)
      setSavedProperties((prev) => {
        const alreadySaved = prev.some((p) => p.id === id);
        if (alreadySaved) {
          // if failed after saving → undo
          return prev.filter((p) => p.id !== id);
        } else {
          // if failed after un-saving → restore
          const propertyToRestore = allProperties.find((p) => p.id === id);
          return propertyToRestore ? [...prev, propertyToRestore] : prev;
        }
      });
    }
  };

  const getPropertyById = (id: number) =>
    allProperties.find((p) => p.id === id);

  const addProperty = async (formData: FormData) => {
    const response = await api.post<Property>("/properties", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await fetchProperties();
    return response.data;
  };

  const deleteProperty = async (id: number) => {
    await api.delete(`/properties/${id}`);
    await fetchProperties();
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
      deleteProperty,
      getPropertyById,
      refetchProperties: fetchProperties,
    }),
    [propertiesByCity, allProperties, savedProperties, isLoading, error]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
