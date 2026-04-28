import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

export default function FillProfile1({ navigation }) {
  const [showModal, setShowModal] = useState(false);
  const [gender, setGender] = useState("");
  const [showGender, setShowGender] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [date, setDate] = useState(null);

  // 📸 image
  const [image, setImage] = useState(null);
  const [pickerModal, setPickerModal] = useState(false);

  const handleContinue = () => {
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
      navigation.replace("Home");
    }, 3000);
  };

  // 📷 Camera
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
      {/* Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={22} color="#000" />
      </TouchableOpacity>

      {/* 👤 Avatar */}
      <View style={styles.avatarWrapper}>
        {image ? (
          <Image source={{ uri: image }} style={styles.avatarContainer} />
        ) : (
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={50} color="#aaa" />
          </View>
        )}

        {/* ✏️ edit */}
        <TouchableOpacity
          style={styles.editIcon}
          onPress={() => setPickerModal(true)}
        >
          <Ionicons name="pencil" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Complete Your Profile</Text>

      {/* Inputs */}
      <View style={styles.inputsContainer}>
        <TextInput placeholder="Full Name" style={styles.input} />

        {/* Date */}
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowDate(true)}
        >
          <Text style={{ color: date ? "#000" : "#999" }}>
            {date ? date.toLocaleDateString() : "Date of Birth"}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#6E26EA" />
        </TouchableOpacity>

        {showDate && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDate(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <TextInput
          placeholder="Email Address"
          style={styles.input}
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Mobile Number"
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={11}
        />

        {/* Gender */}
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowGender(!showGender)}
        >
          <Text style={{ color: gender ? "#000" : "#999" }}>
            {gender || "Gender"}
          </Text>
          <Ionicons name="chevron-down-outline" size={20} color="#6E26EA" />
        </TouchableOpacity>

        {showGender && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              onPress={() => {
                setGender("Male");
                setShowGender(false);
              }}
            >
              <Text style={styles.dropItem}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setGender("Female");
                setShowGender(false);
              }}
            >
              <Text style={styles.dropItem}>Female</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      {/* 📸 Picker Modal */}
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

      {/* 🎉 Success Modal */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successBox}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={50} color="#fff" />
            </View>

            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalText}>
              Your account is ready to use. Redirecting...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "#fff",
    paddingTop: 100,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
  },

  /* 👤 AVATAR */
  avatarWrapper: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 20,
  },

  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },

  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#6C3BFF",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 25,
    textAlign: "center",
  },

  inputsContainer: {
    gap: 15,
  },

  input: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 14,
  },

  inputRow: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    elevation: 3,
  },

  dropItem: {
    padding: 10,
    fontSize: 14,
  },

  button: {
    backgroundColor: "#6C3BFF",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 40,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  /* 📸 IMAGE PICKER MODAL */
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalBox: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
  },

  optionBtn: {
    padding: 15,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  /* 🎉 SUCCESS MODAL */
  successBox: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
  },

  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6C3BFF",
    marginBottom: 10,
    textAlign: "center",
  },

  modalText: {
    textAlign: "center",
    color: "#555",
  },
});