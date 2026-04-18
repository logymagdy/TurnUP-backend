import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={26} color="#000" />
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
        style={styles.logo}
      />

      {/* Title */}
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive an OTP code.
      </Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#999" />
        <TextInput
          placeholder="Email address"
          placeholderTextColor="#999"
          style={styles.input}
        />
      </View>


      {/* Button */}
      <TouchableOpacity onPress={() => navigation.navigate("Otp")}>
        <LinearGradient
          colors={["#7B3FF2", "#5F2EEA"]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Send Code</Text>
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 80,
    backgroundColor: "#fff",
  },

  logo: {
    width: 200,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#777",
    marginBottom: 25,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 30,
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    padding: 12,
    marginLeft: 10,
  },

  switch: {
    color: "#7B3FF2",
    textAlign: "right",
    marginBottom: 25,
    fontSize: 13,
  },

  button: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },
});