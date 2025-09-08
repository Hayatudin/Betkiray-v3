import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useUser } from "@/contexts/UserContext";
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session'; // --- IMPORT THIS ---

if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export default function SignInScreen() {
  const { signInWithEmail, signInWithGoogle } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // --- THIS IS THE FIX ---
  // We explicitly tell the hook to use the proxy redirect URI.
  // This is necessary for devices without Google Play Services.
  const redirectUri = makeRedirectUri({
    scheme: 'betkiray',
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: Constants.expoConfig?.extra?.googleWebClientId,
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId,
    scopes: ['profile', 'email'],
    redirectUri: redirectUri, // --- ADD THIS LINE ---
  });

  useEffect(() => {
    // ... (rest of the code is unchanged)
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const { params } = response;
        if (params.id_token) {
          await signInWithGoogle(params.id_token);
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  const onGooglePress = () => {
    promptAsync();
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmail({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.signInButtonText}>Sign in</Text>}
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          <TouchableOpacity style={styles.googleButton} onPress={onGooglePress} disabled={!request}>
            <Image source={require("../../assets/images/google.png")} style={styles.googleIcon} contentFit="contain" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
      container: {
flex: 1,
backgroundColor: "#ffffff",
},
content: {
flex: 1,
paddingHorizontal: 32,
justifyContent: "center",
},
header: {
alignItems: "center",
marginBottom: 60,
},
title: {
fontSize: 32,
fontWeight: "700",
color: "#000000",
marginBottom: 8,
},
subtitle: {
fontSize: 16,
color: "#888888",
fontWeight: "400",
},
form: {
width: "100%",
},
inputContainer: {
flexDirection: "row",
alignItems: "center",
borderBottomWidth: 1,
borderBottomColor: "#E0E0E0",
marginBottom: 20, // Increased margin
paddingBottom: 12,
},
inputIcon: {
marginRight: 12,
},
input: {
flex: 1,
fontSize: 16,
color: "#000000",
},
errorText: {
color: 'red',
textAlign: 'center',
marginBottom: 10,
},
forgotPassword: {
alignSelf: "flex-end",
marginBottom: 32,
},
forgotPasswordText: {
fontSize: 14,
color: "#888888",
},
signInButton: {
backgroundColor: "#000000",
borderRadius: 12,
paddingVertical: 18,
alignItems: "center",
marginBottom: 32,
},
signInButtonText: {
fontSize: 18,
fontWeight: "600",
color: "#ffffff",
},
divider: {
flexDirection: "row",
alignItems: "center",
marginBottom: 32,
},
dividerLine: {
flex: 1,
height: 1,
backgroundColor: "#E0E0E0",
},
dividerText: {
fontSize: 14,
color: "#888888",
marginHorizontal: 16,
},
googleButton: {
flexDirection: "row",
alignItems: "center",
justifyContent: "center",
borderWidth: 1,
borderColor: "#E0E0E0",
borderRadius: 12,
paddingVertical: 18,
marginBottom: 32,
},
googleIcon: {
width: 20,
height: 20,
marginRight: 12,
},
googleButtonText: {
fontSize: 16,
color: "#888888",
},
signUpContainer: {
flexDirection: "row",
justifyContent: "center",
alignItems: "center",
},
signUpText: {
fontSize: 14,
color: "#888888",
},
signUpLink: {
fontSize: 14,
color: "#000000",
fontWeight: "600",
},
});