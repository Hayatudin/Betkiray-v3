// Betkiray/app/property/[id].tsx (Corrected)

import { useAppState } from "@/contexts/AppStateContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker } from "@/components/ui/MapView";
import api from "@/config/api";
import { useUser } from "@/contexts/UserContext";

const { width, height } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = Math.round(height * 0.4);
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

type PropertyDetail = {
  id: number;
  title: string;
  description: string | null;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  price: number;
  billingPeriod: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number | null;
  isFurnished: boolean;
  isNegotiable: boolean;
  includeUtilities: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    image: string | null;
  };
  media: {
    mediaUrl: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
      name: string;
      image: string | null;
    };
  }[];
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Number(id);
  const [newRating, setNewRating] = useState(0);
  

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedTab, setSelectedTab] = useState<"Details" | "Features" | "Reviews">("Details");

  const { isSaved, toggleSaved } = useAppState();
  const { user } = useUser();
  const [newReview, setNewReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = api.defaults.baseURL;

  const fetchProperty = async () => {
    if (!propertyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/properties/${propertyId}`);
      setProperty(response.data);
    } catch (err) {
      setError("Failed to load property details. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // This effect runs only when the `property` state has been successfully populated.
    // It checks if the viewer is the owner.
    if (property && user && user.id !== property.owner.id) {
      const recordView = async () => {
        try {
          // We use property.id from the fetched data to be safe.
          await api.patch(`/properties/${property.id}/view`);
          console.log(`View recorded for property ${property.id}`);
        } catch (error) {
          console.error("Failed to record property view:", error);
        }
      };

      recordView();
    }
  }, [property, user]);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);
  
  const handleCall = () => {
    if (property?.owner?.phone) {
      const phoneNumber = Platform.OS === 'android' ? `tel:${property.owner.phone}` : `telprompt:${property.owner.phone}`;
      Linking.openURL(phoneNumber).catch(() => Alert.alert("Error", "Could not open the phone app."));
    } else {
      Alert.alert("No Phone Number", "The owner has not provided a phone number.");
    }
  };

  const handleChat = () => {
    if (!user) {
      return Alert.alert('Authentication Required', 'Please sign in to chat with the owner.');
    }
    if (property) {
      router.push(`/chat/${property.owner.id}`);
    }
  };
  
  const handlePostReview = async () => {
    if (!user) {
      return Alert.alert('Authentication Required', 'Please sign in to post a review.');
    }
    // --- THIS IS THE NEW VALIDATION ---
    if (newRating === 0) {
      return Alert.alert('Rating Required', 'Please select a star rating before posting.');
    }
    if (!property || newReview.trim() === '') {
      return Alert.alert('Invalid Input', 'Please write a comment before posting.');
    }
  
    setIsSubmitting(true);
    try {
      await api.post(`/reviews/property/${property.id}`, {
        comment: newReview,
        // --- THIS IS THE FIX ---
        rating: newRating, // Send the dynamic rating from state
      });
      Alert.alert('Success', 'Your review has been submitted!');
      // Reset both the comment and the rating
      setNewReview('');
      setNewRating(0);
      fetchProperty(); // Refresh to see the new review
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Could not submit your review.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Property not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- NEW: Check if the current user is the owner of the property ---
  const isOwner = user?.id === property.owner.id;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: "clamp",
  });

  const propertyImages = property.media.map(
    (m) => `${API_BASE_URL}${m.mediaUrl}`
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <FlatList
          data={propertyImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, idx) => `${uri}-${idx}`}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveImageIndex(index);
          }}
          renderItem={({ item: uri }) => (
            <View style={styles.carouselSlide}>
              <Image
                source={{ uri }}
                style={styles.headerImage}
                contentFit="cover"
              />
            </View>
          )}
        />
        <View style={styles.carouselIndicators}>
          {propertyImages.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeImageIndex && styles.activeDot]}
            />
          ))}
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => toggleSaved(property.id)}
          >
            <Ionicons
              name={isSaved(property.id) ? "bookmark" : "bookmark-outline"}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.contentContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#FF3B30" />
            <Text style={styles.locationText}>{property.address}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${property.price}</Text>
            <Text style={styles.period}>
              /{property.billingPeriod.toLowerCase()}
            </Text>
          </View>
        </View>
        <View style={styles.tabContainer}>
          {(["Details", "Features", "Reviews"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tabContent}>
          {selectedTab === "Details" && (
            <View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>
                  {property.description || "No description provided."}
                </Text>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.mapContainer}>
                  <MapView
                    style={StyleSheet.absoluteFill}
                    initialRegion={{
                      latitude: property.latitude,
                      longitude: property.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: property.latitude,
                        longitude: property.longitude,
                      }}
                      title={property.title}
                      description={property.address}
                    />
                  </MapView>
                </View>
              </View>
            </View>
          )}
          {selectedTab === "Features" && (
            <View style={styles.featuresContainer}>
              <View style={styles.featuresGrid}>
                <View style={styles.featureCard}>
                  <Ionicons name="bed-outline" size={32} color="#666666" />
                  <Text style={styles.featureCardText}>
                    {property.bedrooms} Bedroom{property.bedrooms > 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.featureCard}>
                  <Ionicons name="water-outline" size={32} color="#666666" />
                  <Text style={styles.featureCardText}>
                    {property.bathrooms} Bathroom{property.bathrooms > 1 ? "s" : ""}
                  </Text>
                </View>
                {property.areaSqm && (
                  <View style={styles.featureCard}>
                    <Ionicons name="resize-outline" size={32} color="#666666" />
                    <Text style={styles.featureCardText}>{property.areaSqm} m²</Text>
                  </View>
                )}
                <View style={styles.featureCard}>
                  <Ionicons name="home-outline" size={32} color="#666666" />
                  <Text style={styles.featureCardText}>
                    {property.isFurnished ? "Furnished" : "Unfurnished"}
                  </Text>
                </View>
              </View>
            </View>
          )}
          {selectedTab === "Reviews" && (
            <View style={styles.reviewsContainer}>
              {property.reviews.length === 0 ? (
                <Text>No reviews yet.</Text>
              ) : (
                property.reviews.map((r) => (
                  <View key={r.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerAvatar}>
                          <Text style={styles.reviewerInitial}>
                            {r.user.name.charAt(0)}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewerName}>{r.user.name}</Text>
                          <View style={styles.ratingContainer}>
                            <View style={styles.starsContainer}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                  key={star}
                                  name={star <= r.rating ? "star" : "star-outline"}
                                  size={16}
                                  color="#FFD700"
                                />
                              ))}
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{r.comment}</Text>
                  </View>
                ))
              )}

              {/* --- CHANGE: Conditionally render the "Add Review" section --- */}
              {!isOwner && (
  <View style={styles.addReviewSection}>
    {/* --- THIS IS THE NEW STAR RATING COMPONENT --- */}
    <Text style={styles.ratingLabel}>Your Rating</Text>
    <View style={styles.addRatingContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
          <Ionicons
            name={star <= newRating ? "star" : "star-outline"}
            size={30}
            color="#FFD700"
          />
        </TouchableOpacity>
      ))}
    </View>
    {/* --- END OF NEW COMPONENT --- */}

    <View style={styles.addReviewContainer}>
      <View style={styles.addReviewInputWrapper}>
        <Ionicons name="chatbubble-outline" size={18} color="#888" />
        <TextInput
          style={styles.newReviewInput}
          placeholder="Add a review..."
          value={newReview}
          onChangeText={setNewReview}
          multiline
          numberOfLines={3}
        />
      </View>
      <TouchableOpacity
        style={[styles.submitReviewButton, isSubmitting && { backgroundColor: '#A9A9A9' }]}
        onPress={handlePostReview}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitReviewText}>Post</Text>}
      </TouchableOpacity>
    </View>
  </View>
)}
            </View>
          )}
        </View>
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* --- CHANGE: Conditionally render the bottom action buttons --- */}
      {!isOwner && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#ffffff" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
            <Ionicons name="chatbubble-outline" size={20} color="#000000" />
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// STYLES ARE UNCHANGED FROM YOUR ORIGINAL FILE
const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  addReviewSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  addRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#444444",
    marginBottom: 12,
    textAlign: "center",
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#000000",
  },
  backBtnText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000000",
    overflow: "hidden",
    zIndex: 100,
    elevation: 10,
  },
  carouselSlide: {
    width,
    height: HEADER_MAX_HEIGHT,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerControls: {
    position: "absolute",
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 48,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselIndicators: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  activeDot: {
    backgroundColor: "#ffffff",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contentContainer: {
    marginTop: HEADER_MAX_HEIGHT,
    backgroundColor: "#ffffff",
  },
  propertyInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  locationRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#666666",
  },
  priceRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  period: {
    marginLeft: 4,
    marginBottom: 2,
    fontSize: 14,
    color: "#666666",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  activeTab: {
    backgroundColor: "#000000",
  },
  tabText: {
    fontSize: 14,
    color: "#000000",
  },
  activeTabText: {
    color: "#ffffff",
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444444",
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  featuresContainer: {
    marginTop: 8,
  },
  featuresGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    marginBottom: 12,
  },
  featureCardText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666666",
  },
  reviewsContainer: {
    marginTop: 8,
  },
  reviewItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#ffffff",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reviewerInitial: {
    color: "#ffffff",
    fontWeight: "700",
  },
  reviewerName: {
    fontWeight: "600",
    color: "#000000",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  reviewText: {
    marginTop: 8,
    color: "#444444",
    lineHeight: 20,
  },
  bottomActions: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  callButtonText: {
    marginLeft: 8,
    color: "#ffffff",
    fontWeight: "600",
  },
  chatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chatButtonText: {
    marginLeft: 8,
    color: "#000000",
    fontWeight: "600",
  },
  addReviewContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addReviewInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  newReviewInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
    color: "#000",
  },
  submitReviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  submitReviewText: {
    color: "#fff",
    fontWeight: "600",
  },
});