// app/(admin)/properties.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import api from '@/config/api';
import { Property } from '@/types'; // Using the global Property type

export default function ManagePropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/properties');
      setProperties(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch properties.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = (propertyId: number) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this property? This action is permanent.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/properties/${propertyId}`);
              await fetchProperties(); // Refresh the list after deletion
            } catch (error) {
              Alert.alert("Error", "Could not delete the property.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }
  
  const API_BASE_URL = api.defaults.baseURL;

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: `${API_BASE_URL}${item.media[0]?.mediaUrl}` }} 
        style={styles.image} 
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.owner}>Listed by: {item.owner?.fullName || 'N/A'}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={properties}
      renderItem={renderPropertyItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      ListHeaderComponent={<Text style={styles.headerTitle}>All Properties</Text>}
      ListEmptyComponent={<Text style={styles.emptyText}>No properties found.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    overflow: 'hidden',
  },
  image: { width: 60, height: 60, backgroundColor: '#eee' },
  info: { flex: 1, paddingHorizontal: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  owner: { color: '#666', marginTop: 4, fontSize: 12 },
  deleteButton: { backgroundColor: '#e74c3c', padding: 12, height: '100%', justifyContent: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
});