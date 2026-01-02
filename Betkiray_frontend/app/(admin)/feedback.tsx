// app/(admin)/feedback.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/config/api";

type Feedback = {
  id: number;
  userId: string;
  message: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  }
};

export default function FeedbackScreen() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/feedback");
      setFeedbacks(response.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch feedback.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleDelete = (id: number) => {
    Alert.alert(
      "Confirm Deletion",
      "Delete this feedback?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/feedback/${id}`);
              fetchFeedback();
            } catch (error) {
              Alert.alert("Error", "Could not delete feedback.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Feedback }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.userName}>{item.user?.name || "Anonymous"}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.footer}>
        <Text style={styles.email}>{item.user?.email}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedbacks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No feedback found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
  },
  date: {
    color: '#888',
    fontSize: 12,
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  email: {
    color: '#666',
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
  },
});
