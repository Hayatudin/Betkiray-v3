// app/(admin)/_layout.tsx

import { useUser } from '@/contexts/UserContext';
import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function AdminLayout() {
  const { user, isLoading } = useUser();

  // While we're checking the user's role, show a loading spinner
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If the user is not an admin, redirect them to the home screen.
  // This protects all routes within the (admin) group.
  if (!user || user.role !== 'ADMIN') {
    return <Redirect href="/(tabs)" />;
  }

  // If the user is an admin, show the content of the screen.
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="users" options={{ title: 'Manage Users' }} />
    </Stack>
  );
}