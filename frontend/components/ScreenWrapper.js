import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";

export default function ScreenWrapper({ children, scroll = true }) {
  if (scroll) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
});