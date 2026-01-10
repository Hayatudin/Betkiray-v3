import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  SafeAreaView,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    image: require("../assets/images/onboarding-1.png"),
    title: "Find your next\nSpace or list your\nproperty in seconds",
    subtitle: "",
    isWelcome: true, // Special layout for first screen
  },
  {
    id: "2",
    image: require("../assets/images/onboarding-2.png"),
    title: "Browse thousands\nof spaces",
    subtitle: "Discover amazing places to stay,\nwork, or host your next event in\nyour area",
  },
  {
    id: "3",
    image: require("../assets/images/onboarding-3.png"),
    title: "Chat or call the\nowner instantly",
    subtitle: "Connect directly with property\nowners for quick answers and\nsmooth bookings",
  },
  {
    id: "4",
    image: require("../assets/images/onboarding-4.png"),
    title: "Post your property\nin minutes",
    subtitle: "List your space quickly with our\nsimple tools and start earning right\naway",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = () => {
    router.replace("/(auth)/sign-in");
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={styles.slide}>
        {/* Logo and Brand Name on first screen */}
        {item.isWelcome && (
          <View style={styles.logoContainer}>
             <Image
              source={require("../assets/images/Betkiray-Logo-.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.brandName}>Betes</Text>
          </View>
        )}

        <View style={[styles.imageContainer, !item.isWelcome && styles.imageContainerOther]}>
          <Image
            source={item.image}
            style={styles.image}
            contentFit="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.flatList}
      />

      <View style={styles.bottomContainer}>
        {/* Pagination Dots */}
        {currentIndex > 0 && (
          <View style={styles.pagination}>
            {onboardingData.slice(1).map((_, index) => {
               // Adjust index to match data slice (0, 1, 2)
               // Actual data indices are 1, 2, 3
               const isActive = currentIndex === index + 1;
               return (
                <View
                  key={index}
                  style={[styles.dot, isActive && styles.activeDot]}
                />
              );
            })}
          </View>
        )}

        {/* Buttons */}
        {currentIndex === 0 ? (
          <View style={styles.fullWidthButtonContainer}>
            <TouchableOpacity style={styles.getStartedButton} onPress={handleNext}>
              <Text style={styles.getStartedText}>Get started</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.navigationContainer}>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
               <Ionicons name="arrow-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: width,
    height: height,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: height * 0.1, // Push content up from bottom
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  imageContainer: {
    width: width * 0.75,
    height: height * 0.38,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  imageContainerOther: {
    marginTop: height * 0.08, // Extra top gap for non-welcome screens
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    width: width * 0.85,
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.15, // Space for buttons
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  fullWidthButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%',
    paddingBottom: 20,
  },
  skipText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  pagination: {
    position: 'absolute',
    bottom: 50, // above buttons? or between?
    // Design shows dots in middle of bottom area
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333333",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
    width: 8, // Design doesn't show expanded width, just color change
  }
});
