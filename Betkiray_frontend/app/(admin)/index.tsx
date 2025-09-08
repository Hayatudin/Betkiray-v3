// app/(admin)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function AdminDashboardScreen() {
  return (
    <ScrollView style={styles.container}>
  <TouchableOpacity style={styles.card} onPress={() => router.push('/users')}>
        <Ionicons name="people-outline" size={32} color="#3498db" />
        <Text style={styles.cardTitle}>Manage Users</Text>
        <Text style={styles.cardDescription}>View, ban, or unban users.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push('/(admin)/properties')}>
        <Ionicons name="home-outline" size={32} color="#27ae60" />
        <Text style={styles.cardTitle}>Manage Properties</Text>
        <Text style={styles.cardDescription}>View and delete property listings.</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push('/(admin)/feedback')}>
        <Ionicons name="mail-outline" size={32} color="#f39c12" />
        <Text style={styles.cardTitle}>View Feedback</Text>
        <Text style={styles.cardDescription}>Read and manage user submissions.</Text>
      </TouchableOpacity>
      {/* We will add more cards here later for property management, etc. */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  cardDescription: { fontSize: 14, color: '#666', marginTop: 4 },
});