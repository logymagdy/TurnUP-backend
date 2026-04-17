import React, { useEffect } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";

export default function SplashScreen({ navigation }) {

  useEffect(() => {
    setTimeout(() => {
      navigation.replace("AccountType");
    }, 3000);
  }, []);

  return (
    <View style={styles.container}>

      <View style={styles.centerContent}>
        <Image
          source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
          style={styles.logo}
        />
      </View>

      <ActivityIndicator size="small" color="#7B3FE4" style={styles.loader} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
  width: 500,   // 👈 كبرناه
  height: 250,
  resizeMode: "contain",
  marginBottom: 2, // 👈 قللنا المسافة
},

  loader: {
    position: "absolute",
    bottom: 300, // 👈 كان 300 بعيد جدًا
    alignSelf: "center",
  },
});