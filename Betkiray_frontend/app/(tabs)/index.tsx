import { useAppState } from "@/contexts/AppStateContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { BlurView } from 'expo-blur';
import { BANNER_IMAGES } from '@/data/mockData';
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
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto Scroll Logic for Banner
  useEffect(() => {
    // Start auto-scrolling
    scrollInterval.current = setInterval(() => {
      setHeroIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= BANNER_IMAGES.length) {
          heroRef.current?.scrollToIndex({ index: 0, animated: true }); // seamless-ish?
          // For essentially seamless, we'd need a duplicated list, but simple loop is usually fine for this stage
          return 0;
        } else {
          heroRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          return nextIndex;
        }
      });
    }, 4000) as any; // 4 seconds

    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, []);

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

    const categoryFiltered = (selectedCategory === "All" || selectedCategory === "ALL")
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
    return <Ionicons name={iconData.name as any} size={18} color={selectedCategory.toUpperCase() === category.toUpperCase() ? '#fff' : '#000'} />;
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
        <Image source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl} style={styles.cardImage} contentFit="cover" />

        {/* Badge */}
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{property.propertyType}</Text>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.cardSaveButton}
          onPress={(e) => { e.stopPropagation(); toggleSaved(property.id); }}
        >
          <Ionicons
            name={isSaved(property.id) ? "heart" : "heart-outline"}
            size={20}
            color={isSaved(property.id) ? "#FF3B30" : "#fff"}
          />
        </TouchableOpacity>

        {/* Glass Effect Overlay */}
        <BlurView intensity={30} tint="dark" style={styles.cardOverlay}>
          <Text style={styles.cardTitle} numberOfLines={2}>{property.title}</Text>
          <View style={styles.cardLocationRow}>
            <Ionicons name="location-sharp" size={12} color="#fff" />
            <Text style={styles.cardLocationText} numberOfLines={1}>{property.location}</Text>
          </View>
          <View style={styles.pricePill}>
            <Text style={styles.cardPrice}>{Number(property.price).toLocaleString()} / month</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderHeroSlide = ({ item }: { item: any }) => (
    <View style={styles.heroSlide}>
      <Image source={item} style={styles.heroImage} contentFit="cover" />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setLocationDropdownVisible(true)}
          >
            <Ionicons name="location-sharp" size={16} color="#fff" />
            <Text style={styles.locationPillText}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => setSearchVisible(true)}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTitleContainer}>

        </View>

        {/* Hero Carousel */}
        <View style={styles.heroContainer}>
          <FlatList
            ref={heroRef}
            data={BANNER_IMAGES}
            renderItem={renderHeroSlide}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollToIndexFailed={() => { }} // Fallback to avoid crash on rapid scroll
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
              setHeroIndex(index);
            }}
          />
          <View style={styles.heroPagination}>
            {BANNER_IMAGES.map((_, i) => (
              <View key={i} style={[styles.heroDot, heroIndex === i ? styles.heroDotActive : styles.heroDotInactive]} />
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
            {categories.map((category) => {
              const isActive = selectedCategory.toUpperCase() === category.toUpperCase();
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    isActive && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  {getCategoryIcon(category)}
                  <Text style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive
                  ]}>
                    {category === 'ALL' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              )
            })}
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

      {/* City Selection Modal - Bottom Sheet Style */}
      <Modal
        visible={locationDropdownVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLocationDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setLocationDropdownVisible(false)}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>Select City</Text>
            <ScrollView style={styles.bottomSheetScroll}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.locationOption, selectedCity === city && styles.locationOptionSelected]}
                  onPress={() => {
                    setSelectedCity(city);
                    setSelectedSubCity("All");
                    setLocationDropdownVisible(false);
                    // Check if city has subcities (mock logic: only Addis for now)
                    if (city === "Addis Ababa") {
                      setTimeout(() => setSubCityDropdownVisible(true), 300); // Wait for close animation
                    }
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
                  {selectedCity === city && <Ionicons name="checkmark" size={20} color="#000" style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sub-City Selection Modal - Bottom Sheet Style */}
      <Modal
        visible={subCityDropdownVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSubCityDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setSubCityDropdownVisible(false)}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>Select Sub-City ({selectedCity})</Text>
            <ScrollView style={styles.bottomSheetScroll}>
              {/* 'All' option is already in the array, so we map straight through */}
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
                  {selectedSubCity === subCity && <Ionicons name="checkmark" size={20} color="#000" style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
            <Text style={styles.searchTitle}>Search</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.searchInputContainer}>
            <TextInput style={styles.searchInput} placeholder="Search..." value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          <ScrollView style={styles.searchResults}>
            {filteredProperties.map(p => (
              <TouchableOpacity key={p.id} style={styles.searchResultItem} onPress={() => { setSearchVisible(false); router.push(`/property/${p.id}`); }}>
                <Text>{p.title}</Text>
              </TouchableOpacity>
            ))}
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
  scrollView: {
    flex: 1,
  },
  headerAppTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerTitleContainer: {
    marginTop: 10,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50, // Safe area
    paddingBottom: 4,
    backgroundColor: "#fff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 6,
  },
  locationPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#fff',
  },
  // Hero
  heroContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    height: 200,
  },
  heroSlide: {
    width: width - 32,
    height: 200,
    backgroundColor: "#ddd",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroTextOverlay: {
    position: "absolute",
    left: 20,
    top: 40,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#eee",
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroPagination: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  heroDot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  heroDotActive: {
    backgroundColor: "#fff",
    width: 20,
  },
  heroDotInactive: {
    backgroundColor: "rgba(255,255,255,0.5)",
    width: 6,
  },
  // Category
  categorySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  categoryList: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: "#000",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#000",
    marginLeft: 8,
    fontWeight: "600",
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
    height: 250, // Fixed height for consistency
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    position: 'relative',
    backgroundColor: '#fff',
  },
  cardLeft: {
    marginRight: 8,
  },
  cardRight: {
    marginLeft: 8,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  cardBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  cardSaveButton: {
    position: "absolute",
    top: 12,
    left: 12,
    // No background, just icon as per some overlay designs, or faint bg
  },

  // Glass Overlay
  cardOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    borderRadius: 16,
    overflow: "hidden",
    padding: 10,
    // Fallback for blur on Android if not working well:
    backgroundColor: "rgba(30,30,30,0.6)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  cardLocationText: {
    fontSize: 11,
    color: "#ddd",
    flex: 1,
  },
  pricePill: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },

  // Empty State etc
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

  // Modals... (omitted detailed modal styles for brevity, assume they exist or use previous if needed, but here we should keep them basic)
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end", // Align to bottom
  },
  bottomSheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: "70%",
    width: "100%",
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: "#000",
  },
  bottomSheetScroll: {
    paddingHorizontal: 20,
  },
  locationDropdown: {
    // Deprecated but kept to prevent breaks if used elsewhere
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
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888'
  }
});