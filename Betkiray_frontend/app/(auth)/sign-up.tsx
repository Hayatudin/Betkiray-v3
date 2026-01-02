import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, Alert, ActivityIndicator, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useUser } from "@/contexts/UserContext";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
// --- NATIVE GOOGLE SIGN IN ---

export default function SignUpScreen() {
  const { signUpWithEmail, signInWithGoogle } = useUser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      offlineAccess: true,
    });
  }, []);

  const onGooglePress = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      // Force sign out to ensure account selector appears
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore error
      }
      const userInfo = await GoogleSignin.signIn();
      console.log("Device Info", userInfo);

      // Process ID Token
      const token = userInfo.data?.idToken;
      if (token) {
        await signInWithGoogle(token);
      } else {
        setError('Google Sign-In failed: No ID token');
      }

    } catch (error: any) {
      console.log('Google Sign-In Error', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Play Services not available');
      } else {
        setError(error.message || 'Google Sign-In failed');
      }
    }
  };

  const handleSignUp = async () => {
    console.log("Sign Up button pressed. handleSignUp function started!");
    setError("");
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      console.log("Validation Failed: One or more fields are empty.");
      return setError("Please fill in all fields.");
    }
    if (password !== confirmPassword) {
      console.log("Validation Failed: Passwords do not match.");
      return setError("Passwords do not match.");
    }
    console.log("Validation passed. Preparing to call API.");
    setIsLoading(true);
    try {
      await signUpWithEmail({ name: fullName, email, password });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to sign up.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Create account to continue</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.signUpButtonText}>Signing up</Text>}
          </TouchableOpacity>
          <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
          <TouchableOpacity style={styles.googleButton} onPress={onGooglePress}>
            <Image source={require("../../assets/images/google.png")} style={styles.googleIcon} contentFit="contain" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}><Text style={styles.signInLink}>Sign in</Text></TouchableOpacity>
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
    marginBottom: 20,
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
  signUpButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  signInButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
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
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    fontSize: 14,
    color: "#888888",
  },
  signUpText: {
    fontSize: 14,
    color: "#888888",
  },
  signInLink: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },
  signUpLink: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#888888",
  },
});