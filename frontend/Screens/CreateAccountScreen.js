import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

export default function CreateAccountScreen({ navigation }) {
  const [secure, setSecure] = useState(true);

  return (
    <View style={styles.container}>

      {/* Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={26} color="black" />
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
        style={styles.logo}
      />

      {/* Title */}
      <Text style={styles.title}>Create an account</Text>
      <Text style={styles.subtitle}>
        Enter your details below to create your account
      </Text>

      {/* Name */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#999" />
        <TextInput placeholder="Name" style={styles.textInput} />
      </View>

      {/* Email */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#999" />
        <TextInput placeholder="Email address" style={styles.textInput} />
      </View>

      {/* Phone */}
      <View style={styles.inputContainer}>
        <Ionicons name="call-outline" size={20} color="#999" />
        <TextInput placeholder="Mobile number" style={styles.textInput} />
      </View>

      {/* Password */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#999" />
        <TextInput
          placeholder="Password"
          secureTextEntry={secure}
          style={styles.textInput}
        />
        <TouchableOpacity onPress={() => setSecure(!secure)}>
          <Ionicons
            name={secure ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Terms */}
      <Text style={styles.terms}>
        By signing up you agree to our{" "}
        <Text style={styles.link}>Terms</Text> and{" "}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>

      {/* Sign Up */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("FillProfile1")}
      >
        <Text style={styles.buttonText}>Sign up</Text>
      </TouchableOpacity>

      {/* OR Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.line} />
      </View>

      {/* Google */}
      <TouchableOpacity style={styles.socialBtn}>
        <FontAwesome name="google" size={18} color="#30a04a" />
        <Text style={styles.socialText}>Sign in with Google</Text>
      </TouchableOpacity>

      {/* Sign In */}
      <Text style={styles.signIn}>
        Already have an account?{" "}
        <Text
          style={styles.link}
          onPress={() => navigation.navigate("Login")}
        >
          Sign in
        </Text>
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 25,
    paddingTop: 60,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

  logo: {
    width: 200,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
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
    marginTop: 5,
    marginBottom: 25,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 12,
  },

  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },

  terms: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginVertical: 15,
  },

  link: {
    color: "#6C3BFF",
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#6C3BFF",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 5,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  orText: {
    marginHorizontal: 10,
    color: "#999",
    fontSize: 12,
  },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 30,
    gap: 10,
  },

  socialText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  signIn: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
  },
});