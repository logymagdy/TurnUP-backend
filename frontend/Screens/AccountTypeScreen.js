import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function AccountTypeScreen({ navigation }) {
  return (
    <View style={styles.container}>


      <View style={styles.centerContent}>
        <Image
          source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
          style={styles.logo}
        />
      </View>

      <Text style={styles.title}>SIGN UP</Text>

      <Text style={styles.subtitle}>CHOOSE YOUR ACCOUNT TYPE</Text>

     <View style={styles.buttonsContainer}>
  <TouchableOpacity
    style={[styles.button, { backgroundColor: "#6E26EA" }]}
    onPress={() => navigation.navigate("ServiceType")}
  >
    <Text style={styles.buttonText}>Client</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.button, { backgroundColor: "black" }]}
    onPress={() => navigation.navigate("onboardingbus")}
  >
    <Text style={styles.buttonText}>Business</Text>
  </TouchableOpacity>
</View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start", 
    paddingTop: 80,
  },

  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
  },

  logo: {
    width: 500,
    height: 250,
    resizeMode: "contain",
    marginBottom: 10,
    padding:8,
    
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 40,
  },

  subtitle: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 20,
    fontWeight: "700",
  },

  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },

  button: {
    width: "70%",
    padding: 15,
    borderRadius: 25,
    marginVertical: 30,
    backgroundColor: "#6C3BFF",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});