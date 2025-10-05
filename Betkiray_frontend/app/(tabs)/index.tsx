// Betkiray/app/(tabs)/index.tsx (Definitive Fix)

import { useAppState } from "@/contexts/AppStateContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "@/config/api";
import { Property } from "@/types";

const { width } = Dimensions.get("window");

const cities = ["Addis Ababa", "Nekemt", "Jijiga", "Hawassa", "Shashemene", "Arba Minch", "Hosaina", "Jimma", "Mekele"] as const;

export default function HomeScreen() {
  const { allProperties, isSaved, toggleSaved, isLoading, error } = useAppState();
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<(typeof cities)[number]>("Addis Ababa");
  const [locationDropdownVisible, setLocationDropdownVisible] = useState(false);

  // --- GUARANTEED FIX #1: Generate categories directly from the loaded data ---
  const categories = useMemo(() => {
    if (!allProperties || allProperties.length === 0) return ["All"];
    // This creates a list of unique, uppercase property types from your actual data
    const types = new Set(allProperties.map(p => p.propertyType.toUpperCase()).filter(Boolean));
    return ["All", ...Array.from(types)];
  }, [allProperties]);

  // --- GUARANTEED FIX #2: A simplified and robust filtering logic ---
  const filteredProperties = useMemo(() => {
    let propertiesToFilter = allProperties || [];

    // 1. Filter by City
    const cityFiltered = propertiesToFilter.filter(p => p.city === selectedCity);

    // 2. Filter by Category
    const categoryFiltered = selectedCategory === "All"
        ? cityFiltered // If 'All' is selected, skip this filter
        : cityFiltered.filter(p => p.propertyType.toUpperCase() === selectedCategory.toUpperCase());

    // 3. Filter by Search Query
    if (!searchQuery.trim()) {
      return categoryFiltered; // If no search, return the result
    }
    const searchFiltered = categoryFiltered.filter(
        p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             p.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return searchFiltered;
  }, [allProperties, selectedCity, selectedCategory, searchQuery]);

  const API_BASE_URL = api.defaults.baseURL;

  const renderPropertyCard = (property: Property) => {
    const imageUrl = property.image || (property.media?.[0]?.mediaUrl ? `${API_BASE_URL}${property.media[0].mediaUrl}` : '');
    return (
        <TouchableOpacity key={property.id} style={styles.propertyCard} onPress={() => router.push(`/property/${property.id}`)}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.propertyImage} contentFit="cover" />
                <View style={styles.typeBadge}><Text style={styles.typeText}>{property.propertyType}</Text></View>
                <TouchableOpacity style={styles.saveButton} onPress={(e) => { e.stopPropagation(); toggleSaved(property.id); }}>
                    <Ionicons name={isSaved(property.id) ? "heart" : "heart-outline"} size={20} color={isSaved(property.id) ? "#FF3B30" : "#ffffff"} />
                </TouchableOpacity>
            </View>
            <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#FF3B30" />
                    <Text style={styles.locationText} numberOfLines={1}>{property.location}</Text>
                </View>
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}><Ionicons name="bed-outline" size={14} color="#888888" /><Text style={styles.detailText}>{property.bedrooms} beds</Text></View>
                    <View style={styles.detailItem}><Ionicons name="resize-outline" size={14} color="#888888" /><Text style={styles.detailText}>{property.areaSqm} m²</Text></View>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>{`$${property.price}`}</Text>
                    <Text style={styles.period}>/ {property.billingPeriod?.toLowerCase()}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
  };

  if (isLoading) {
      return (<View style={[styles.container, styles.centerContent]}><ActivityIndicator size="large" color="#000000" /><Text style={styles.loadingText}>Loading Properties...</Text></View>);
  }

  if (error) {
      return (<View style={[styles.container, styles.centerContent]}><Text style={styles.errorText}>{error}</Text></View>);
  }

  return (
      <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <View style={styles.header}>
              <TouchableOpacity style={styles.locationHeader} onPress={() => setLocationDropdownVisible(true)}>
                  <Ionicons name="location-outline" size={20} color="#888888" />
                  <Text style={styles.locationHeaderText}>{selectedCity}</Text>
                  <Ionicons name="chevron-down-outline" size={16} color="#888888" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchButton} onPress={() => setSearchVisible(true)}>
                  <Ionicons name="search-outline" size={20} color="#888888" />
              </TouchableOpacity>
          </View>
          <Modal visible={locationDropdownVisible} animationType="fade" transparent={true} onRequestClose={() => setLocationDropdownVisible(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setLocationDropdownVisible(false)}>
                  <View style={styles.locationDropdown}>
                      <Text style={styles.dropdownTitle}>Select a City</Text>
                      {cities.map((city) => (<TouchableOpacity key={city} style={styles.locationOption} onPress={() => { setSelectedCity(city); setLocationDropdownVisible(false); setSelectedCategory("All"); }}><Text style={styles.locationOptionText}>{city}</Text></TouchableOpacity>))}
                  </View>
              </TouchableOpacity>
          </Modal>
          <Modal visible={searchVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSearchVisible(false)}>
              <View style={styles.searchModal}>
                  <View style={styles.searchHeader}>
                      <TouchableOpacity onPress={() => setSearchVisible(false)} style={styles.closeButton}><Ionicons name="close" size={24} color="#000000" /></TouchableOpacity>
                      <Text style={styles.searchTitle}>Search Properties</Text>
                      <View style={{ width: 24 }} />
                  </View>
                  <View style={styles.searchInputContainer}>
                      <Ionicons name="search-outline" size={20} color="#888888" />
                      <TextInput style={styles.searchInput} placeholder="Search by title or location..." value={searchQuery} onChangeText={setSearchQuery} autoFocus />
                      {searchQuery.length > 0 && (<TouchableOpacity onPress={() => setSearchQuery("")}><Ionicons name="close-circle" size={20} color="#888888" /></TouchableOpacity>)}
                  </View>
                  <ScrollView style={styles.searchResults}>
                      {filteredProperties.length === 0 ? (<Text>No results found.</Text>) : (filteredProperties.map((p) => (
                          <TouchableOpacity key={p.id} style={{ paddingVertical: 12 }} onPress={() => { setSearchVisible(false); router.push(`/property/${p.id}`); }}>
                              <Text style={{ fontWeight: "600", color: "#000" }}>{p.title}</Text>
                              <Text style={{ color: "#666" }}>{p.location}</Text>
                          </TouchableOpacity>
                      )))}
                  </ScrollView>
              </View>
          </Modal>
          <View style={styles.categoryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollView}>
                  {categories.map((category) => (
                      <TouchableOpacity key={category} style={[styles.categoryTab, selectedCategory.toUpperCase() === category.toUpperCase() && styles.activeCategoryTab,]} onPress={() => setSelectedCategory(category)}>
                          <Text style={[styles.categoryText, selectedCategory.toUpperCase() === category.toUpperCase() && styles.activeCategoryText,]}>{category}</Text>
                      </TouchableOpacity>
                  ))}
              </ScrollView>
          </View>
          <ScrollView style={styles.propertyList} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propertyListContent}>
              {filteredProperties.length === 0 ? (<View style={styles.centerContent}><Text>No properties found for this category.</Text></View>) : (filteredProperties.map(renderPropertyCard))}
              <View style={styles.bottomSpacing} />
          </ScrollView>
      </View>
  );
}

// Styles are unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#888888",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationHeaderText: {
    fontSize: 16,
    color: "#000000",
    marginLeft: 8,
    marginRight: 4,
    fontWeight: "500",
  },
  searchButton: {
    padding: 8,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryScrollView: {
    paddingRight: 20,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  activeCategoryTab: {
    backgroundColor: "#000000",
  },
  categoryText: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
    textTransform: 'capitalize',
  },
  activeCategoryText: {
    color: "#ffffff",
  },
  propertyList: {
    flex: 1,
  },
  propertyListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  propertyCard: {
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
  },
  imageContainer: {
    position: "relative",
  },
  propertyImage: {
    width: "100%",
    height: 250,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    textTransform: 'capitalize',
  },
  saveButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
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
  locationText: {
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
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
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
  bottomSpacing: {
    height: 100,
  },
  searchModal: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    padding: 4,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    marginLeft: 12,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationDropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
    color: "#000000",
  },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedLocationOption: {
    backgroundColor: '#f0f0f0'
  },
  locationOptionText: {
    fontSize: 16,
    color: "#888888",
    marginLeft: 12,
    flex: 1,
  },
});