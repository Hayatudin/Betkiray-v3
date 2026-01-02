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

  const handleApprove = async (propertyId: number) => {
    try {
      await api.patch(`/admin/properties/${propertyId}/approve`);
      Alert.alert("Success", "Property approved successfully!");
      await fetchProperties();
    } catch (error) {
      Alert.alert("Error", "Could not approve the property.");
    }
  };

  const handleReject = (propertyId: number) => {
    Alert.prompt(
      "Reject Property",
      "Please provide a reason for rejection (optional):",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason) => {
            try {
              await api.patch(`/admin/properties/${propertyId}/reject`, {
                rejectionReason: reason || undefined,
              });
              Alert.alert("Success", "Property rejected successfully!");
              await fetchProperties();
            } catch (error) {
              Alert.alert("Error", "Could not reject the property.");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  const API_BASE_URL = api.defaults.baseURL;

  const getFilteredProperties = () => {
    if (filter === "ALL") return properties;
    return properties.filter((p) => p.approvalStatus === filter);
  };

  const filteredProperties = getFilteredProperties();

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { backgroundColor: "#10b981", color: "#fff" };
      case "PENDING":
        return { backgroundColor: "#f59e0b", color: "#fff" };
      case "REJECTED":
        return { backgroundColor: "#ef4444", color: "#fff" };
      default:
        return { backgroundColor: "#6b7280", color: "#fff" };
    }
  };

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
                <View style={styles.headerRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      getStatusBadgeStyle(item.approvalStatus),
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {item.approvalStatus}
                    </Text>
                  </View>
                </View>
                <Text style={styles.owner}>by {item.owner?.name || "N/A"}</Text>
                <Text style={styles.price}>
                  ETB {item.price.toLocaleString()} /
                  {item.billingPeriod?.toLowerCase()}
                </Text>
                {item.rejectionReason && (
                  <View style={styles.rejectionReasonContainer}>
                    <Text style={styles.rejectionReasonLabel}>
                      Rejection Reason:
                    </Text>
                    <Text style={styles.rejectionReasonText}>
                      {item.rejectionReason}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {item.approvalStatus === "PENDING" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(item.id)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(item.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => router.push(`/property/${item.id}`)}
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
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
  rejectionReasonContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  rejectionReasonLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#991b1b",
    marginBottom: 2,
  },
  rejectionReasonText: {
    fontSize: 12,
    color: "#7f1d1d",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 6,
    gap: 6,
  },
  approveButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  viewButton: {
    backgroundColor: "#666",
    padding: 12,
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
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
