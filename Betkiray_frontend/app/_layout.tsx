import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AppStateProvider } from "@/contexts/AppStateContext";
import { UserProvider } from "@/contexts/UserContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { NotificationProvider } from "@/contexts/NotificationContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <UserProvider>
        <NotificationProvider>
          <AppStateProvider>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding2" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding3" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding4" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="property/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
              <Stack.Screen name="property/edit/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </AppStateProvider>
        </NotificationProvider>
      </UserProvider>
    </ThemeProvider>
  );
}