import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BusinessStep1({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "",
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Create Business Account</Text>
        <Text style={styles.subtitle}>Step 1 of 2</Text>

        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#6E26EA" />
          <TextInput placeholder="Full Name" style={styles.input} />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="mail-outline" size={20} color="#6E26EA" />
          <TextInput placeholder="Email" style={styles.input} />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="call-outline" size={20} color="#6E26EA" />
          <TextInput placeholder="Phone" style={styles.input} />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="briefcase-outline" size={20} color="#6E26EA" />
          <TextInput placeholder="Business Type" style={styles.input} />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("bussacc2", form)}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  back: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

  content: {
    paddingHorizontal: 25,
    marginTop: 120,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },

  inputBox: {
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
    marginLeft: 10,
    paddingVertical: 12,
    color: "#000",
  },

  button: {
    backgroundColor: "#6E26EA",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  barContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },

  bar: {
    flex: 1,
    height: 6,
    borderRadius: 5,
    marginHorizontal: 3,
  },

  /* Rules */
  rulesBox: {
    marginBottom: 15,
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  ruleText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#777",
  },
});
