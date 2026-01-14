import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  Dimensions, Modal, Animated, ActivityIndicator, RefreshControl, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useUser } from "@/contexts/UserContext";
import { useAppState } from "@/contexts/AppStateContext";
import { Property } from "@/types";
import api from "@/config/api";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user, signOut } = useUser();
  const { savedProperties, allProperties, isLoading, refetchProperties, deleteProperty } = useAppState();
  const [activeTab, setActiveTab] = useState("My Listings");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE_URL = api.defaults.baseURL;

  const calculateStats = useCallback(() => {
    if (user && allProperties) {
      const filteredProps = allProperties.filter(p => p.ownerId === user.id);
      setMyProperties(filteredProps);
      const total = filteredProps.reduce((sum, prop) => sum + (prop.viewCount || 0), 0);
      setTotalViews(total);
    }
  }, [user, allProperties]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetchProperties();
    calculateStats();
    setIsRefreshing(false);
  }, []);

  const showSettings = () => {
    setSettingsVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };

  const hideSettings = (callback?: () => void) => {
    Animated.spring(slideAnim, { toValue: height, useNativeDriver: true, tension: 100, friction: 8 }).start(() => {
      setSettingsVisible(false);
      if (callback) callback();
    });
  };

  const handleLogout = () => hideSettings(signOut);



  const handleDeleteProperty = (propertyId: number) => {
    Alert.alert("Delete Property", "Are you sure you want to delete this listing permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteProperty(propertyId);
            onRefresh();
          } catch (error) {
            Alert.alert("Error", "Could not delete property.");
          }
        }
      },
    ]);
  };

  const renderPropertyCard = (listing: Property, isMyListing: boolean) => (
    <TouchableOpacity key={listing.id} style={styles.listingCard} onPress={() => router.push(`/property/${listing.id}`)}>
      <Image source={{ uri: listing.image }} style={styles.listingImage} contentFit="cover" />
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.listingPrice}>${listing.price.toString()}/{listing.billingPeriod.toLowerCase()}</Text>
      </View>
      {isMyListing && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity onPress={() => router.push(`/property/edit/${listing.id}`)} style={styles.optionButton}><Ionicons name="create-outline" size={20} color="#007AFF" /></TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteProperty(listing.id)} style={styles.optionButton}><Ionicons name="trash-outline" size={20} color="#FF3B30" /></TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!user) {
    return (<View style={styles.centerContent}><ActivityIndicator size="large" /><Text style={{ marginTop: 10 }}>Loading profile...</Text></View>)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}><View style={{ width: 24 }} /><Text style={styles.headerTitle}>Profile</Text><TouchableOpacity onPress={showSettings}><Ionicons name="settings-outline" size={24} color="#000000" /></TouchableOpacity></View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        <View style={styles.profileSection}><View style={styles.avatarContainer}><Image source={{ uri: user.image || 'https://via.placeholder.com/100' }} style={styles.avatar} contentFit="cover" /></View><Text style={styles.userName}>{user.name}</Text><Text style={styles.userEmail}>{user.email}</Text><TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit')}><Ionicons name="create-outline" size={16} color="#000000" /><Text style={styles.editButtonText}>Edit Profile</Text></TouchableOpacity></View>
        <View style={styles.statsSection}><View style={styles.statItem}><Text style={styles.statNumber}>{isLoading ? '-' : myProperties.length}</Text><Text style={styles.statLabel}>Properties</Text></View><View style={styles.statItem}><Text style={styles.statNumber}>{isLoading ? '-' : totalViews}</Text><Text style={styles.statLabel}>Total Views</Text></View><View style={styles.statItem}><Text style={styles.statNumber}>{savedProperties.length}</Text><Text style={styles.statLabel}>Saved</Text></View></View>
        <View style={styles.tabsContainer}>{["My Listings", "Saved"].map((tab) => (<TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}><Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text></TouchableOpacity>))}</View>
        <View style={styles.tabContent}>{activeTab === "My Listings" && (<View style={styles.listingsGrid}>{isLoading ? <ActivityIndicator /> : myProperties.length === 0 ? (<Text style={styles.emptyTabText}>You haven't listed any properties yet.</Text>) : (myProperties.map(prop => renderPropertyCard(prop, true)))}</View>)}{activeTab === "Saved" && (<View style={styles.listingsGrid}>{isLoading ? <ActivityIndicator /> : savedProperties.length === 0 ? (<Text style={styles.emptyTabText}>You haven't saved any properties yet.</Text>) : (savedProperties.map(prop => renderPropertyCard(prop, false)))}</View>)}</View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal visible={settingsVisible} transparent={true} animationType="none" onRequestClose={() => hideSettings()}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => hideSettings()}>
          <Animated.View style={[styles.settingsModal, { transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHandle} /><Text style={styles.modalTitle}>Settings</Text>
              <View style={styles.settingsOptions}>
                <TouchableOpacity style={styles.settingItem} onPress={() => { hideSettings(); router.push('/(admin)/dashboard'); }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#007AFF" />
                  <Text style={[styles.settingText, { color: "#007AFF" }]}>Admin Panel</Text>
                  <Ionicons name="chevron-forward" size={16} color="#888888" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem} onPress={() => { hideSettings(); router.push('/profile/edit'); }}><Ionicons name="person-outline" size={20} color="#000000" /><Text style={styles.settingText}>Edit Profile</Text><Ionicons name="chevron-forward" size={16} color="#888888" /></TouchableOpacity>
                <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={handleLogout}><Ionicons name="log-out-outline" size={20} color="#FF3B30" /><Text style={[styles.settingText, styles.logoutText]}>Logout</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.cancelButton} onPress={() => hideSettings()}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#000000" },
  content: { flex: 1 },
  profileSection: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 30 },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  userName: { fontSize: 24, fontWeight: "700", color: "#000000", marginBottom: 4 },
  userEmail: { fontSize: 16, color: "#888888", marginBottom: 20 },
  editButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 20 },
  editButtonText: { fontSize: 14, color: "#000000", marginLeft: 6, fontWeight: "500" },
  statsSection: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#F0F0F0" },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#000000", marginBottom: 4 },
  statLabel: { fontSize: 14, color: "#888888" },
  tabsContainer: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 20 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#000000" },
  tabText: { fontSize: 14, color: "#888888", fontWeight: "500" },
  activeTabText: { color: "#000000", fontWeight: "600" },
  tabContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  listingsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  listingCard: { width: (width - 60) / 2, marginBottom: 20, backgroundColor: "#ffffff", borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  listingImage: { width: "100%", height: 120, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  listingInfo: { padding: 12 },
  listingTitle: { fontSize: 14, fontWeight: "600", color: "#000000", marginBottom: 4 },
  listingPrice: { fontSize: 12, color: "#888888" },
  emptyTabText: { textAlign: 'center', width: '100%', marginTop: 20, color: '#888888' },
  bottomSpacing: { height: 100 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
  settingsModal: { backgroundColor: "#ffffff", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 40, minHeight: 300 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#000000", textAlign: "center", marginBottom: 30 },
  settingsOptions: { marginBottom: 20 },
  settingItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  settingText: { flex: 1, fontSize: 16, color: "#000000", marginLeft: 16 },
  logoutItem: { borderBottomWidth: 0, marginTop: 10 },
  logoutText: { color: "#FF3B30" },
  cancelButton: { backgroundColor: "#F0F0F0", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#000000" },
  optionsContainer: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: 4 },
  optionButton: { padding: 6 }
});