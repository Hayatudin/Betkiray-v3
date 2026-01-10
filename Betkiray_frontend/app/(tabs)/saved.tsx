import { useAppState } from "@/contexts/AppStateContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import api from "@/config/api"; // Import api config for the base URL

export default function SavedScreen() {
  // --- CHANGE: Consume savedProperties directly, no more filtering ---
  const { savedProperties, toggleSaved } = useAppState();
  const API_BASE_URL = api.defaults.baseURL;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Properties</Text>
      </View>
      {savedProperties.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={48} color="#888888" />
          <Text style={styles.emptyText}>No saved properties yet</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {savedProperties.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => router.push(`/property/${p.id}`)}
            >
              {/* --- CHANGE: Correctly construct the image URL --- */}
              <Image
                source={{ uri: `${API_BASE_URL}${p.media?.[0]?.mediaUrl}` }}
                style={styles.image}
                contentFit="cover"
              />
              <View style={styles.info}>
                <Text style={styles.title}>{p.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#FF3B30" />
                  <Text style={styles.location}>{p.location}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="bed-outline" size={14} color="#888888" />
                    {/* --- CHANGE: Use correct field names from API --- */}
                    <Text style={styles.detailText}>{p.bedrooms} beds</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="resize-outline" size={14} color="#888888" />
                    <Text style={styles.detailText}>{p.areaSqm} m²</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <Text style={styles.price}>${p.price}</Text>
                  <Text style={styles.period}>/ {p.billingPeriod.toLowerCase()}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.unbookmark}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleSaved(p.id);
                }}
              >
                <Ionicons name="bookmark" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
}

// --- UPDATED STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#888888",
    fontSize: 16,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    height: 200,
    width: "100%",
  },
  info: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: "#888888",
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#888888",
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  period: {
    fontSize: 14,
    color: "#888888",
  },
  unbookmark: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSpacing: {
    height: 20,
  },
});