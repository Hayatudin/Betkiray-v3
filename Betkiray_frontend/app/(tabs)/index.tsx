import { useAppState } from "@/contexts/AppStateContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
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
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

const cities = ["Addis Ababa", "Nekemt", "Jijiga", "Hawassa", "Shashemene", "Arba Minch", "Hosaina", "Jimma", "Mekele"] as const;
const addisAbabaSubCities = ["All", "Arada", "Bole", "Gullele", "Yeka", "Akaky Kaliti", "Kirkos", "Lideta", "Nifas Silk-Lafto", "Kolfe Keranio", "Lemi Kura"] as const;

// Category icons mapping
const categoryIcons: { [key: string]: { name: string; library: 'ionicons' | 'material' } } = {
  'ALL': { name: 'apps', library: 'ionicons' },
  'HOUSE': { name: 'home', library: 'ionicons' },
  'APARTMENT': { name: 'business', library: 'ionicons' },
  'OFFICE': { name: 'briefcase', library: 'ionicons' },
  'RETAIL': { name: 'storefront', library: 'ionicons' },
  'STUDIO': { name: 'cube', library: 'ionicons' },
  'WAREHOUSE': { name: 'archive', library: 'ionicons' },
};

// Hero slider data
const heroSlides = [
  {
    id: '1',
    title: 'Find Your Next Rental,\nInstantly',
    subtitle: 'Browse trusted local listings at your fingertips',
    gradient: ['#1a1a2e', '#16213e'],
  },
  {
    id: '2',
    title: 'Discover Your\nList Your Space',
    subtitle: 'Find tenants fast with our easy listing tools',
    gradient: ['#1a1a2e', '#16213e'],
  },
];

export default function HomeScreen() {
  const { allProperties, isSaved, toggleSaved, isLoading, error } = useAppState();
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<(typeof cities)[number]>("Addis Ababa");
  const [locationDropdownVisible, setLocationDropdownVisible] = useState(false);
  const [selectedSubCity, setSelectedSubCity] = useState<(typeof addisAbabaSubCities)[number]>("All");
  const [subCityDropdownVisible, setSubCityDropdownVisible] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef<FlatList>(null);

  const categories = useMemo(() => {
    if (!allProperties || allProperties.length === 0) return ["All"];
    const types = new Set(allProperties.map(p => p.propertyType.toUpperCase()).filter(Boolean));
    return ["All", ...Array.from(types)];
  }, [allProperties]);

  const filteredProperties = useMemo(() => {
    let propertiesToFilter = allProperties || [];
    let cityFiltered = propertiesToFilter.filter(p => p.city === selectedCity);

    if (selectedCity === "Addis Ababa" && selectedSubCity !== "All") {
      cityFiltered = cityFiltered.filter(p => p.subCity === selectedSubCity);
    }

    const categoryFiltered = selectedCategory === "All"
        ? cityFiltered
        : cityFiltered.filter(p => p.propertyType.toUpperCase() === selectedCategory.toUpperCase());

    if (!searchQuery.trim()) {
      return categoryFiltered;
    }
    return categoryFiltered.filter(
        p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             p.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProperties, selectedCity, selectedSubCity, selectedCategory, searchQuery]);

  const API_BASE_URL = api.defaults.baseURL;

  const getCategoryIcon = (category: string) => {
    const iconData = categoryIcons[category.toUpperCase()] || { name: 'ellipse', library: 'ionicons' };
    return <Ionicons name={iconData.name as any} size={18} color={selectedCategory.toUpperCase() === category.toUpperCase() ? '#fff' : '#666'} />;
  };

  const renderPropertyCard = (property: Property, index: number) => {
    const imageUrl = property.image || (property.media?.[0]?.mediaUrl ? `${API_BASE_URL}${property.media[0].mediaUrl}` : '');
    const isLeftColumn = index % 2 === 0;
    
    return (
      <TouchableOpacity 
        key={property.id} 
        style={[styles.propertyCard, isLeftColumn ? styles.cardLeft : styles.cardRight]} 
        onPress={() => router.push(`/property/${property.id}`)}
      >
        <View style={styles.cardImageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="cover" />
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{property.propertyType}</Text>
          </View>
          <TouchableOpacity 
            style={styles.cardSaveButton} 
            onPress={(e) => { e.stopPropagation(); toggleSaved(property.id); }}
          >
            <Ionicons 
              name={isSaved(property.id) ? "heart" : "heart-outline"} 
              size={16} 
              color={isSaved(property.id) ? "#FF3B30" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{property.title}</Text>
          <View style={styles.cardLocationRow}>
            <Ionicons name="location" size={12} color="#FF3B30" />
            <Text style={styles.cardLocationText} numberOfLines={1}>{property.location}</Text>
          </View>
          <Text style={styles.cardPrice}>
            {`${Number(property.price).toLocaleString()}/month`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeroSlide = ({ item }: { item: typeof heroSlides[0] }) => (
    <View style={styles.heroSlide}>
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>{item.title}</Text>
        <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading Properties...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="person-circle-outline" size={32} color="#000" />
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={() => setLocationDropdownVisible(true)}
          >
            <Text style={styles.locationText}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={16} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSearchVisible(true)}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Carousel */}
        <View style={styles.heroContainer}>
          <FlatList
            ref={heroRef}
            data={heroSlides}
            renderItem={renderHeroSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
              setHeroIndex(index);
            }}
          />
          <View style={styles.heroPagination}>
            {heroSlides.map((_, i) => (
              <View key={i} style={[styles.heroDot, heroIndex === i && styles.heroDotActive]} />
            ))}
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryList}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory.toUpperCase() === category.toUpperCase() && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                {getCategoryIcon(category)}
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory.toUpperCase() === category.toUpperCase() && styles.categoryChipTextActive
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Properties Grid */}
        <View style={styles.propertiesGrid}>
          {filteredProperties.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="home-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No properties found</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredProperties.map((property, index) => renderPropertyCard(property, index))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* City Selection Modal */}
      <Modal 
        visible={locationDropdownVisible} 
        animationType="fade" 
        transparent={true} 
        onRequestClose={() => setLocationDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={() => setLocationDropdownVisible(false)}
        >
          <View style={styles.locationDropdown}>
            <Text style={styles.dropdownTitle}>Select a City</Text>
            <ScrollView>
              {cities.map((city) => (
                <TouchableOpacity 
                  key={city} 
                  style={[styles.locationOption, selectedCity === city && styles.locationOptionSelected]} 
                  onPress={() => { 
                    setSelectedCity(city); 
                    setSelectedSubCity("All"); 
                    setLocationDropdownVisible(false); 
                    setSelectedCategory("All"); 
                  }}
                >
                  <Ionicons 
                    name="location" 
                    size={20} 
                    color={selectedCity === city ? "#000" : "#888"} 
                  />
                  <Text style={[
                    styles.locationOptionText,
                    selectedCity === city && styles.locationOptionTextSelected
                  ]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sub-City Selection Modal */}
      <Modal 
        visible={subCityDropdownVisible} 
        animationType="fade" 
        transparent={true} 
        onRequestClose={() => setSubCityDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={() => setSubCityDropdownVisible(false)}
        >
          <View style={styles.locationDropdown}>
            <Text style={styles.dropdownTitle}>Select a Sub City</Text>
            <ScrollView>
              {addisAbabaSubCities.map((subCity) => (
                <TouchableOpacity 
                  key={subCity} 
                  style={[styles.locationOption, selectedSubCity === subCity && styles.locationOptionSelected]} 
                  onPress={() => { 
                    setSelectedSubCity(subCity); 
                    setSubCityDropdownVisible(false); 
                  }}
                >
                  <Text style={[
                    styles.locationOptionText,
                    selectedSubCity === subCity && styles.locationOptionTextSelected
                  ]}>{subCity}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Search Modal */}
      <Modal 
        visible={searchVisible} 
        animationType="slide" 
        presentationStyle="pageSheet" 
        onRequestClose={() => setSearchVisible(false)}
      >
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setSearchVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.searchTitle}>Search Properties</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#888888" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search by title or location..." 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
              autoFocus 
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#888888" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={styles.searchResults}>
            {filteredProperties.length === 0 ? (
              <Text style={styles.noResultsText}>No results found.</Text>
            ) : (
              filteredProperties.map((p) => (
                <TouchableOpacity 
                  key={p.id} 
                  style={styles.searchResultItem} 
                  onPress={() => { 
                    setSearchVisible(false); 
                    router.push(`/property/${p.id}`); 
                  }}
                >
                  <Text style={styles.searchResultTitle}>{p.title}</Text>
                  <Text style={styles.searchResultLocation}>{p.location}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
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
  scrollView: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginRight: 4,
  },
  // Hero
  heroContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  heroSlide: {
    width: width - 32,
    height: 160,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  heroContent: {
    maxWidth: "70%",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
  },
  heroPagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  heroDotActive: {
    backgroundColor: "#000",
    width: 24,
  },
  // Category
  categorySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  categoryList: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryChipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontWeight: "500",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  // Properties Grid
  propertiesGrid: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  propertyCard: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardLeft: {
    marginRight: 8,
  },
  cardRight: {
    marginLeft: 8,
  },
  cardImageContainer: {
    position: "relative",
    height: 140,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  cardSaveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardLocationText: {
    fontSize: 11,
    color: "#888",
    marginLeft: 4,
    flex: 1,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: "#888",
  },
  bottomSpacing: {
    height: 100,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationDropdown: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    width: width * 0.85,
    maxHeight: "60%",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#000000",
  },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  locationOptionSelected: {
    backgroundColor: "#F0F0F0",
  },
  locationOptionText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 12,
  },
  locationOptionTextSelected: {
    color: "#000",
    fontWeight: "600",
  },
  // Search Modal
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
  noResultsText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
  },
  searchResultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchResultTitle: {
    fontWeight: "600",
    color: "#000",
    fontSize: 15,
  },
  searchResultLocation: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
});