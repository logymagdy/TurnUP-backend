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
        <Ionicons name="arrow-back" size={22} color="#000" />
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
          style={styles.logo}
        />
      </View>

      {/* Content Wrapper */}
      <View style={styles.flexArea}>
        <View style={styles.content}>
          
          <Text style={styles.title}>Forgot password</Text>

          <Text style={styles.subtitle}>
            Enter your business email to reset your password
          </Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6E26EA" />
            <TextInput
              placeholder="Email address"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          {/* Button */}
          <TouchableOpacity onPress={() => navigation.navigate("verify")}>
            <LinearGradient
              colors={["#6E26EA", "#6E26EA"]}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Send Code</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </View>

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

  /* ✅ نفس Login */
  logoContainer: {
    alignItems: "center",
    marginTop: 100, // 👈 نزلناه شوية
    marginBottom: 20,
  },

  logo: {
    width: 200,
    height: 120,
    resizeMode: "contain",
  },

  /* 👇 ده السر */
  flexArea: {
    flex: 1,
    justifyContent: "flex-start",
  },

  content: {
    paddingHorizontal: 25,
    marginTop: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#777",
    marginBottom: 25,
    lineHeight: 20,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 30,
    paddingHorizontal: 15,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    padding: 12,
    marginLeft: 10,
    color: "#000",
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
});