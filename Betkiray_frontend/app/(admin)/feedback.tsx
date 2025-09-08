// app/(admin)/feedback.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import api from '@/config/api';

// A simple type for the feedback data
interface Feedback {
  id: number;
  content: string;
  category: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

export default function ManageFeedbackScreen() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/feedback');
      setFeedback(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch feedback.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleDelete = (feedbackId: number) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this feedback message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/feedback/${feedbackId}`);
              await fetchFeedback(); // Refresh list
            } catch (error) {
              Alert.alert("Error", "Could not delete the feedback.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  const renderFeedbackItem = ({ item }: { item: Feedback }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.content}>{item.content}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.author}>from: {item.user.fullName} ({item.user.email})</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={feedback}
      renderItem={renderFeedbackItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      ListHeaderComponent={<Text style={styles.headerTitle}>User Feedback</Text>}
      ListEmptyComponent={<Text style={styles.emptyText}>No feedback has been submitted.</Text>}
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
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  category: { fontWeight: 'bold', color: '#3498db', textTransform: 'uppercase' },
  date: { fontSize: 12, color: '#95a5a6' },
  content: { fontSize: 16, color: '#34495e', marginVertical: 8, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#ecf0f1', paddingTop: 8 },
  author: { fontSize: 12, color: '#7f8c8d', fontStyle: 'italic' },
  deleteText: { color: '#e74c3c', fontWeight: 'bold' },
});