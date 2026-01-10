// app/index.tsx

import { useUser } from '@/contexts/UserContext';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    // This effect runs whenever the loading state or user state changes.
    // We wait until the initial check from UserContext is complete.
    if (!isLoading) {
      if (user) {
        // If a user object exists, they are logged in.
        // We use 'replace' to prevent the user from navigating back to this loading screen.
        router.replace('/(tabs)');
      } else {
        // If there is no user, they are logged out.
        // Send them to the beginning of the authentication flow.
        router.replace('/onboarding');
      }
    }
  }, [isLoading, user]); // The effect depends on these two values

  // While the check is in progress, show a loading spinner.
  // This is what the user sees for a brief moment on app start.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});