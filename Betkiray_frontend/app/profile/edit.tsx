import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import api from '@/config/api';

export default function EditProfileScreen() {
  const { user, getProfile, token } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [image, setImage] = useState<string | null>(user?.image || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (phone) {
        formData.append('phone', phone);
      }
      
      if (image && image !== user?.image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: image,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      await api.patch('/profile/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (token) await getProfile(token);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to update profile", error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={{width: 24}}/>
        </View>

        <View style={styles.avatarContainer}>
            <Image source={{ uri: image || 'https://via.placeholder.com/150' }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
        </View>

        <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your full name" />
            
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Enter your phone number" keyboardType="phone-pad" />

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { padding: 4 },
  title: { fontSize: 22, fontWeight: '700' },
  avatarContainer: { alignSelf: 'center', marginVertical: 20, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  cameraButton: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#007AFF', padding: 8, borderRadius: 16 },
  form: { paddingHorizontal: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, fontSize: 16 },
  saveButton: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
