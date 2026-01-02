// app/(admin)/users.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/config/api";
import { UserData, Property } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.4:3000";

// Extended user type for detailed view
interface UserDetails extends UserData {
  phone?: string;
  properties: Property[];
  propertyCount: number;
}

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (err) {
      setError("Failed to fetch users.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/admin/users/${userId}`);
      setSelectedUser(response.data);
      setModalVisible(true);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch user details.");
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleBan = async (
    userId: string,
    isCurrentlyBanned: boolean
  ) => {
    const action = isCurrentlyBanned ? "unban" : "ban";
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action} this user?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Yes, ${action}`,
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${userId}/status`, {
                isBanned: !isCurrentlyBanned,
              });
              await fetchUsers();
              // Also update modal if open
              if (selectedUser && selectedUser.id === userId) {
                setSelectedUser({ ...selectedUser, isBanned: !isCurrentlyBanned });
              }
            } catch (error) {
              Alert.alert("Error", `Could not ${action} the user.`);
            }
          },
        },
      ]
    );
  };

  const getFilteredUsers = () => {
    if (!searchText.trim()) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPropertyImage = (property: Property) => {
    if (property.media && property.media.length > 0) {
      const imageUrl = property.media[0].mediaUrl;
      if (imageUrl.startsWith("http")) {
        return imageUrl;
      }
      return `${API_URL}${imageUrl}`;
    }
    return null;
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "#22c55e";
      case "PENDING":
        return "#f59e0b";
      case "REJECTED":
        return "#ef4444";
      default:
        return "#999";
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  const filteredUsers = getFilteredUsers();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={true}
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map((item) => (
            <View key={item.id.toString()} style={styles.userCard}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {getInitials(item.name)}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userRole}>
                  {item.role === "ADMIN" ? "Admin" : "Property Owner"}
                </Text>
              </View>
              <Switch
                value={!item.isBanned}
                onValueChange={() => handleToggleBan(item.id, item.isBanned)}
              />
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => fetchUserDetails(item.id)}
              >
                {loadingDetails ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No users found.</Text>
        )}
      </ScrollView>

      {/* User Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={true}
              >
                {/* User Profile Section */}
                <View style={styles.profileSection}>
                  {selectedUser.image ? (
                    <Image
                      source={{ uri: selectedUser.image }}
                      style={styles.profileAvatar}
                    />
                  ) : (
                    <View style={styles.profileAvatarPlaceholder}>
                      <Text style={styles.profileAvatarText}>
                        {getInitials(selectedUser.name)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.profileName}>{selectedUser.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    selectedUser.isBanned ? styles.bannedBadge : styles.activeBadge
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      selectedUser.isBanned ? styles.bannedBadgeText : styles.activeBadgeText
                    ]}>
                      {selectedUser.isBanned ? "Banned" : "Active"}
                    </Text>
                  </View>
                </View>

                {/* User Info Cards */}
                <View style={styles.infoSection}>
                  <View style={styles.infoCard}>
                    <Ionicons name="mail-outline" size={20} color="#5b9bd5" />
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{selectedUser.email}</Text>
                    </View>
                  </View>

                  {selectedUser.phone && (
                    <View style={styles.infoCard}>
                      <Ionicons name="call-outline" size={20} color="#5b9bd5" />
                      <View style={styles.infoCardContent}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{selectedUser.phone}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.infoCard}>
                    <Ionicons name="shield-outline" size={20} color="#5b9bd5" />
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoLabel}>Role</Text>
                      <Text style={styles.infoValue}>
                        {selectedUser.role === "ADMIN" ? "Administrator" : "Property Owner"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <Ionicons name="home-outline" size={20} color="#5b9bd5" />
                    <View style={styles.infoCardContent}>
                      <Text style={styles.infoLabel}>Properties</Text>
                      <Text style={styles.infoValue}>
                        {selectedUser.propertyCount} properties
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Properties Section */}
                {selectedUser.properties && selectedUser.properties.length > 0 && (
                  <View style={styles.propertiesSection}>
                    <Text style={styles.sectionTitle}>Posted Properties</Text>
                    {selectedUser.properties.map((property) => (
                      <View key={property.id} style={styles.propertyCard}>
                        {getPropertyImage(property) ? (
                          <Image
                            source={{ uri: getPropertyImage(property)! }}
                            style={styles.propertyImage}
                          />
                        ) : (
                          <View style={styles.propertyImagePlaceholder}>
                            <Ionicons name="image-outline" size={24} color="#ccc" />
                          </View>
                        )}
                        <View style={styles.propertyInfo}>
                          <Text style={styles.propertyTitle} numberOfLines={1}>
                            {property.title}
                          </Text>
                          <Text style={styles.propertyLocation} numberOfLines={1}>
                            {property.city}, {property.subCity || property.address}
                          </Text>
                          <View style={styles.propertyMeta}>
                            <Text style={styles.propertyPrice}>
                              ETB {Number(property.price).toLocaleString()}
                            </Text>
                            <View style={[
                              styles.approvalBadge,
                              { backgroundColor: getApprovalStatusColor(property.approvalStatus) + "20" }
                            ]}>
                              <Text style={[
                                styles.approvalBadgeText,
                                { color: getApprovalStatusColor(property.approvalStatus) }
                              ]}>
                                {property.approvalStatus}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* No Properties Message */}
                {(!selectedUser.properties || selectedUser.properties.length === 0) && (
                  <View style={styles.noPropertiesSection}>
                    <Ionicons name="home-outline" size={48} color="#ccc" />
                    <Text style={styles.noPropertiesText}>
                      This user hasn't posted any properties yet.
                    </Text>
                  </View>
                )}

                {/* Ban/Unban Button */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    selectedUser.isBanned ? styles.unbanButton : styles.banButton
                  ]}
                  onPress={() => handleToggleBan(selectedUser.id, selectedUser.isBanned)}
                >
                  <Ionicons
                    name={selectedUser.isBanned ? "checkmark-circle-outline" : "ban-outline"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonText}>
                    {selectedUser.isBanned ? "Unban User" : "Ban User"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Simple Switch Component
const Switch = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: () => void;
}) => (
  <TouchableOpacity
    style={[styles.switchContainer, value ? styles.switchOn : styles.switchOff]}
    onPress={onValueChange}
  >
    <View
      style={[
        styles.switchThumb,
        value ? styles.switchThumbOn : styles.switchThumbOff,
      ]}
    />
  </TouchableOpacity>
);

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  userCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#5b9bd5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  userRole: {
    color: "#999",
    marginTop: 4,
    fontSize: 12,
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  switchContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
    marginLeft: 8,
  },
  switchOn: {
    backgroundColor: "#000",
  },
  switchOff: {
    backgroundColor: "#ccc",
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  switchThumbOn: {
    alignSelf: "flex-end",
  },
  switchThumbOff: {
    alignSelf: "flex-start",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  // Profile Section
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#5b9bd5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileAvatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
  },
  bannedBadge: {
    backgroundColor: "#fee2e2",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeBadgeText: {
    color: "#22c55e",
  },
  bannedBadgeText: {
    color: "#ef4444",
  },
  // Info Section
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  infoCardContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  // Properties Section
  propertiesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  propertyCard: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  propertyImage: {
    width: 80,
    height: 80,
  },
  propertyImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  propertyInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  propertyMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  propertyPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5b9bd5",
  },
  approvalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  approvalBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  // No Properties
  noPropertiesSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noPropertiesText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  // Action Button
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  banButton: {
    backgroundColor: "#ef4444",
  },
  unbanButton: {
    backgroundColor: "#22c55e",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
