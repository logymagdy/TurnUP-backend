import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import AppHeader from "../components/AppHeader";

export default function EditProfile({ navigation }) {
  const [gender, setGender] = useState("");
  const [open, setOpen] = useState(false);

  const [image, setImage] = useState(null);
  const [pickerModal, setPickerModal] = useState(false);

  // 📸 Camera
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }

    setPickerModal(false);
  };

  // 🖼️ Gallery
  const openGallery = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
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
      {/* 🔥 Header */}
      <AppHeader title="Edit Profile" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 👤 Avatar */}
        <View style={styles.avatarWrapper}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color="#aaa" />
            </View>
          )}

          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => setPickerModal(true)}
          >
            <Ionicons name="pencil" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Inputs + Button */}
        <View style={styles.content}>
          {[
            "Full name",
            "Date of Birth",
            "Email address",
            "Mobile number",
            "Address",
          ].map((item, i) => (
            <TextInput
              key={i}
              placeholder={item}
              style={styles.input}
              placeholderTextColor="#999"
            />
          ))}

          {/* Gender */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setOpen(!open)}
          >
            <Text style={{ color: gender ? "#000" : "#999" }}>
              {gender || "Gender"}
            </Text>
            <Ionicons name="chevron-down-outline" size={18} />
          </TouchableOpacity>

          {open && (
            <View style={styles.dropdownList}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setGender("Male");
                  setOpen(false);
                }}
              >
                <Text>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setGender("Female");
                  setOpen(false);
                }}
              >
                <Text>Female</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🔥 BUTTON */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Profile")}
          >
            <LinearGradient
              colors={["#7B3FE4", "#6E26EA"]}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 📸 PICKER MODAL */}
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
              style={styles.optionBtn}
              onPress={() => setPickerModal(false)}
            >
              <Text style={{ color: "red" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  /* 👤 Avatar */
  avatarWrapper: {
    alignSelf: "center",
    position: "relative",
    marginTop: 20,
    marginBottom: 25,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },

  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#7B3FE4",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  content: {
    paddingHorizontal: 16,
  },

  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },

  dropdown: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 15,
  },

  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  button: {
    marginTop: 10,
    marginBottom: 30,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  /* 📸 Modal */
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
    fontWeight: "600",
    marginBottom: 15,
  },

  optionBtn: {
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});