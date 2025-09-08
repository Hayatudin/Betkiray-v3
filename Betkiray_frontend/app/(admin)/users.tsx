// app/(admin)/users.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import api from '@/config/api';
import { UserData } from '@/types'; // Make sure this type includes `isBanned` and `role`

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleBan = async (userId: string, isCurrentlyBanned: boolean) => {
    const action = isCurrentlyBanned ? 'unban' : 'ban';
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Yes, ${action}`,
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${userId}/status`, { isBanned: !isCurrentlyBanned });
              // Refresh the list to show the new status
              await fetchUsers();
            } catch (error) {
              Alert.alert('Error', `Could not ${action} the user.`);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  const renderUserItem = ({ item }: { item: UserData }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.banButton, item.isBanned ? styles.unbanButton : {}]}
        onPress={() => handleToggleBan(item.id, item.isBanned)}
      >
        <Text style={styles.banButtonText}>{item.isBanned ? 'Unban' : 'Ban'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={users}
      renderItem={renderUserItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      ListHeaderComponent={<Text style={styles.title}>All Users</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  userCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userEmail: { color: '#666', marginTop: 4 },
  banButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unbanButton: { backgroundColor: '#2ecc71' },
  banButtonText: { color: '#fff', fontWeight: 'bold' },
});