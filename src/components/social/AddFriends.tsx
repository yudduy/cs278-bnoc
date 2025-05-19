/**
 * AddFriends Component
 *
 * Empty state component shown when user has no friends yet.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../config/theme";
import { Ionicons } from "@expo/vector-icons";

interface AddFriendsProps {
  onAddFriends?: () => void;
}

const AddFriends: React.FC<AddFriendsProps> = ({ onAddFriends }) => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  // Calculate container width based on screen size
  const containerWidth = Math.min(width, 480);

  const handleAddFriends = () => {
    if (onAddFriends) {
      onAddFriends();
    } else {
      // @ts-ignore - navigation typing
      navigation.navigate("Discovery");
    }
  };

  return (
    <View style={[styles.container, { width: containerWidth }]}>
      {/* Profile Image */}
      <Image
        source={{
          uri: "https://cdn.builder.io/api/v1/image/assets/b919e5bb8ba74dd4a52eac3a982dce82/b10907f72adfa0eee0fce437b528b92c607645d4?placeholderIfAbsent=true",
        }}
        style={styles.profileImage}
        contentFit="contain"
        transition={200}
      />

      {/* Navigation Bar */}
      <View style={styles.navContainer}>
        <View style={styles.navBar}>
          <TouchableOpacity>
            <Image
              source={{
                uri: "https://cdn.builder.io/api/v1/image/assets/b919e5bb8ba74dd4a52eac3a982dce82/d1db89c21de0d48177e2a842598a51f8266ce851?placeholderIfAbsent=true",
              }}
              style={styles.navIcon}
              contentFit="contain"
              transition={200}
            />
          </TouchableOpacity>

          <Image
            source={{
              uri: "https://cdn.builder.io/api/v1/image/assets/b919e5bb8ba74dd4a52eac3a982dce82/96d8472898e2af79ed2e9c2ad04a3a0872411d45?placeholderIfAbsent=true",
            }}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />

          <TouchableOpacity>
            <Image
              source={{
                uri: "https://cdn.builder.io/api/v1/image/assets/b919e5bb8ba74dd4a52eac3a982dce82/20e3cd344b1bfd38e1df211b2382aacbc8c1cdc6?placeholderIfAbsent=true",
              }}
              style={styles.navIcon}
              contentFit="contain"
              transition={200}
            />
          </TouchableOpacity>
        </View>

        {/* Navigation Labels */}
        <View style={styles.navLabels}>
          <Text style={styles.navLabel}>My Friends</Text>
          <Text style={styles.navLabel}>Discovery</Text>
        </View>
      </View>

      {/* Empty State Message */}
      <View style={styles.emptyStateContainer}>
        <Text style={styles.emptyStateText}>
          Add at least 5 friends to get started!
        </Text>

        <TouchableOpacity
          style={styles.addFriendsButton}
          onPress={handleAddFriends}
          activeOpacity={0.8}
        >
          <Text style={styles.addFriendsText}>Add friends</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: 480,
    width: "100%",
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 385, android: 365 }),
  },
  profileImage: {
    width: 54,
    height: 54 / 2.57, // Maintain aspect ratio
    borderRadius: 32,
    marginLeft: 21,
  },
  navContainer: {
    marginTop: 11,
    minHeight: 68,
    width: "100%",
  },
  navBar: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
  },
  navIcon: {
    width: 28,
    height: 28,
    borderRadius: 50,
  },
  logo: {
    width: 76,
    height: 76 / 4.46, // Maintain aspect ratio
  },
  navLabels: {
    width: "100%",
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  navLabel: {
    fontFamily: Platform.select({ ios: "-apple-system", android: "Roboto" }),
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: 0.08,
    color: COLORS.text,
  },
  emptyStateContainer: {
    alignItems: "center",
    marginTop: 273,
  },
  emptyStateText: {
    fontFamily: Platform.select({ ios: "-apple-system", android: "Roboto" }),
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: 0.07,
    color: COLORS.text,
  },
  addFriendsButton: {
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
    width: 142,
  },
  addFriendsText: {
    fontFamily: Platform.select({ ios: "-apple-system", android: "Roboto" }),
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: -0.24,
    color: COLORS.background,
  },
});

export default AddFriends;
