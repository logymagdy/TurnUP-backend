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

export default function BusinessProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      {/* Logo */}
      

      {/* Title */}
      <Text style={styles.title}>Complete Your Business Profile</Text>

      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <Ionicons name="person" size={60} color="#aaa" />
        <TouchableOpacity style={styles.editIcon}>
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Inputs */}
      <TextInput placeholder="Business Name" style={styles.input} />
      <TextInput placeholder="Business Category (Barbershop / Salon)" style={styles.input} />
      <TextInput placeholder="City" style={styles.input} />
      <TextInput placeholder="Mobile Number" style={styles.input} />

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("SuccessScreen")}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 25,
    paddingTop: 150,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

 

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },

  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6C3BFF",
    borderRadius: 15,
    padding: 6,
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
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
  },

});