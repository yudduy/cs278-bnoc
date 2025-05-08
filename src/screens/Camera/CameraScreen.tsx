import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState, useEffect } from "react";
import {
  Button,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  Animated, // Import Animated
  // Dimensions // Import Dimensions if needed for layout calculations
} from "react-native";
import { Image } from "expo-image";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as MediaLibrary from "expo-media-library";

export default function App() {
  console.log("App component render START. State:", { uri, mode, facing, recording }); // Log state at start

  // Permissions Hooks
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  // State Hooks
  const ref = useRef<CameraView>(null); // Ref for CameraView component
  const [uri, setUri] = useState<string | null>(null); // Stores URI of captured media
  const [mode, setMode] = useState<CameraMode>("picture"); // 'picture' or 'video'
  const [facing, setFacing] = useState<CameraType>("back"); // 'front' or 'back'
  const [recording, setRecording] = useState(false); // Tracks if video is recording
  const [isVideoPreview, setIsVideoPreview] = useState(false); // Tracks if preview is for video

  // Animation Value
  const shutterAnimation = useRef(new Animated.Value(1)).current; // For shutter button opacity animation

  // Effect to request media library permission on mount if needed
  useEffect(() => {
    console.log("useEffect for Media Permission Check. Status:", mediaPermission);
    if (!mediaPermission?.granted && mediaPermission?.canAskAgain) {
      console.log("Requesting Media Library permission.");
      requestMediaPermission();
    }
  }, [mediaPermission]); // Re-run if mediaPermission status changes

  // --- Permission Handling ---
  // Initial state while checking camera permissions
  if (!cameraPermission) {
     console.log("Camera permissions initial state.");
    return <View />;
  }

  // Camera permissions not granted yet
  if (!cameraPermission.granted) {
    console.log("Camera permissions not granted.");
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera.
        </Text>
        <Button onPress={requestCameraPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  // --- Media Saving Function ---
  const saveMedia = async (mediaUri: string | undefined, type: 'photo' | 'video') => {
    console.log(`saveMedia called. URI: ${mediaUri}, Type: ${type}`);
    if (!mediaUri) {
        console.warn("saveMedia: No media URI provided.");
        return;
    }

    // Check media library permission status again before saving
    if (!mediaPermission?.granted) {
      console.warn("saveMedia: Media Library permission not granted.");
      Alert.alert(
        "Permission Required",
        "We need permission to save to your media library.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Permission", onPress: requestMediaPermission }, // Ask again
        ]
      );
      return; // Stop if no permission
    }

    try {
      console.log("Attempting to save media to library...");
      await MediaLibrary.saveToLibraryAsync(mediaUri);
      console.log("Media saved successfully.");
      Alert.alert("Saved!", `${type === 'photo' ? 'Photo' : 'Video'} saved to gallery.`);
    } catch (error) {
      console.error("Error saving media: ", error);
      Alert.alert("Error", `Could not save ${type === 'photo' ? 'photo' : 'video'}.`);
    }
  };

  // --- Camera Actions ---

  // Take Picture Function (with Animation)
  const takePicture = async () => {
    console.log("takePicture called.");
    // Ensure ref exists and we are in picture mode
    if (!ref.current || mode !== 'picture') {
        console.warn("takePicture: Ref not ready or not in picture mode.");
        return;
    }

    console.log("Starting shutter animation.");
    // Start shutter animation (fade out, then back in)
    Animated.sequence([
      Animated.timing(shutterAnimation, {
        toValue: 0,         // Target opacity 0 (fade out)
        duration: 100,      // Duration of fade out
        useNativeDriver: true, // Use native driver for performance
      }),
      Animated.timing(shutterAnimation, {
        toValue: 1,         // Target opacity 1 (fade back in)
        duration: 200,      // Duration of fade in
        useNativeDriver: true,
      }),
    ]).start(); // Don't await the animation, let it run while capturing

    try {
      console.log("Calling ref.current.takePictureAsync()...");
      const photo = await ref.current.takePictureAsync();
      console.log("Picture taken successfully. URI:", photo?.uri);
      setUri(photo?.uri);
      setIsVideoPreview(false); // It's a photo preview
      // Automatically try to save after taking
      saveMedia(photo?.uri, 'photo');
    } catch (error) {
        console.error("Error taking picture: ", error); // Log the full error
        Alert.alert("Error", "Could not take picture.");
        // Reset animation in case of error? Generally not needed as it completes.
        // shutterAnimation.setValue(1);
    }
  };

  // Record Video Function
  const recordVideo = async () => {
    console.log(`recordVideo called. Currently recording: ${recording}`);
    if (!ref.current) {
        console.warn("recordVideo: Ref not ready.");
        return;
    }

    // If currently recording, stop recording
    if (recording) {
      console.log("Stopping recording...");
      setRecording(false);
      ref.current.stopRecording(); // stopRecording resolves the recordAsync promise below
      console.log("stopRecording called.");
      return;
    }

    // Start recording
    setRecording(true);
    console.log("Starting recording...");
    try {
        // Start recording and wait for the promise to resolve (when stopRecording is called)
        const recordingPromise = ref.current.recordAsync();
        console.log("recordAsync called, awaiting promise resolution...");
        const video = await recordingPromise;
        console.log("Recording finished (promise resolved). URI:", video?.uri);
        setUri(video?.uri);
        setIsVideoPreview(true); // It's a video preview
        // Automatically try to save after recording stops
        saveMedia(video?.uri, 'video');

    } catch (error) {
        console.error("Error recording video: ", error); // Log the full error
        Alert.alert("Error", "Could not record video.");
        setRecording(false); // Reset recording state on error
    }
  };

  // --- UI Toggles ---

  // Toggle between Picture and Video mode
  const toggleMode = () => {
    console.log("toggleMode called.");
    setMode((prev) => {
        const nextMode = prev === "picture" ? "video" : "picture";
        console.log(`Mode changing from ${prev} to ${nextMode}`);
        return nextMode;
    });
  };

  // Toggle between Front and Back camera
  const toggleFacing = () => {
    console.log("toggleFacing called.");
    setFacing((prev) => {
        const nextFacing = prev === "back" ? "front" : "back";
        console.log(`Facing changing from ${prev} to ${nextFacing}`);
        return nextFacing;
    });
  };

  const handleRetake = () => {
    console.log("handleRetake called.");
    // --- Introduce Delay ---
    // Wrap the state update in a short timeout
    setTimeout(() => {
        console.log("handleRetake: Setting uri to null after delay.");
        setUri(null);
        // Reset video/photo flag might be good practice here too
        setIsVideoPreview(false);
        console.log("handleRetake: setUri(null) called, component should re-render with camera.");
    }, 1000); // 100ms delay (adjust if needed, 50-150ms is typical)
  };
  // --- Render Functions ---

  // Render Preview Screen (after taking photo/video)
  const renderPreview = () => {
    console.log("Rendering Preview Screen. URI:", uri, "IsVideo:", isVideoPreview);
    return (
      <View style={styles.previewContainer}>
        {/* Conditional rendering for Image or Video placeholder */}
        {isVideoPreview ? (
            <View style={styles.videoPreview}>
                <Feather name="video" size={100} color="black" />
                <Text style={{marginTop: 10}}>Video Recorded</Text>
                <Text style={{fontSize: 10, color: 'grey'}}>(Check Gallery)</Text>
            </View>
        ) : (
          <Image
            source={{ uri }} // uri should be valid string here
            contentFit="contain"
            style={styles.previewImage}
            onError={(e) => console.error("Error loading preview image:", e.error)} // Add error handler for Image
          />
        )}

        {/* Display the captured media URI */}
        {uri && (
            <View style={styles.uriContainer}>
                <Text style={styles.uriLabel}>Media URI:</Text>
                {/* Make the URI text selectable */}
                <Text style={styles.uriText} selectable={true}>
                    {uri}
                </Text>
            </View>
        )}

        {/* Button to go back to camera */}
        <View style={styles.previewButtonContainer}>
           <Button onPress={handleRetake} title={isVideoPreview ? "Record Another Video" : "Take Another Picture"} />
           {/* Optional: Add a manual save button if needed */}
           {/* <Button onPress={() => saveMedia(uri, isVideoPreview ? 'video' : 'photo')} title="Save Again" /> */}
        </View>
      </View>
    );
  };

  // Render Camera Screen
  const renderCamera = () => {
    console.log("Rendering CameraView component START.");
    try { // Wrap in try/catch for potential render errors, though less common
        return (
          <CameraView
            style={styles.camera}
            ref={ref}
            mode={mode}
            facing={facing}
            enableAudio={mode === 'video'} // Enable audio only for video mode
            responsiveOrientationWhenOrientationLocked
            // --- Add logging for camera lifecycle events ---
            onCameraReady={() => console.log("CameraView: Event -> onCameraReady")}
            onMountError={(error) => console.error("CameraView: Event -> onMountError", error)} // Crucial for debugging crashes
            // ---
          >
            {/* Bottom controls container */}
            <View style={styles.shutterContainer}>
              {/* Mode Toggle Button */}
              <Pressable onPress={toggleMode} disabled={recording} style={styles.controlButton}>
                {mode === "picture" ? (
                  <AntDesign name="picture" size={32} color={recording ? "grey" : "white"} />
                ) : (
                  <Feather name="video" size={32} color={recording ? "grey" : "white"} />
                )}
              </Pressable>

              {/* Shutter Button */}
              <Pressable onPress={mode === "picture" ? takePicture : recordVideo}>
                {({ pressed }) => (
                  <View
                    style={[
                      styles.shutterBtn,
                      {
                        opacity: pressed ? 0.7 : 1, // General pressed feedback
                        borderColor: recording ? "red" : "white", // Red border when recording
                      },
                    ]}
                  >
                    {/* Inner part of the shutter button - Animated for picture mode */}
                    <Animated.View // Use Animated.View for opacity animation
                      style={[
                        styles.shutterBtnInner,
                        {
                          backgroundColor: mode === "picture" ? "white" : "red",
                          // Dynamic styling for video recording state
                          borderRadius: recording ? 10 : (mode === 'picture' ? 35 : 35), // Square when recording video, circle otherwise
                          width: recording ? 35 : 70,
                          height: recording ? 35 : 70,
                          // Apply shutterAnimation opacity ONLY in picture mode
                          opacity: mode === 'picture' ? shutterAnimation : 1,
                        },
                      ]}
                    />
                  </View>
                )}
              </Pressable>

              {/* Facing Toggle Button */}
              <Pressable onPress={toggleFacing} disabled={recording} style={styles.controlButton}>
                <FontAwesome6 name="rotate-left" size={32} color={recording ? "grey" : "white"} />
              </Pressable>
            </View>
          </CameraView>
        );
    } catch (renderError) {
        console.error("Error rendering CameraView component:", renderError);
        return <Text>Error rendering camera. Please check logs.</Text>; // Fallback UI
    } finally {
        console.log("Rendering CameraView component END.");
    }
  };

  // --- Main Return ---
  console.log("App component render END. Determining view based on URI:", uri);
  return (
    <View style={styles.container}>
      {/* Conditionally render Preview or Camera based on URI state */}
      {uri ? renderPreview() : renderCamera()}
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Use black background for camera view consistency
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
    color: 'white', // Ensure text is visible on black background
  },
  camera: {
    flex: 1,
    width: "100%", // Camera should fill the screen width
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Lighter background for preview area
  },
  previewImage: {
    width: '90%', // Leave some margin
    aspectRatio: 3 / 4, // Common photo aspect ratio, adjust if needed
    backgroundColor: '#ddd', // Placeholder background while loading
  },
  videoPreview: {
    width: '90%',
    aspectRatio: 3 / 4, // Match image aspect ratio
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Slightly different background for video placeholder
    borderRadius: 10,
  },
  uriContainer: {
    marginTop: 15, // Space above URI
    marginBottom: 20, // Space below URI, before button
    paddingHorizontal: 20,
    alignItems: 'center',
    maxWidth: '90%', // Prevent very long URIs from overflowing badly
  },
  uriLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  uriText: {
    fontSize: 11, // Smaller font for potentially long URIs
    color: '#555',
    textAlign: 'center',
    // Consider adding line breaks for very long URIs if needed
    // wordBreak: 'break-all', // Not standard in React Native Text, handle manually if required
  },
  previewButtonContainer: {
    // Add styling here if you need to position the button differently
  },
  shutterContainer: {
    position: "absolute",
    bottom: 40, // Adjust vertical position as needed
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around", // Distribute controls evenly
    paddingHorizontal: 20, // Padding on the sides
    backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent background for controls
    paddingVertical: 15, // Vertical padding for the control bar
    zIndex: 10, // Ensure controls are above the camera view
  },
  // Style for side control buttons (mode/facing toggle) for consistent sizing/touch area
  controlButton: {
      padding: 10, // Add padding to increase touchable area
  },
  shutterBtn: {
    backgroundColor: "transparent", // Outer ring is transparent
    borderWidth: 4, // Thickness of the outer ring
    borderColor: "white", // Default border color
    width: 80, // Size of the outer ring
    height: 80,
    borderRadius: 40, // Make it a circle
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    // Inner button styles (width, height, borderRadius, backgroundColor, opacity)
    // are applied dynamically within the Animated.View component based on mode/recording state.
  },
});
