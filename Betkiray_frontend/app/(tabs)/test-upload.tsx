// import { useAppState } from "@/contexts/AppStateContext";
// import { Ionicons } from "@expo/vector-icons";
// import * as ImagePicker from "expo-image-picker";
// import React, { useState } from "react";
// import {
//   Alert,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   ActivityIndicator,
//   Image,
// } from "react-native";

// export default function TestUploadScreen() {
//   const { addProperty } = useAppState();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [photos, setPhotos] = useState<string[]>([]);

//   const pickTestImages = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission Required", "Please grant camera roll permissions.");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets) {
//       if (result.assets.length !== 3) {
//         Alert.alert("Please select exactly 3 images for this test.");
//         return;
//       }
//       const imageUris = result.assets.map((asset) => asset.uri);
//       setPhotos(imageUris);
//     }
//   };

//   const runTest = async () => {
//     if (photos.length !== 3) {
//       Alert.alert("Test Error", "Please pick exactly 3 images before running the test.");
//       return;
//     }
//     setIsSubmitting(true);

//     const formData = new FormData();

//     // 1. Hardcoded, valid test data
//     formData.append('title', 'Test Property Title');
//     formData.append('description', 'This is a description from the test file.');
//     formData.append('address', '123 Test Street');
//     formData.append('city', 'Addis Ababa');
//     formData.append('latitude', '9.03');
//     formData.append('longitude', '38.75');
//     formData.append('price', '5000');
//     formData.append('billingPeriod', 'MONTHLY');
//     formData.append('propertyType', 'APARTMENT');
//     formData.append('bedrooms', '2');
//     formData.append('bathrooms', '1');
//     formData.append('isFurnished', 'true');
//     formData.append('isNegotiable', 'false');
//     formData.append('areaSqm', '75');

//     // 2. Append the selected images
//     photos.forEach((photoUri) => {
//       const uriParts = photoUri.split('.');
//       const fileType = uriParts[uriParts.length - 1];
//       formData.append('images', {
//         uri: photoUri,
//         name: `test_photo_${Date.now()}.${fileType}`,
//         type: `image/${fileType}`,
//       } as any);
//     });

//     console.log("--- [FRONTEND TEST] SUBMITTING FormData ---");
//     // To see the text fields in your Expo Go console, you can iterate like this:
//     // formData.forEach((value, key) => {
//     //   if (key !== 'images') {
//     //     console.log(key, value);
//     //   }
//     // });


//     // 3. Submit the data
//     try {
//       const newProperty = await addProperty(formData);
//       Alert.alert("--- TEST SUCCEEDED! ---", `Property created with ID: ${newProperty.id}`);
//     } catch (error: any) {
//       console.error("--- [FRONTEND TEST] FAILED ---", error.response?.data);
//       const messages = error.response?.data?.message || ["An error occurred."];
//       Alert.alert(
//         "--- TEST FAILED ---",
//         Array.isArray(messages) ? messages.join('\n') : String(messages)
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Upload Test Screen</Text>
//       <Text style={styles.subtitle}>
//         This screen bypasses the form to test the upload functionality directly.
//       </Text>

//       <TouchableOpacity style={styles.button} onPress={pickTestImages}>
//         <Ionicons name="camera" size={20} color="#fff" />
//         <Text style={styles.buttonText}>
//           Step 1: Pick Exactly 3 Images
//         </Text>
//       </TouchableOpacity>

//       {photos.length > 0 && (
//         <View style={styles.imagePreviewContainer}>
//           {photos.map((uri, index) => (
//             <Image key={index} source={{ uri }} style={styles.previewImage} />
//           ))}
//           <Text style={styles.imageCountText}>3 images selected ✓</Text>
//         </View>
//       )}

//       <TouchableOpacity
//         style={[styles.button, styles.runButton, (photos.length !== 3 || isSubmitting) && styles.disabledButton]}
//         onPress={runTest}
//         disabled={photos.length !== 3 || isSubmitting}
//       >
//         {isSubmitting ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <>
//             <Ionicons name="rocket" size={20} color="#fff" />
//             <Text style={styles.buttonText}>
//               Step 2: Run Upload Test
//             </Text>
//           </>
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 40,
//   },
//   button: {
//     flexDirection: 'row',
//     backgroundColor: '#007AFF',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 20,
//     width: '100%',
//   },
//   runButton: {
//     backgroundColor: '#34C759',
//   },
//   disabledButton: {
//     backgroundColor: '#ccc',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     marginLeft: 10,
//     fontWeight: '600',
//   },
//   imagePreviewContainer: {
//     flexDirection: 'row',
//     marginBottom: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   previewImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 8,
//     marginHorizontal: 5,
//     backgroundColor: '#eee',
//   },
//   imageCountText: {
//     marginTop: 10,
//     color: 'green',
//     fontWeight: 'bold',
//     position: 'absolute',
//     bottom: -30,
//   },
// });