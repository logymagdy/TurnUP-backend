import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";

export default function ProfileScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false);
  const [image, setImage] = useState(null);
  const [pickerModal, setPickerModal] = useState(false); // 👈 اختيار camera/gallery

  // 📸 فتح الكاميرا
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true, // ✨ crop
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }

    setPickerModal(false);
  };

  // 🖼️ فتح الجاليري
  const openGallery = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true, // ✨ crop
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }

    setPickerModal(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 👤 AVATAR */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {image ? (
              <Image source={{ uri: image }} style={styles.avatarCircle} />
            ) : (
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={60} color="#aaa" />
              </View>
            )}

            {/* ✏️ edit */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setPickerModal(true)}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>Nour Eltoukhy</Text>
          <Text style={styles.email}>noureltoukhy2004@gmail.com</Text>

          {/* ACTIONS */}
          <View style={styles.actions}>
  <TouchableOpacity
    style={styles.actionItem}
    onPress={() => navigation.navigate("Booking")}
  >
    <Ionicons name="calendar-outline" size={22} color="#6C3BFF" />
    <Text style={styles.actionText}>My Booking</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.actionItem}
    onPress={() => navigation.navigate("Points")}
  >
    <Ionicons name="cash-outline" size={22} color="#6E26EA" />
    <Text style={styles.actionText}>Points</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.actionItem}
    onPress={() => navigation.navigate("Rewards")}
  >
    <Ionicons name="pricetags-outline" size={22} color="#6E26EA" />
    <Text style={styles.actionText}>Rewards</Text>
  </TouchableOpacity>
</View>

          {/* LIST */}
          {[
            { title: "Edit Profile", screen: "EditProfile" },
            { title: "Notification", screen: "Notifications" },
            { title: "Payment Method", screen: "paymentmethod" },
            { title: "Languages", screen: "Languages" },
            { title: "Privacy Policy", screen: "PrivacyPolicy" },
            { title: "Invite Friends", screen: "InviteFriends" },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.listItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.listText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={"#6E26EA"}/>
            </TouchableOpacity>
          ))}

          {/* LOGOUT */}
          <TouchableOpacity
            style={styles.logout}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.logoutText}>Logout</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 📸 اختيار الصورة */}
      <Modal visible={pickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>Choose Image</Text>

            <TouchableOpacity style={styles.optionBtn} onPress={openCamera}>
              <Text>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtn} onPress={openGallery}>
              <Text>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionBtn, { marginTop: 10 }]}
              onPress={() => setPickerModal(false)}
            >
              <Text style={{ color: "red" }}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* 🔴 LOGOUT MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Log out</Text>
            <Text style={styles.modalText}>
              Are you sure you want to log out?
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={{ color: "#7B3FE4" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.activeBtn]}
                onPress={() => {
                  setShowModal(false);
                  navigation.replace("Login");
                }}
              >
                <Text style={{ color: "#fff" }}>Yes, log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  scrollContent: { paddingBottom: 120 },

  avatarSection: { alignItems: "center", marginTop: 20 },

  avatarWrapper: { position: "relative" },

  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },

  editBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#7B3FE4",
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  content: { paddingHorizontal: 16, marginTop: 10 },

  name: { textAlign: "center", fontWeight: "600", fontSize: 18 },

  email: {
    textAlign: "center",
    fontSize: 12,
    color: "#777",
    marginBottom: 20,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 20,
    marginBottom: 20,
  },

  actionItem: { alignItems: "center" },

  actionText: { fontSize: 12, marginTop: 5 },

  listItem: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  listText: { fontSize: 14, fontWeight: "500" },

  logout: {
    backgroundColor: "#F25C5C",
    padding: 18,
    borderRadius: 25,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  logoutText: { color: "#fff", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  modalTitle: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 15,
  },

  optionBtn: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },

  modalText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },

  modalBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#7B3FE4",
  },

  activeBtn: { backgroundColor: "#7B3FE4" },
});