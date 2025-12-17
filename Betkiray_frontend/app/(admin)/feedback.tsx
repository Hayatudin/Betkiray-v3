// app/(admin)/feedback.tsx (Settings Page)
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SettingOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "toggle" | "select";
  value?: boolean | string;
}

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoApproval, setAutoApproval] = useState(true);
  const [appearance, setAppearance] = useState("Light mode");
  const [reviewPeriod, setReviewPeriod] = useState("3 Days");
  const [showAppearanceDropdown, setShowAppearanceDropdown] = useState(false);
  const [showReviewPeriodDropdown, setShowReviewPeriodDropdown] =
    useState(false);

  const appearanceOptions = ["Light mode", "Dark mode"];
  const reviewPeriodOptions = ["1 Day", "2 Days", "3 Days", "5 Days", "7 Days"];

  const handleSave = () => {
    Alert.alert("Success", "Settings saved successfully!");
  };

  return (
    <ScrollView style={styles.container}>
      {/* General Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GENERAL SETTINGS</Text>

        {/* Push Notifications */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#5b9bd5" }]}
            >
              <Ionicons name="notifications" size={24} color="#fff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts and updates
              </Text>
            </View>
            <CustomSwitch
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#b19cd9" }]}
            >
              <Ionicons name="moon" size={24} color="#fff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Appearance</Text>
              <Text style={styles.settingDescription}>
                Choose the team you want
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.selectDropdown}
            onPress={() => setShowAppearanceDropdown(true)}
          >
            <Text style={styles.selectText}>{appearance}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Appearance Dropdown Modal */}
      <Modal
        transparent={true}
        visible={showAppearanceDropdown}
        onRequestClose={() => setShowAppearanceDropdown(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          onPress={() => setShowAppearanceDropdown(false)}
        >
          <View style={styles.dropdownMenu}>
            {appearanceOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownOption}
                onPress={() => {
                  setAppearance(option);
                  setShowAppearanceDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Property Rules Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROPERTY RULES</Text>

        {/* Auto Approval */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#ff9999" }]}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Auto Approval</Text>
              <Text style={styles.settingDescription}>
                Auto approve verified properties
              </Text>
            </View>
            <CustomSwitch
              value={autoApproval}
              onValueChange={setAutoApproval}
            />
          </View>
        </View>

        {/* Review Period */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#b19cd9" }]}
            >
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Review Period</Text>
              <Text style={styles.settingDescription}>
                Days to review new listings
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.selectDropdown}>
            <Text style={styles.selectText}>{reviewPeriod}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Custom Switch Component
const CustomSwitch = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <TouchableOpacity
    style={[styles.switchContainer, value ? styles.switchOn : styles.switchOff]}
    onPress={() => onValueChange(!value)}
  >
    <View
      style={[
        styles.switchThumb,
        value ? styles.switchThumbOn : styles.switchThumbOff,
      ]}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  settingDescription: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  selectDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  switchContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
  },
  switchOn: {
    backgroundColor: "#000",
  },
  switchOff: {
    backgroundColor: "#ccc",
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  switchThumbOn: {
    alignSelf: "flex-end",
  },
  switchThumbOff: {
    alignSelf: "flex-start",
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "80%",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#000",
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
