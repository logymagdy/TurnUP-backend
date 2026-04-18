import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image

} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CreateAccountScreen({ navigation }) {
  return (
    <View style={styles.container}>

    <TouchableOpacity
  onPress={() => navigation.goBack()}
  style={styles.backButton}
>
  <Ionicons name="arrow-back" size={28} color="black" />
</TouchableOpacity>

      {/* Logo */}
      <Image
        source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
        style={styles.logo}
      />

      {/* Title */}
      <Text style={styles.title}>Create Business Account</Text>
      <Text style={styles.subtitle}>
Create an account to manage your barbershop or salon.      </Text>

      {/* Inputs */}
      <TextInput placeholder="Full Name" style={styles.input} />
      <TextInput placeholder="Email address" style={styles.input} />
      <TextInput placeholder="Mobile number" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />
       <TextInput placeholder="Confirm Password" secureTextEntry style={styles.input} />
        <TextInput placeholder="Business type" style={styles.input} />
      {/* Terms */}
      <Text style={styles.terms}>
        By signing up you agree to our{" "}
        <Text style={styles.link}>Terms</Text> and{" "}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("BusinessProfile")}
      >
        <Text style={styles.buttonText}>Create Business Account</Text>
      </TouchableOpacity>

      {/* Google */}
      <TouchableOpacity style={styles.googleButton}>
        <Text style={styles.googleText}>Join with Google</Text>
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

   logo: {
  width: 400,
  height: 200,
  resizeMode: "contain",
  alignSelf: "center",
  marginBottom: 1,
},

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 25,
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  terms: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
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
    marginBottom: 15,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  googleButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
  },

   backButton: {
  position: "absolute",
  top: 60,
  left: 20,
  zIndex: 10
},

  googleText: {
    color: "#333",
  },

  signIn: {
    textAlign: "center",
    color: "#777",
  }
  

});