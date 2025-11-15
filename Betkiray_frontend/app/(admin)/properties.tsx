// app/(admin)/properties.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/config/api";
import { Property } from "@/types";

type FilterType = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function ManagePropertiesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("ALL");

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/properties");
      setProperties(response.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch properties.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = (propertyId: number) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this property? This action is permanent.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/properties/${propertyId}`);
              await fetchProperties();
            } catch (error) {
              Alert.alert("Error", "Could not delete the property.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  const API_BASE_URL = api.defaults.baseURL;

  const getFilteredProperties = () => {
    if (filter === "ALL") return properties;
    // Add filtering logic based on property status if available from backend
    return properties;
  };

  const filteredProperties = getFilteredProperties();

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterType[]).map(
          (tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterButton,
                filter === tab && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(tab)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === tab && styles.filterButtonTextActive,
                ]}
              >
                {tab === "ALL"
                  ? "All"
                  : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* Properties List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={true}
      >
        {filteredProperties.length > 0 ? (
          filteredProperties.map((item) => (
            <View key={item.id.toString()} style={styles.card}>
              <Image
                source={{ uri: `${API_BASE_URL}${item.media[0]?.mediaUrl}` }}
                style={styles.image}
              />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.owner}>by {item.owner?.name || "N/A"}</Text>
                <Text style={styles.price}>
                  ETB {item.price.toLocaleString()} /
                  {item.billingPeriod?.toLowerCase()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => router.push(`/property/${item.id}`)}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No properties found.</Text>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  listContainer: {
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: "100%",
    height: 120,
    backgroundColor: "#eee",
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  owner: {
    color: "#999",
    marginTop: 4,
    fontSize: 12,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginTop: 6,
  },
  viewButton: {
    backgroundColor: "#666",
    padding: 12,
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  viewButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
