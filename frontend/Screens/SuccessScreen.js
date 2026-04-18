import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SuccessScreen({ navigation }) {
  const [showModal, setShowModal] = useState(true);
useEffect(() => {
  const timer = setTimeout(() => {
    setShowModal(false);
    navigation.replace("busHome");
  }, 2000);

  return () => clearTimeout(timer);
}, []);
  return (
    <View style={styles.container}>

      {/* Logo */}
      <Image
        source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Fill Your Profile</Text>

      {/* Fake Profile Shape */}
      <View style={styles.profileCircle}>
        <Ionicons name="person" size={70} color="#bbb" />
      </View>

      {/* Continue Button (background) */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      {/* Modal Popup */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.overlay}>

          <View style={styles.popup}>

            <Text style={styles.popupTitle}>Congratulations!</Text>

            <Text style={styles.popupText}>
              Your business account is ready.{"\n"}
              You will be redirected to the setup process.
            </Text>

            {/* Check Icon */}
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={30} color="#fff" />
            </View>

          </View>

        </View>
      </Modal>
 
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  logo: {
    width: 400,
  height: 200,
  resizeMode: "contain",
  alignSelf: "center",
  marginBottom: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },

  profileCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },

  button: {
    backgroundColor: "#6C3BFF",
    padding: 15,
    borderRadius: 30,
    width: "80%",
    alignItems: "center",
    margin:20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },

  popupTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6C3BFF",
    marginBottom: 10,
  },

  popupText: {
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },

  checkCircle: {
    backgroundColor: "#22C55E",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

});