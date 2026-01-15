import { useAppState } from "@/contexts/AppStateContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from "react-native";
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import LeafletMapView from "@/components/ui/LeafletMapView";
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get("window");

const cities = ["Addis Ababa", "Nekemt", "Jijiga", "Hawassa", "Shashemene", "Arba Minch", "Hosaina", "Jimma", "Mekele"] as const;
type City = typeof cities[number];
const addisAbabaSubCities = ["Arada", "Bole", "Gullele", "Yeka", "Akaky Kaliti", "Kirkos", "Lideta", "Nifas Silk-Lafto", "Kolfe Keranio", "Lemi Kura"] as const;
type AddisAbabaSubCity = typeof addisAbabaSubCities[number];


export default function AddScreen() {
  const { addProperty } = useAppState();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [photos, setPhotos] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [isRecording, setIsRecording] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"House" | "Apartment" | "Office" | "Retail" | "Studio" | "Warehouse">("House");
  const [rooms, setRooms] = useState(1);
  const [baths, setBaths] = useState(1);
  const [furnished, setFurnished] = useState(false);
  const [areaSqm, setAreaSqm] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [includeUtilities, setIncludeUtilities] = useState(false);
  const [coords, setCoords] = useState({ lat: 9.03, lng: 38.75 });
  const [address, setAddress] = useState("");
  const [city, setCity] = useState<City>("Addis Ababa");
  const [subCity, setSubCity] = useState<AddisAbabaSubCity | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [cityDropdownVisible, setCityDropdownVisible] = useState(false);
  const [subCityDropdownVisible, setSubCityDropdownVisible] = useState(false);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastAnim = useRef(new Animated.Value(100)).current;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true })
    ]).start(() => setToast(null));
  };

  // Normalize Ethiopian phone numbers
  const normalizePhoneNumber = (phoneNumber: string): string => {
    const cleaned = phoneNumber.trim().replace(/\s+/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
      return '+251' + cleaned.substring(1);
    }
    return cleaned;
  };

  const resetForm = () => {
    setStep(1); setIsSubmitting(false); setPhotos([]); setImageErrors([]); setAudioUri(null);
    setTitle(""); setDescription(""); setPhone(""); setType("House"); setRooms(1); setBaths(1);
    setFurnished(false); setAreaSqm(""); setPrice(""); setNegotiable(false);
    setIncludeUtilities(false); setCoords({ lat: 9.03, lng: 38.75 }); setAddress("");
    setCity("Addis Ababa"); setSubCity(null);
  };

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status === "granted") {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording); setIsRecording(true);
      } else { showToast("Microphone permission is required to record audio.", 'error'); }
    } catch (err) { console.error("Failed to start recording", err); showToast("Could not start recording.", 'error'); }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false); await recording.stopAndUnloadAsync();
    setAudioUri(recording.getURI()); setRecording(undefined);
  }

  const removeAudio = () => setAudioUri(null);

  const pickImage = async () => {
    try {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        const total = photos.length + newImages.length;
        if (total > 3) {
          const limit = 3 - photos.length;
          showToast(`You can only add ${limit} more image(s).`, 'error');
          setPhotos(prev => [...prev, ...newImages.slice(0, limit)]);
        } else { setPhotos(prev => [...prev, ...newImages]); }
        setImageErrors([]);
      }
    } catch (error) { showToast("Failed to pick images.", 'error'); }
  };

  const removeImage = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1: if (photos.length !== 3) { setImageErrors([`Please upload exactly 3 images`]); return false; } setImageErrors([]); return true;
      case 2: if (!title.trim() || !description.trim() || !phone.trim()) { showToast("Title, description, and phone are required.", 'error'); return false; } return true;
      case 3: if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) { showToast("Please enter a valid price.", 'error'); return false; } return true;
      case 4: if (!address.trim() || !city.trim()) { showToast("Address and city must be set from the map.", 'error'); return false; } if (city === "Addis Ababa" && !subCity) { showToast("Sub-city is required for Addis Ababa.", 'error'); return false; } return true;
      default: return true;
    }
  };

  const goNext = () => { if (validateStep(step)) setStep(s => Math.min(4, s + 1)); };
  const goBack = () => setStep(s => Math.max(1, s - 1));

  const postProperty = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('phone', normalizePhoneNumber(phone));
    formData.append('address', address.trim());
    formData.append('city', city);
    if (city === "Addis Ababa" && subCity) { formData.append('subCity', subCity); }
    formData.append('latitude', String(coords.lat));
    formData.append('longitude', String(coords.lng));
    formData.append('price', price);
    formData.append('billingPeriod', "MONTHLY");
    formData.append('propertyType', type.toUpperCase());
    formData.append('bedrooms', String(rooms));
    formData.append('bathrooms', String(baths));
    formData.append('isFurnished', String(furnished));
    formData.append('isNegotiable', String(negotiable));
    formData.append('includeUtilities', String(includeUtilities));
    formData.append('areaSqm', areaSqm);
    photos.forEach(photoUri => { const parts = photoUri.split('.'); const type = parts[parts.length - 1]; formData.append('images', { uri: photoUri, name: `photo.${type}`, type: `image/${type}` } as any); });
    if (audioUri) { formData.append('audio', { uri: audioUri, name: `audio.m4a`, type: 'audio/m4a' } as any); }
    try {
      await addProperty(formData);
      showToast("Property submitted! It will be reviewed and approved by our admins shortly.", 'success');
      setTimeout(() => { resetForm(); router.replace('/(tabs)'); }, 2500);
    } catch (error: any) {
      const messages = error.response?.data?.message || "An error occurred.";
      showToast(Array.isArray(messages) ? messages.join('\n') : String(messages), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAddressFromCoords = async (latitude: number, longitude: number) => {
    setIsGeocoding(true);
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result.length > 0) {
        const geo = result[0];
        const fetchedCity = geo.city;
        if (fetchedCity && cities.includes(fetchedCity as City)) {
          setCity(fetchedCity as City);
          if (fetchedCity === 'Addis Ababa') {
            const fetchedSubCity = geo.subregion || geo.district;
            if (fetchedSubCity && addisAbabaSubCities.includes(fetchedSubCity as AddisAbabaSubCity)) {
              setSubCity(fetchedSubCity as AddisAbabaSubCity);
            } else { setSubCity(null); }
          } else { setSubCity(null); }
        }
        const addressParts = [geo.name, geo.street, geo.district, geo.subregion, geo.city, geo.region, geo.postalCode, geo.country].filter(p => p && p !== geo.name);
        setAddress([...new Set(addressParts)].join(', ') || geo.name || '');
      }
    } catch (error) {
      showToast("Could not fetch address. Please check connection.", 'error');
      setAddress("");
    }
    finally { setIsGeocoding(false); }
  };

  const useMyLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission is required to use this feature.', 'error');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCoords({ lat: latitude, lng: longitude });
      await fetchAddressFromCoords(latitude, longitude);
      showToast('Location fetched successfully!', 'success');
    } catch (error) {
      showToast('Could not fetch your location. Please try again.', 'error');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const handleMapSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsGeocoding(true);
    try {
      const geocodedLocation = await Location.geocodeAsync(searchQuery);
      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        setCoords({ lat: latitude, lng: longitude });
        await fetchAddressFromCoords(latitude, longitude);
        showToast("Location found!", 'success');
      } else {
        showToast("Location not found.", 'error');
      }
    } catch (error) {
      showToast("Error searching location.", 'error');
    } finally {
      setIsGeocoding(false);
    }
  };

  const StepHeader = ({ step }: { step: number }) => (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => step > 1 ? goBack() : router.back()}>
        <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <Text style={styles.stepIndicator}>Step {step} of 4</Text>
        <View style={styles.progressRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.progressSegment, step >= i ? styles.progressActive : styles.progressInactive]} />
          ))}
        </View>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.safeArea}>
        <StepHeader step={step} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {step === 1 && (
          <View style={styles.stepBody}>
            <Text style={styles.mainTitle}>Upload Photos of Your Property</Text>

            <View style={styles.photoGrid}>
              <TouchableOpacity
                style={[styles.photoMainSlot, photos[0] ? styles.slotFilled : styles.slotEmpty]}
                onPress={pickImage}
              >
                {photos[0] ? (
                  <>
                    <Image source={{ uri: photos[0] }} style={styles.slotImage} />
                    <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(0)}>
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.placeholderContent}>
                    <Ionicons name="image-outline" size={32} color="#000" />
                    <View style={styles.plusBadge}><Ionicons name="add" size={10} color="#fff" /></View>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.photoColRight}>
                {[1, 2].map((i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.photoSmallSlot, photos[i] ? styles.slotFilled : styles.slotEmpty]}
                    onPress={pickImage}
                  >
                    {photos[i] ? (
                      <>
                        <Image source={{ uri: photos[i] }} style={styles.slotImage} />
                        <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(i)}>
                          <Ionicons name="close-circle" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.placeholderContent}>
                        <Ionicons name="image-outline" size={20} color="#000" />
                        <View style={styles.plusBadgeSmall}><Ionicons name="add" size={8} color="#fff" /></View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.videoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="videocam" size={24} color="#999" />
                <Text style={styles.videoText}>Add Video (Optional)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            {/* Title */}
            <View style={styles.cardContainer}>
              <Text style={styles.labelLight}>Property Title</Text>
              <TextInput
                placeholder="Enter property title"
                placeholderTextColor="#A0A0A0"
                value={title}
                onChangeText={setTitle}
                style={styles.inputClean}
              />
            </View>

            {/* Description */}
            <View style={[styles.cardContainer, { marginTop: 12, height: 140 }]}>
              <Text style={styles.labelLight}>Description</Text>
              <TextInput
                placeholder="Tell us about you property..."
                placeholderTextColor="#A0A0A0"
                value={description}
                onChangeText={setDescription}
                style={[styles.inputClean, { height: '80%', textAlignVertical: 'top' }]}
                multiline
                maxLength={500}
              />
            </View>

            {/* Voice Input */}
            <TouchableOpacity style={styles.voiceButton} onPress={isRecording ? stopRecording : startRecording}>
              {isRecording ? (
                <View style={styles.voiceContent}>
                  <ActivityIndicator size="small" color="#FF5C5C" />
                  <Text style={[styles.voiceText, { color: '#FF5C5C' }]}>Recording... Tap to stop</Text>
                </View>
              ) : (
                <View style={styles.voiceContent}>
                  <Ionicons name="mic-outline" size={20} color="#A0A0A0" />
                  <Text style={styles.voiceText}>Tap to add description by voice</Text>
                  <Ionicons name="cellular-outline" size={20} color="#E0E0E0" />
                </View>
              )}
            </TouchableOpacity>

            {/* Property Type */}
            <View style={styles.cardContainer}>
              <Text style={styles.sectionHeader}>Preperty Type</Text>
              <View style={styles.typeRow}>
                {(["House", "Apartment", "Office", "MarketPlace"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeChipClean,
                      type === t || (t === "MarketPlace" && type === "Retail") ? styles.typeChipActiveClean : null
                    ]}
                    onPress={() => setType(t === "MarketPlace" ? "Retail" : t as any)}
                  >
                    <Text style={[
                      styles.typeChipTextClean,
                      type === t || (t === "MarketPlace" && type === "Retail") ? styles.typeChipTextActiveClean : null
                    ]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rooms */}
            <View style={styles.cardContainer}>
              <Text style={styles.sectionHeader}>Rooms</Text>

              <View style={styles.roomRow}>
                <Text style={styles.roomLabel}>Bedrooms</Text>
                <View style={styles.counterWrapper}>
                  <TouchableOpacity style={styles.counterBtnSmall} onPress={() => setRooms(v => Math.max(1, v - 1))}>
                    <Ionicons name="remove" size={16} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.counterValSmall}>{rooms}</Text>
                  <TouchableOpacity style={styles.counterBtnSmall} onPress={() => setRooms(v => v + 1)}>
                    <Ionicons name="add" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.roomRow}>
                <Text style={styles.roomLabel}>Bathrooms</Text>
                <View style={styles.counterWrapper}>
                  <TouchableOpacity style={styles.counterBtnSmall} onPress={() => setBaths(v => Math.max(0, v - 1))}>
                    <Ionicons name="remove" size={16} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.counterValSmall}>{baths}</Text>
                  <TouchableOpacity style={styles.counterBtnSmall} onPress={() => setBaths(v => v + 1)}>
                    <Ionicons name="add" size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Furnished */}
            <View style={styles.furnishedContainer}>
              <Text style={styles.sectionHeader}>Furnished</Text>
              <Switch
                value={furnished}
                onValueChange={setFurnished}
                trackColor={{ false: "#E0E0E0", true: "#000" }}
                thumbColor={"#fff"}
              />
            </View>

          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            {/* Price Card */}
            <View style={styles.inputCard}>
              <Text style={styles.cardLabel}>Listing Price</Text>
              <View style={styles.priceRow}>
                <TextInput
                  placeholder="Enter property Price"
                  placeholderTextColor="#C7C7CC"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  style={styles.priceInput}
                />
                <Text style={styles.priceSuffix}>/month</Text>
              </View>
              <View style={styles.inputUnderline} />
            </View>

            {/* Negotiable Card */}
            <View style={styles.toggleCard}>
              <Text style={styles.toggleLabel}>Negotiable</Text>
              <Switch
                value={negotiable}
                onValueChange={setNegotiable}
                trackColor={{ false: "#E9E9EA", true: "#000" }}
                thumbColor={"#fff"}
                ios_backgroundColor="#E9E9EA"
              />
            </View>

            {/* Utilities Card */}
            <View style={styles.toggleCard}>
              <Text style={styles.toggleLabel}>Include Utilities</Text>
              <Switch
                value={includeUtilities}
                onValueChange={setIncludeUtilities}
                trackColor={{ false: "#E9E9EA", true: "#000" }}
                thumbColor={"#fff"}
                ios_backgroundColor="#E9E9EA"
              />
            </View>

            {/* Service Fee Card */}
            <View style={styles.toggleCard}>
              <Text style={[styles.toggleLabel, { color: '#8E8E93', fontWeight: '400' }]}>Listing Service Fee(10%)</Text>
              <Text style={[styles.toggleLabel, { color: '#8E8E93', fontWeight: '400' }]}>
                {Math.round((Number(price) || 0) * 0.1)}
              </Text>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Location & Contact</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Contact Phone Number *</Text>
              <TextInput placeholder="+251 91 123 4567" value={phone} onChangeText={setPhone} style={[styles.input, !phone.trim() && styles.inputError]} keyboardType="phone-pad" />
            </View>

            <Text style={[styles.label, { marginTop: 8 }]}>Property Location</Text>

            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Ionicons name="map" size={24} color="#FF5C5C" />
                <Text style={styles.locationTitle}>Pin Location on Map</Text>
              </View>

              <View style={styles.mapSearchContainer}>
                <TextInput
                  style={styles.mapSearchInput}
                  placeholder="Search city, area, or place..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleMapSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity onPress={handleMapSearch} style={styles.searchButton}>
                  {isGeocoding ? <ActivityIndicator size="small" color="#FF5C5C" /> : <Ionicons name="search" size={20} color="#6C6C6C" />}
                </TouchableOpacity>
              </View>


              <View style={{ height: 400, borderRadius: 12, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#eee' }}>
                <LeafletMapView
                  latitude={coords.lat}
                  longitude={coords.lng}
                  interactive={true}
                  onRegionChange={(lat, lng) => {
                    setCoords({ lat, lng });
                    fetchAddressFromCoords(lat, lng);
                  }}
                />
              </View>

              <View style={styles.coordsDisplay}>
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>Lat: {coords.lat.toFixed(6)}</Text>
                  <Text style={styles.coordLabel}>Lng: {coords.lng.toFixed(6)}</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.locationButton, isFetchingLocation && styles.locationButtonDisabled]} onPress={useMyLocation} disabled={isFetchingLocation}>
                {isFetchingLocation ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="navigate" size={20} color="#fff" />}
                <Text style={styles.locationButtonText}>{isFetchingLocation ? 'Fetching Location...' : 'Use My Location'}</Text>
              </TouchableOpacity>

              <Text style={styles.hint}>Tip: Tap or drag the marker to adjust location manually</Text>
            </View>

            <View style={[styles.formGroup, { marginTop: 16 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Full Address *</Text>
                {isGeocoding && <ActivityIndicator size="small" />}
              </View>
              <TextInput placeholder="Address will appear here..." value={address} onChangeText={setAddress} style={[styles.input, !address.trim() && styles.inputError]} multiline={false} returnKeyType="done" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City *</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setCityDropdownVisible(true)}>
                <Text style={styles.dropdownButtonText}>{city}</Text>
                <Ionicons name="chevron-down" size={18} color="#6C6C6C" />
              </TouchableOpacity>
            </View>

            {city === 'Addis Ababa' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Sub City *</Text>
                <TouchableOpacity style={styles.dropdownButton} onPress={() => setSubCityDropdownVisible(true)}>
                  <Text style={styles.dropdownButtonText}>{subCity || "Select Sub City"}</Text>
                  <Ionicons name="chevron-down" size={18} color="#6C6C6C" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[styles.postButton, isSubmitting && styles.postButtonDisabled]} onPress={postProperty} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="home" size={18} color="#fff" />}
              <Text style={styles.postButtonText}>{isSubmitting ? "Posting..." : "Post My Property"}</Text>
            </TouchableOpacity>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Ionicons name="arrow-back" size={18} color="#000" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {step === 1 && (
        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.blackButton} onPress={goNext}>
            <Text style={styles.blackButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {(step === 2 || step === 3) && (
        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.blackButton} onPress={goNext}>
            <Text style={styles.blackButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {toast && (<Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }, toast.type === 'error' && styles.toastError]}><Text style={styles.toastText}>{toast.message}</Text></Animated.View>)}

      <Modal visible={cityDropdownVisible} transparent={true} animationType="fade" onRequestClose={() => setCityDropdownVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setCityDropdownVisible(false)}>
          <View style={styles.dropdownContainer}>{cities.map(c => (<TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setCity(c); if (c !== 'Addis Ababa') { setSubCity(null); } setCityDropdownVisible(false); }}><Text style={styles.dropdownItemText}>{c}</Text></TouchableOpacity>))}</View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={subCityDropdownVisible} transparent={true} animationType="fade" onRequestClose={() => setSubCityDropdownVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSubCityDropdownVisible(false)}>
          <View style={styles.dropdownContainer}><ScrollView>{addisAbabaSubCities.map(sc => (<TouchableOpacity key={sc} style={styles.dropdownItem} onPress={() => { setSubCity(sc); setSubCityDropdownVisible(false); }}><Text style={styles.dropdownItemText}>{sc}</Text></TouchableOpacity>))}</ScrollView></View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#F7F7F9", zIndex: 10 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10, backgroundColor: '#F7F7F9' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  progressContainer: { alignItems: 'center', flex: 1 },
  stepIndicator: { fontSize: 13, color: '#666', marginBottom: 8, fontWeight: '500' },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressSegment: { width: 30, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },
  progressActive: { backgroundColor: '#000' },
  progressInactive: { backgroundColor: '#E0E0E0' },

  stepBody: { paddingBottom: 20, marginTop: 20 },
  mainTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 20, textAlign: 'center' },
  photoGrid: { flexDirection: 'row', gap: 12, height: 260 },
  photoMainSlot: { flex: 1.5, borderWidth: 2, borderColor: '#D0D0D0', borderStyle: 'dashed', borderRadius: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  photoColRight: { flex: 1, flexDirection: 'column', gap: 12 },
  photoSmallSlot: { flex: 1, borderWidth: 2, borderColor: '#D0D0D0', borderStyle: 'dashed', borderRadius: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },

  slotFilled: { borderStyle: 'solid', borderColor: 'transparent', backgroundColor: '#fff' },
  slotEmpty: { backgroundColor: '#FAFAFA' },
  slotImage: { width: '100%', height: '100%', borderRadius: 20 },
  placeholderContent: { alignItems: 'center', justifyContent: 'center' },
  plusBadge: { marginTop: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  plusBadgeSmall: { marginTop: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  removeIcon: { position: 'absolute', top: 8, right: 8, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2 },

  videoRow: { marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  videoText: { fontSize: 16, fontWeight: '600', color: '#333' },

  footerContainer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  blackButton: { backgroundColor: '#000', paddingVertical: 18, borderRadius: 30, alignItems: 'center', width: '100%' },
  blackButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  stepContainer: { paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 20, marginTop: 10 },
  formGroup: { marginTop: 10, marginBottom: 16 },
  label: { color: "#0B0B0B", fontWeight: "700", marginBottom: 6, fontSize: 15 },
  input: { borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: "#0B0B0B", fontSize: 16, backgroundColor: '#FAFAFA' },
  inputError: { borderColor: "#FF5C5C", backgroundColor: "#FFF5F5" },
  textArea: { height: 100, textAlignVertical: "top" },
  charCount: { alignSelf: "flex-end", color: "#9CA3AF", marginTop: 4, fontSize: 12 },

  typeGrid: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: "#E0E6EF", backgroundColor: '#fff' },
  typeChipActive: { backgroundColor: "#000", borderColor: "#000" },
  typeChipText: { color: "#555", fontWeight: '500' },
  typeChipTextActive: { color: "#fff", fontWeight: "700" },

  counterRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  counterBox: { flex: 1, borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 14, padding: 16, backgroundColor: '#fff' },
  counterLabel: { color: "#0B0B0B", fontWeight: "700", fontSize: 15 },
  counterControls: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  counterBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#E0E6EF", alignItems: "center", justifyContent: "center", backgroundColor: '#FAFAFA' },
  counterValue: { fontWeight: "700", color: "#0B0B0B", fontSize: 18 },

  furnishedCard: { marginTop: 16, borderWidth: 1, borderColor: "#E0E6EF", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, justifyContent: 'space-between' },
  inlineTitle: { fontWeight: "700", color: "#0B0B0B", fontSize: 15 },
  inlineSubtitle: { color: "#6C6C6C", marginTop: 2, fontSize: 13 },

  navRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10 },
  backText: { color: "#000", fontWeight: '600', fontSize: 15 },
  primaryButtonSmall: { backgroundColor: "#2F6BFF", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: "#ffffff", fontWeight: "700" },

  priceInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  currency: { fontSize: 24, fontWeight: "700", color: "#0B0B0B" },
  noticeRow: { marginTop: 12, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  noticeTitle: { fontWeight: "700", color: "#0B0B0B", fontSize: 15 },
  noticeSub: { color: "#6C6C6C", fontSize: 13 },
  summaryBox: { marginTop: 20, borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 12, padding: 16, flexDirection: "row", justifyContent: "space-between", backgroundColor: '#F9FAFB' },
  summaryLeft: { color: "#6C6C6C", fontWeight: '500' },
  summaryRight: { color: "#0B0B0B", fontWeight: "700", fontSize: 16 },

  toastContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, padding: 16, borderRadius: 12, backgroundColor: '#22A06B', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3.84, elevation: 5, zIndex: 100 },
  toastError: { backgroundColor: '#E53935' },
  toastText: { color: 'white', fontWeight: '600', textAlign: 'center' },

  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FAFAFA' },
  dropdownButtonText: { color: "#0B0B0B", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownContainer: { backgroundColor: 'white', borderRadius: 20, padding: 20, width: '85%', maxHeight: '60%', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  dropdownItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 16, color: '#333' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postButton: { marginTop: 24, backgroundColor: "#16C47F", paddingVertical: 16, borderRadius: 30, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  postButtonDisabled: { backgroundColor: "#A0E6CA" },
  postButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  locationCard: { borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 14, backgroundColor: "#FAFBFD", marginTop: 8, padding: 16 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  locationTitle: { fontSize: 18, fontWeight: '700', color: "#0B0B0B" },
  mapSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E0E6EF', marginBottom: 12 },
  mapSearchInput: { flex: 1, height: 44, fontSize: 15, color: '#0B0B0B' },
  searchButton: { padding: 8 },
  coordsDisplay: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  coordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  coordLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  locationButton: { backgroundColor: '#FF5C5C', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  locationButtonDisabled: { backgroundColor: '#FFB8B8' },
  locationButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { color: "#9CA3AF", textAlign: 'center', fontSize: 12, marginTop: 8 },
  keyboardContainer: { flex: 1, backgroundColor: "#F7F7F9" },
  container: { flex: 1, backgroundColor: "#F7F7F9" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // New Styles for Step 2
  cardContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  labelLight: { color: "#8E8E93", fontSize: 13, fontWeight: "500", marginBottom: 8 },
  inputClean: { fontSize: 16, color: '#000', padding: 0 },
  voiceButton: { backgroundColor: '#fff', borderRadius: 30, paddingVertical: 14, marginBottom: 16, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  voiceContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceText: { color: '#8E8E93', fontSize: 14, fontWeight: "500" },
  sectionHeader: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChipClean: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F5F5F5' },
  typeChipActiveClean: { backgroundColor: '#000' },
  typeChipTextClean: { fontSize: 14, color: '#000', fontWeight: '500' },
  typeChipTextActiveClean: { color: '#fff' },
  roomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  roomLabel: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  counterWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtnSmall: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  counterValSmall: { fontSize: 16, fontWeight: '600', color: '#000', minWidth: 20, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
  furnishedContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },

  // New Styles for Step 3
  inputCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  // cardLabel reused or similar to labelLight
  cardLabel: { color: "#8E8E93", fontSize: 13, fontWeight: "600", marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceInput: { flex: 1, fontSize: 17, color: '#000', padding: 0 },
  priceSuffix: { fontSize: 15, color: '#8E8E93', marginLeft: 8 },
  inputUnderline: { height: 1, backgroundColor: '#E5E5EA', marginTop: 12 },

  toggleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  toggleLabel: { fontSize: 17, fontWeight: '600', color: '#000' },
});