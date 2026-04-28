import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BusHome({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>

        {/* 🔥 Title */}
        <Text style={styles.title}>Let’s Build Your Business</Text>

        

        {/* Step */}
        <Text style={styles.step}>Step 1 of 7</Text>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          {[...Array(6)].map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>

        <Text style={styles.trial}>
          2- Month Free Trial - No Cards Required
        </Text>

        {/* Business Identity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Identity</Text>

          <TextInput
            placeholder="Business Name (e.g Fade Zone Barbershop)"
            style={styles.input}
          />

          <View style={styles.uploadContainer}>
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={40} color="#aaa" />
            </View>

            <Text style={styles.uploadText}>
              Upload Your Logo <Text style={{ color: "#999" }}>(optional)</Text>
            </Text>
          </View>
        </View>

        {/* Business Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Details</Text>

          <TextInput
            placeholder="Business Category (Barbershop)"
            style={styles.input}
          />

          <Text style={styles.label}>Short description</Text>

          <TextInput
            placeholder="This helps clients understand your business."
            style={[styles.input, { height: 80 }]}
            multiline
          />
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Branch Address</Text>

          <View style={styles.locationRow}>
            <TextInput
              placeholder="Street, Area, City"
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
            />

            <TouchableOpacity style={styles.pinBtn}>
              <Text style={styles.pinText}>Pin</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.map} />
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Save & Continue</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    padding: 20,
    paddingTop: 100,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },

  
  step: {
    textAlign: "center",
    fontSize: 16,
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
    marginHorizontal: 3,
  },

  activeDot: {
    width: 25,
    backgroundColor: "#6C3BFF",
  },

  trial: {
    textAlign: "center",
    color: "#777",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#6C3BFF",
  },

  cardTitle: {
    fontWeight: "700",
    marginBottom: 10,
    fontSize: 15,
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 12,
    marginBottom: 15,
  },

  uploadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  uploadText: {
    fontSize: 14,
  },

  label: {
    fontSize: 12,
    color: "#555",
    marginBottom: 5,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  pinBtn: {
    backgroundColor: "#6C3BFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 15,
  },

  pinText: {
    color: "#fff",
    fontSize: 12,
  },

  map: {
    height: 100,
    backgroundColor: "#ccc",
    borderRadius: 10,
  },

  button: {
    backgroundColor: "#6C3BFF",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 40,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});