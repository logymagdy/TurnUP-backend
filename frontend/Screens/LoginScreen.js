import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen({ signIn }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

  const navigation = useNavigation();

  const saveUserToken = async (token) => {
    try {
      await SecureStore.setItemAsync("userToken", token);
    } catch (e) {
      console.error("Error saving token:", e);
    }
  };

  const handleLogin = async () => {
    await axios
      .post("http://localhost:3000/api/auth/login", {
        email,
        password,
      })
      .then((response) => {
        saveUserToken(response.data.token);
        signIn(email, password);
      })
      .catch((error) => {
        console.error("Login error:", error);
      });
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

  
      <View style={styles.logoContainer}>
        <Image
          source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
          style={styles.logo}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Glad to meet you again!, please login to use the app.
        </Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Username"
            placeholderTextColor="#999"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Email address"
            placeholderTextColor="#999"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={secure}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6E26EA"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot */}
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Button */}
        <TouchableOpacity onPress={handleLogin}>
          <LinearGradient colors={["#6E26EA", "#6E26EA"]} style={styles.button}>
            <Text style={styles.buttonText}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* OR */}
        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.or}>or</Text>
          <View style={styles.line} />
        </View>

        {/* Google */}
        <TouchableOpacity style={styles.socialBtn}>
          <FontAwesome name="google" size={18} color="#30a04a" />
          <Text style={styles.socialText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* Facebook */}
        <TouchableOpacity style={styles.socialBtn}>
          <FontAwesome name="facebook" size={18} color="#1877F2" />
          <Text style={styles.socialText}>Sign in with Facebook</Text>
        </TouchableOpacity>

        {/* Sign Up */}
        <Text style={styles.signUp}>
          Don’t have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("CreateAccount")}
          >
            Sign up
          </Text>
        </Text>
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


  logoContainer: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 20,
  },

  logo: {
    width: 190,
    height: 110,
    resizeMode: "contain",
  },

  content: {
    paddingHorizontal: 25,
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

  forgot: {
    color: "#6E26EA",
    textAlign: "right",
    marginBottom: 20,
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

  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee",
  },

  or: {
    marginHorizontal: 10,
    color: "#999",
  },

  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 30,
    padding: 15,
    marginBottom: 10,
    gap: 10,
  },

  socialText: {
    fontWeight: "500",
  },

  signUp: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },

  link: {
    color: "#6E26EA",
    fontWeight: "600",
  },
});