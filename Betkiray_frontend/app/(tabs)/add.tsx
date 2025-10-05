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
import MapView from "@/components/ui/MapView";
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

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
  
  const [mapType, setMapType] = useState<'standard' | 'hybrid'>('hybrid');
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const mapRef = useRef<MapView>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (step === 4) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          showToast('Location permission is needed to auto-fill the address.', 'error');
        }
      }
    };
    requestLocationPermission();
  }, [step]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 100, duration: 300, useNativeDriver: true })
    ]).start(() => setToast(null));
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
    formData.append('phone', phone.trim());
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
      showToast("Property posted successfully!", 'success');
      setTimeout(() => { resetForm(); router.replace('/(tabs)'); }, 1000);
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
    } catch (error) { showToast("Could not fetch address. Please check connection.", 'error'); setAddress(""); } 
    finally { setIsGeocoding(false); }
  };

  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim()) return;
    try {
      const geocodedLocation = await Location.geocodeAsync(mapSearchQuery);
      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      } else { showToast("Location not found.", 'error'); }
    } catch (error) { showToast("Error searching location.", 'error'); }
  };

  const StepHeader = ({ icon, tint, title, subtitle }: any) => (
    <><View style={styles.stepBarWrap}><Text style={styles.stepLabel}>Step {step} of 4</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step - 1) * 33.33 + 25}%` }]} /></View></View><View style={[styles.heroIcon, { backgroundColor: `${tint}22` }]}><Ionicons name={icon} size={26} color={tint} /></View><Text style={styles.heroTitle}>{title}</Text><Text style={styles.heroSubtitle}>{subtitle}</Text></>
  );

  return (
    <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        {step === 1 && (<><StepHeader icon="camera" tint="#3772FF" title="Add Photos & Audio" subtitle="Upload 3 photos and optionally record an audio clip" /><View style={styles.cardUpload}><TouchableOpacity style={[styles.uploadTap, photos.length >= 3 && styles.uploadTapDisabled]} onPress={pickImage} disabled={photos.length >= 3}><Ionicons name="cloud-upload-outline" size={28} color={photos.length >= 3 ? "#ccc" : "#3772FF"} /><Text style={[styles.uploadTitle, photos.length >= 3 && styles.uploadTitleDisabled]}>{photos.length >= 3 ? "3 images uploaded" : "Tap to upload photos"}</Text><Text style={[styles.uploadHint, photos.length >= 3 && styles.uploadHintDisabled]}>{photos.length >= 3 ? "Maximum reached" : "Select exactly 3 images"}</Text></TouchableOpacity>{imageErrors.length > 0 && <View style={styles.errorContainer}>{imageErrors.map((error, index) => <Text key={index} style={styles.errorText}>{error}</Text>)}</View>}<View style={styles.imageGrid}>{Array.from({ length: 3 }).map((_, index) => <View key={index} style={styles.imageSlot}>{photos[index] ? <View style={styles.imageContainer}><Image source={{ uri: photos[index] }} style={styles.uploadedImage} /><TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}><Ionicons name="close" size={16} color="#fff" /></TouchableOpacity></View> : <TouchableOpacity style={styles.emptySlot} onPress={pickImage}><Ionicons name="add" size={22} color="#888" /><Text style={styles.slotText}>Photo {index + 1}</Text></TouchableOpacity>}</View>)}</View><Text style={styles.imageCount}>{photos.length}/3 images uploaded</Text></View><View style={styles.inlineCard}><View style={{ flex: 1 }}><Text style={styles.inlineTitle}>Add Audio Description</Text><Text style={styles.inlineSubtitle}>{isRecording ? "Recording..." : audioUri ? "Audio recorded" : "Record a short clip"}</Text></View>{audioUri ? <TouchableOpacity style={styles.inlineButton} onPress={removeAudio}><Ionicons name="trash-outline" size={18} color="#E53935" /></TouchableOpacity> : <TouchableOpacity style={styles.inlineButton} onPress={isRecording ? stopRecording : startRecording}><Ionicons name={isRecording ? "stop-circle-outline" : "mic-outline"} size={18} color="#7A3EF2" /></TouchableOpacity>}</View><TouchableOpacity style={[styles.primaryButton, photos.length !== 3 && styles.primaryButtonDisabled]} onPress={goNext} disabled={photos.length !== 3}><Text style={styles.primaryButtonText}>Next ({photos.length === 3 ? "✓" : `${photos.length}/3`})</Text></TouchableOpacity></>)}
        {step === 2 && (<View style={styles.stepContainer}><StepHeader icon="home" tint="#22A06B" title="Property Details" subtitle="Tell us about your amazing space" /><View style={styles.formGroup}><Text style={styles.label}>Property Title *</Text><TextInput placeholder="e.g., Cozy Downtown Apartment" value={title} onChangeText={setTitle} style={[styles.input, !title.trim() && styles.inputError]} /></View><View style={styles.formGroup}><Text style={styles.label}>Description *</Text><TextInput placeholder="Describe your property..." value={description} onChangeText={setDescription} style={[styles.input, styles.textArea, !description.trim() && styles.inputError]} multiline maxLength={500} /><Text style={styles.charCount}>{description.length}/500</Text></View><View style={styles.formGroup}><Text style={styles.label}>Contact Phone Number *</Text><TextInput placeholder="+251 91 123 4567" value={phone} onChangeText={setPhone} style={[styles.input, !phone.trim() && styles.inputError]} keyboardType="phone-pad" /></View><View style={styles.formGroup}><Text style={styles.label}>Area (m²)</Text><TextInput placeholder="e.g., 85" value={areaSqm} onChangeText={setAreaSqm} style={styles.input} keyboardType="numeric" /></View><Text style={[styles.label, { marginTop: 16 }]}>Property Type</Text><View style={styles.typeGrid}>{ (["House", "Apartment", "Office", "Retail", "Studio", "Warehouse"] as const).map((t) => <TouchableOpacity key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}><Ionicons name={t === "House" ? "home" : "business"} size={18} color={type === t ? "#fff" : "#555"} /><Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text></TouchableOpacity>)}</View><View style={styles.counterRow}><View style={styles.counterBox}><Text style={styles.counterLabel}>Rooms</Text><View style={styles.counterControls}><TouchableOpacity style={styles.counterBtn} onPress={() => setRooms((v) => Math.max(1, v - 1))}><Ionicons name="remove" size={18} color="#000" /></TouchableOpacity><Text style={styles.counterValue}>{rooms}</Text><TouchableOpacity style={styles.counterBtn} onPress={() => setRooms((v) => v + 1)}><Ionicons name="add" size={18} color="#000" /></TouchableOpacity></View></View><View style={styles.counterBox}><Text style={styles.counterLabel}>Bathrooms</Text><View style={styles.counterControls}><TouchableOpacity style={styles.counterBtn} onPress={() => setBaths((v) => Math.max(0, v - 1))}><Ionicons name="remove" size={18} color="#000" /></TouchableOpacity><Text style={styles.counterValue}>{baths}</Text><TouchableOpacity style={styles.counterBtn} onPress={() => setBaths((v) => v + 1)}><Ionicons name="add" size={18} color="#000" /></TouchableOpacity></View></View></View><View style={styles.furnishedCard}><View style={{ flex: 1 }}><Text style={styles.inlineTitle}>Furnished</Text><Text style={styles.inlineSubtitle}>Is it furnished?</Text></View><Switch value={furnished} onValueChange={setFurnished} trackColor={{ false: "#E0E6EF", true: "#22A06B" }} thumbColor={"#fff"} /></View><View style={styles.navRow}><TouchableOpacity style={styles.backButton} onPress={goBack}><Ionicons name="arrow-back" size={18} color="#000" /><Text style={styles.backText}>Back</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButtonSmall} onPress={goNext}><Text style={styles.primaryButtonText}>Next</Text></TouchableOpacity></View></View>)}
        {step === 3 && (<View style={styles.stepContainer}><StepHeader icon="cash" tint="#16C47F" title="Set Your Price" subtitle="What would you like to charge?" /><View style={styles.formGroup}><Text style={styles.label}>Rental Price Per month</Text><View style={styles.priceInputRow}><Text style={styles.currency}>$</Text><TextInput keyboardType="numeric" placeholder="0" value={price} onChangeText={setPrice} style={[styles.input, { flex: 1, marginLeft: 8 }]} /></View></View><View style={[styles.noticeRow, { backgroundColor: "#FFF6E5" }]}><Ionicons name="hand-left" size={18} color="#F5A524" /><View style={{ flex: 1 }}><Text style={styles.noticeTitle}>Negotiable</Text><Text style={styles.noticeSub}>Open to price discussions</Text></View><Switch value={negotiable} onValueChange={setNegotiable} /></View><View style={[styles.noticeRow, { backgroundColor: "#EFFFF6" }]}><Ionicons name="flash" size={18} color="#16C47F" /><View style={{ flex: 1 }}><Text style={styles.noticeTitle}>Include Utilities</Text><Text style={styles.noticeSub}>Water, electricity, etc.</Text></View><Switch value={includeUtilities} onValueChange={setIncludeUtilities} /></View><View style={styles.summaryBox}><Text style={styles.summaryLeft}>Your listing price:</Text><Text style={styles.summaryRight}>${price || 0} / month</Text></View><View style={styles.navRow}><TouchableOpacity style={styles.backButton} onPress={goBack}><Ionicons name="arrow-back" size={18} color="#000" /><Text style={styles.backText}>Back</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButtonSmall} onPress={goNext}><Text style={styles.primaryButtonText}>Next</Text></TouchableOpacity></View></View>)}
        {step === 4 && (<View style={styles.stepContainer}><StepHeader icon="pin" tint="#FF5C5C" title="Location & Contact" subtitle="Help renters find your property" /><Text style={[styles.label, { marginTop: 8 }]}>Property Location</Text><View style={styles.mapCard}><View style={styles.mapControls}><View style={styles.mapSearchContainer}><TextInput style={styles.mapSearchInput} placeholder="Search for a location..." value={mapSearchQuery} onChangeText={setMapSearchQuery} onSubmitEditing={handleMapSearch} /><TouchableOpacity onPress={handleMapSearch}><Ionicons name="search" size={20} color="#6C6C6C" /></TouchableOpacity></View><View style={styles.mapTypeContainer}>{ (['standard', 'hybrid'] as const).map(type => <TouchableOpacity key={type} style={[styles.mapTypeButton, mapType === type && styles.mapTypeButtonActive]} onPress={() => setMapType(type)}><Text style={[styles.mapTypeButtonText, mapType === type && styles.mapTypeButtonTextActive]}>{type}</Text></TouchableOpacity>)}</View></View><View style={styles.mapPinContainer}><Ionicons name="location-sharp" size={40} color="#FF5C5C" style={styles.mapPin} /></View><MapView ref={mapRef} style={styles.mapView} mapType={mapType} initialRegion={{ latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.09, longitudeDelta: 0.04 }} onRegionChangeComplete={(region) => { setCoords({ lat: region.latitude, lng: region.longitude }); fetchAddressFromCoords(region.latitude, region.longitude); }} showsUserLocation showsMyLocationButton /></View><Text style={[styles.hint, { marginTop: 8 }]}>Drag the map to set the exact location</Text><View style={[styles.formGroup, { marginTop: 16 }]}><View style={styles.labelRow}><Text style={styles.label}>Full Address *</Text>{isGeocoding && <ActivityIndicator size="small" />}</View><TextInput placeholder="Address will appear here..." value={address} onChangeText={setAddress} style={[styles.input, !address.trim() && styles.inputError]} multiline={false} returnKeyType="done" /></View><View style={styles.formGroup}><Text style={styles.label}>City *</Text><TouchableOpacity style={styles.dropdownButton} onPress={() => setCityDropdownVisible(true)}><Text style={styles.dropdownButtonText}>{city}</Text><Ionicons name="chevron-down" size={18} color="#6C6C6C" /></TouchableOpacity></View>{city === 'Addis Ababa' && <View style={styles.formGroup}><Text style={styles.label}>Sub City *</Text><TouchableOpacity style={styles.dropdownButton} onPress={() => setSubCityDropdownVisible(true)}><Text style={styles.dropdownButtonText}>{subCity || "Select Sub City"}</Text><Ionicons name="chevron-down" size={18} color="#6C6C6C" /></TouchableOpacity></View>}<TouchableOpacity style={[styles.postButton, isSubmitting && styles.postButtonDisabled]} onPress={postProperty} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="home" size={18} color="#fff" />}<Text style={styles.postButtonText}>{isSubmitting ? "Posting..." : "Post My Property"}</Text></TouchableOpacity><View style={styles.navRow}><TouchableOpacity style={styles.backButton} onPress={goBack}><Ionicons name="arrow-back" size={18} color="#000" /><Text style={styles.backText}>Back</Text></TouchableOpacity></View></View>)}
      </ScrollView>

      {toast && ( <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }, toast.type === 'error' && styles.toastError]}><Text style={styles.toastText}>{toast.message}</Text></Animated.View> )}
      
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
    keyboardContainer: { flex: 1, backgroundColor: "#ffffff" },
    container: { flex: 1, backgroundColor: "#ffffff" },
    scrollContent: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 120 },
    stepContainer: { paddingBottom: 40 },
    stepBarWrap: { marginBottom: 12 },
    stepLabel: { textAlign: "center", color: "#6C6C6C", marginBottom: 6 },
    progressTrack: { height: 6, backgroundColor: "#E9ECEF", borderRadius: 6, overflow: "hidden" },
    progressFill: { height: 6, backgroundColor: "#2F6BFF" },
    heroIcon: { alignSelf: "center", width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginTop: 6 },
    heroTitle: { marginTop: 12, textAlign: "center", fontSize: 22, fontWeight: "700", color: "#0B0B0B" },
    heroSubtitle: { textAlign: "center", color: "#6C6C6C", marginTop: 6, marginBottom: 14 },
    cardUpload: { borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 14, padding: 14, marginBottom: 16 },
    uploadTap: { borderWidth: 1, borderColor: "#D7E2FF", backgroundColor: "#F3F7FF", borderRadius: 12, padding: 18, alignItems: "center", justifyContent: "center" },
    uploadTitle: { color: "#2F6BFF", marginTop: 8, fontWeight: "600" },
    uploadHint: { color: "#6C6C6C", marginTop: 6 },
    inlineCard: { marginTop: 14, borderWidth: 1, borderColor: "#E0E6EF", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
    inlineTitle: { fontWeight: "700", color: "#0B0B0B" },
    inlineSubtitle: { color: "#6C6C6C", marginTop: 2 },
    inlineButton: { borderWidth: 1, borderColor: "#D7B3FF", backgroundColor: "#F7EDFF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    primaryButton: { marginTop: 16, backgroundColor: "#000000", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 20 },
    primaryButtonDisabled: { backgroundColor: "#ccc" },
    primaryButtonSmall: { backgroundColor: "#2F6BFF", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: "center" },
    primaryButtonText: { color: "#ffffff", fontWeight: "700" },
    formGroup: { marginTop: 10 },
    label: { color: "#0B0B0B", fontWeight: "700", marginBottom: 6 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: { borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#0B0B0B", fontSize: 16 },
    inputError: { borderColor: "#FF5C5C", backgroundColor: "#FFF5F5" },
    textArea: { height: 100, textAlignVertical: "top" },
    charCount: { alignSelf: "flex-end", color: "#9CA3AF", marginTop: 4 },
    typeGrid: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 12 },
    typeChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E0E6EF" },
    typeChipActive: { backgroundColor: "#2F6BFF", borderColor: "#2F6BFF" },
    typeChipText: { color: "#555" },
    typeChipTextActive: { color: "#fff", fontWeight: "600" },
    counterRow: { flexDirection: "row", gap: 12, marginTop: 12 },
    counterBox: { flex: 1, borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 12, padding: 12 },
    counterLabel: { color: "#0B0B0B", fontWeight: "700" },
    counterControls: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    counterBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "#E0E6EF", alignItems: "center", justifyContent: "center" },
    counterValue: { fontWeight: "700", color: "#0B0B0B" },
    navRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
    backButton: { flexDirection: "row", alignItems: "center", gap: 6 },
    backText: { color: "#000" },
    priceInputRow: { flexDirection: "row", alignItems: "center" },
    currency: { fontSize: 18, fontWeight: "700", color: "#0B0B0B" },
    noticeRow: { marginTop: 12, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
    noticeTitle: { fontWeight: "700", color: "#0B0B0B" },
    noticeSub: { color: "#6C6C6C" },
    summaryBox: { marginTop: 14, borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between" },
    summaryLeft: { color: "#6C6C6C" },
    summaryRight: { color: "#0B0B0B", fontWeight: "700" },
    mapCard: { height: 350, borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 14, overflow: "hidden", backgroundColor: "#FAFBFD", marginTop: 8, justifyContent: 'center', alignItems: 'center' },
    mapView: { width: "100%", height: "100%" },
    mapPinContainer: { position: 'absolute', zIndex: 10 },
    mapPin: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    hint: { color: "#9CA3AF", textAlign: 'center' },
    postButton: { marginTop: 24, backgroundColor: "#16C47F", paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
    postButtonDisabled: { backgroundColor: "#ccc" },
    postButtonText: { color: "#fff", fontWeight: "700" },
    imageGrid: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 12 },
    imageSlot: { flex: 1, height: 120 },
    imageContainer: { position: "relative", width: "100%", height: "100%" },
    uploadedImage: { width: "100%", height: "100%", borderRadius: 12, backgroundColor: "#f0f0f0" },
    removeButton: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
    emptySlot: { width: "100%", height: "100%", borderWidth: 2, borderColor: "#E0E6EF", borderStyle: "dashed", borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFBFD" },
    slotText: { color: "#888", fontSize: 12, marginTop: 4, textAlign: "center" },
    uploadTapDisabled: { backgroundColor: "#F5F5F5", borderColor: "#E0E0E0" },
    uploadTitleDisabled: { color: "#ccc" },
    uploadHintDisabled: { color: "#ccc" },
    imageCount: { textAlign: "center", color: "#6C6C6C", marginTop: 8, fontSize: 14 },
    errorContainer: { backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FF5C5C", borderRadius: 8, padding: 12, marginTop: 12 },
    errorText: { color: "#FF5C5C", fontSize: 14, fontWeight: "500" },
    furnishedCard: { marginTop: 16, borderWidth: 1, borderColor: "#E0E6EF", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
    dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: "#E0E6EF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    dropdownButtonText: { color: "#0B0B0B", fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    dropdownContainer: { backgroundColor: 'white', borderRadius: 14, padding: 16, width: '80%', maxHeight: '60%' },
    dropdownItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E9ECEF' },
    dropdownItemText: { fontSize: 16 },
    toastContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, padding: 16, borderRadius: 12, backgroundColor: '#22A06B', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3.84, elevation: 5 },
    toastError: { backgroundColor: '#E53935' },
    toastText: { color: 'white', fontWeight: '600', textAlign: 'center' },
    mapControls: { position: 'absolute', top: 10, left: 10, right: 10, zIndex: 20, gap: 8 },
    mapSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, elevation: 4 },
    mapSearchInput: { flex: 1, height: 44, paddingHorizontal: 8 },
    mapTypeContainer: { flexDirection: 'row', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: 4 },
    mapTypeButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    mapTypeButtonActive: { backgroundColor: 'white', elevation: 2 },
    mapTypeButtonText: { fontWeight: '500', color: '#333', textTransform: 'capitalize' },
    mapTypeButtonTextActive: { color: '#007AFF', fontWeight: '700' },
    detectedLocationText: { fontSize: 16, color: '#6C6C6C', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8 },
});