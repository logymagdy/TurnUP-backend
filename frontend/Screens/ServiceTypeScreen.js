import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ServiceTypeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      
<TouchableOpacity
  onPress={() => navigation.goBack()}
  style={styles.backButton}
>
  <Ionicons name="arrow-back" size={22} color="black" />
</TouchableOpacity>
      <View style={styles.centerContent}>
              <Image
                source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
                style={styles.logo}
              />
            </View>

      <Text style={styles.subtitle}>CHOOSE YOUR SERVICE TYPE</Text>

<TouchableOpacity
  style={[styles.button, styles.menButton]}
  onPress={() => navigation.navigate("OnboardingMen")}
>
  <Text style={styles.buttonText}>Men Services</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.button, styles.womenButton]}
  onPress={() => navigation.navigate("Onboarding")}
>
  <Text style={styles.buttonText}>Women Services</Text>
</TouchableOpacity>

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
    marginBottom: 60,
    padding:8,
    
  },

  subtitle: {
    fontSize: 12,
    letterSpacing: 2,
    marginTop: -30,
    marginBottom:60,
    fontWeight: "700",
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
  backButton: {
  position: "absolute",
  top: 60,
  left: 20,
  zIndex: 10
},
menButton: {
  backgroundColor: "#89DAD1", 
},

womenButton: {
  backgroundColor: "#6E26EA", 
},
});
