import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import AppHeader from "../components/AppHeader";

export default function PrivacyScreen() {
  const Section = ({ title, text }) => (
    <View style={styles.card}>
      <Text style={styles.header}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* 🔥 Header */}
      <AppHeader title="Privacy Policy" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        <Section
          title="Overview"
          text="TurnUP respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect your data when you use the TurnUP application."
        />

        <Section
          title="Information We Collect"
          text="We collect basic personal information such as your name, phone number, email address, booking details, and service preferences. If you choose to pay digitally, we may collect payment-related information needed to complete transactions."
        />

        <Section
          title="Bookings, Cancellations & Payments"
          text="Clients may cancel their booking up to 20 minutes before their turn without charge. Late cancellations require a 10 EGP penalty paid through the saved payment method or in cash on the next visit, and the full amount goes to the service provider. If a service provider cancels a booking, the client receives 50 reward points."
        />

        <Section
          title="Data Sharing"
          text="We do not sell or share personal information with third parties except with service providers to complete bookings or when required by law."
        />

        <Section
          title="Data Security"
          text="We use secure systems and technical measures to protect your data from unauthorized access, loss, or misuse."
        />

        <Section
          title="User Rights"
          text="Users can view, update, or request deletion of their personal data at any time through the app."
        />

        <Section
          title="Policy Updates"
          text="This Privacy Policy may be updated from time to time. Any changes will be displayed inside the app."
        />

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
    padding: 16,
    paddingBottom: 40,
  },

  /* 💜 Card Style */
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
  },

  header: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#6E26EA",
  },

  text: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
    textAlign: "justify", // 👈 alignment
  },
});