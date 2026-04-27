import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BusinessProfileScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false);

  const handleContinue = () => {
    setShowModal(true);

    setTimeout(() => {
      setShowModal(false);
      navigation.replace("bushome");
    }, 3000);
  };

  return (
    <View style={styles.container}>

      {/* Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.content}>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Ionicons name="person" size={50} color="#aaa" />
          <TouchableOpacity style={styles.editIcon}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Complete Your Business Profile</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Add your business details to get started
        </Text>

        {/* Inputs */}
        <TextInput
          placeholder="Business Name"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <TextInput
          placeholder="Business Category (Barbershop / Salon)"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <TextInput
          placeholder="City"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <TextInput
          placeholder="Mobile Number"
          placeholderTextColor="#999"
          style={styles.input}
        />

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

      </View>

      {/* 🎉 POPUP */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={50} color="#fff" />
            </View>

            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalText}>
              Your business account is ready .You will be redirected to the setup process.
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
    backgroundColor: "#fff",
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

  content: {
    marginTop: 100,
    paddingHorizontal: 25,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },

  profileImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F3F4F6",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6C3BFF",
    borderRadius: 15,
    padding: 5,
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#6C3BFF",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  /* 🎉 POPUP */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
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
  },

  modalText: {
    textAlign: "center",
    color: "#555",
  },
});