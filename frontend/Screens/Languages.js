import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AppHeader from "../components/AppHeader";

export default function LanguagesScreen() {

  const [selected, setSelected] = useState("English (US)");

  const languages = [
    "English (US)",
    "Arabic",
    "French",
    "Russian",
    "Bengali",
    "Spanish",
    "Mandarin",
    "Hindi",
  ];

  const RadioItem = ({ title, selected, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>

      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* 🔥 Header */}
      <AppHeader title="Languages" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.content}>
          {languages.map((lang) => (
            <RadioItem
              key={lang}
              title={lang}
              selected={selected === lang}
              onPress={() => setSelected(lang)}
            />
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  content: {
    padding: 20,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
  },

  text: {
    fontSize: 16,
    fontWeight: "500",
  },

  /* 💜 Radio Button */
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },

  radioOuterActive: {
    borderColor: "#6E26EA",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6E26EA",
  },
});