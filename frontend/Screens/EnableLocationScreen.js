import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function EnableLocationScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Icon */}
      <Text style={styles.icon}>📍</Text>

      {/* Title */}
      <Text style={styles.title}>Enable Location</Text>

      {/* Description */}
      <Text style={styles.subtitle}>
        We need access to your location to show nearby salons and services
      </Text>

      {/* Allow Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace("Home")}
      >
        <Text style={styles.buttonText}>Allow Location Access</Text>
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity onPress={() => navigation.replace("Home")}>
        <Text style={styles.skip}>Not Now</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff"
  },

  icon: {
    fontSize: 60,
    marginBottom: 20
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 40
  },

  button: {
    backgroundColor: "#6C3BFF",
    padding: 16,
    borderRadius: 30,
    width: "80%",
    alignItems: "center",
    marginBottom: 15
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600"
  },

  skip: {
    color: "#777"
  }

});