import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '@/config/api';
import { useAppState } from '@/contexts/AppStateContext';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Number(id);
  const { getPropertyById, refetchProperties } = useAppState();

  const [description, setDescription] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const property = getPropertyById(propertyId);
    if (property) {
      setDescription(property.description || '');
      const audio = property.media.find(m => m.mediaType === 'AUDIO');
      if (audio) {
        setAudioUri(`${api.defaults.baseURL}${audio.mediaUrl}`);
      }
      setIsLoading(false);
    } else {
        // If property not found in context, maybe fetch it
        setIsLoading(false);
        Alert.alert("Error", "Property details not found.");
        router.back();
    }
  }, [propertyId]);

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert("Permission required", "Microphone access is needed."); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording); setIsRecording(true);
    } catch (err) { Alert.alert("Error", "Could not start recording."); }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    setAudioUri(recording.getURI());
    setRecording(undefined);
  }

  const removeAudio = () => setAudioUri(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        const formData = new FormData();
        formData.append('description', description);

        if (audioUri && !audioUri.startsWith('http')) {
             formData.append('audio', { uri: audioUri, name: `audio_${Date.now()}.m4a`, type: 'audio/m4a' } as any);
        } else if (!audioUri) {
            // If user removed audio, we can send a flag, but for now we only update description
        }

        await api.patch(`/properties/${propertyId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        refetchProperties();
        Alert.alert('Success', 'Property updated!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
        console.error("Failed to update property", error);
        Alert.alert('Error', 'Could not update property.');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <ActivityIndicator style={{flex: 1}} size="large" />
  }

  return (
    <ScrollView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="black" /></TouchableOpacity>
            <Text style={styles.title}>Edit Property</Text>
            <View style={{width: 24}}/>
        </View>

        <View style={styles.form}>
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />
            
            <View style={styles.inlineCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inlineTitle}>Update Audio</Text>
                <Text style={styles.inlineSubtitle}>{isRecording ? "Recording..." : audioUri ? "Audio available" : "Record a new clip"}</Text>
              </View>
              {audioUri && !isRecording && ( <TouchableOpacity style={styles.inlineButton} onPress={removeAudio}><Ionicons name="trash-outline" size={18} color="#E53935" /></TouchableOpacity> )}
              <TouchableOpacity style={styles.inlineButton} onPress={isRecording ? stopRecording : startRecording}>
                  <Ionicons name={isRecording ? "stop-circle-outline" : "mic-outline"} size={18} color="#7A3EF2" />
              </TouchableOpacity>
            </View>

            <View style={styles.notice}>
                <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
                <Text style={styles.noticeText}>To edit other details like price, location, or photos, please contact an administrator.</Text>
            </View>

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
  form: { paddingHorizontal: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { height: 120, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  inlineCard: { marginTop: 20, borderWidth: 1, borderColor: "#E0E6EF", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  inlineTitle: { fontWeight: "700", color: "#0B0B0B" },
  inlineSubtitle: { color: "#6C6C6C", marginTop: 2 },
  inlineButton: { borderWidth: 1, borderColor: "#E0E6EF", backgroundColor: "#F7F7F7", padding: 10, borderRadius: 20 },
  notice: { marginTop: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f8ff', padding: 14, borderRadius: 12, gap: 10 },
  noticeText: { flex: 1, color: '#005a9c' }
});
