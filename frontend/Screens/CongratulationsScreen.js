import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function CongratulationsScreen({ navigation }) {
  return (
    <View style={styles.container}>

    <Text style={styles.check}>✓</Text>

      <Text style={styles.title}>Congratulations!</Text>

      <Text style={styles.subtitle}>
        Your account is ready to use
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace("EnableLocation")}
      >
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 30
  },
  emoji: {
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
    marginBottom: 30,
    textAlign: "center"
  },
  check:{
fontSize:80,
color:"green",
marginBottom:20
},
  button: {
    backgroundColor: "#6C3BFF",
    padding: 16,
    borderRadius: 30,
    width: "80%",
    alignItems: "center"
  },
  buttonText: {
    color: "#fff"
  }
});