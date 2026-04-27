import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AppHeader from "../components/AppHeader";

export default function Notifications() {

  const [settings, setSettings] = useState({
    general: true,
    sound: true,
    vibrate: false,
    offers: true,
    promo: true,
    payments: true,
    updates: false,
    newService: false,
  });

  const update = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const ToggleItem = ({ title, value, onChange }) => (
    <View style={styles.item}>
      <Text style={styles.text}>{title}</Text>

      {/* 💜 Custom Toggle */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onChange}
        style={[
          styles.toggleContainer,
          value && styles.toggleActive,
        ]}
      >
        <View
          style={[
            styles.toggleCircle,
            value && styles.circleActive,
          ]}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* 🔥 Header */}
      <AppHeader title="Notifications" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.content}>

          <ToggleItem title="General Notification" value={settings.general} onChange={() => update("general")} />
          <ToggleItem title="Sound" value={settings.sound} onChange={() => update("sound")} />
          <ToggleItem title="Vibrate" value={settings.vibrate} onChange={() => update("vibrate")} />
          <ToggleItem title="Special Offers" value={settings.offers} onChange={() => update("offers")} />
          <ToggleItem title="Promo & Discount" value={settings.promo} onChange={() => update("promo")} />
          <ToggleItem title="Payments" value={settings.payments} onChange={() => update("payments")} />
          <ToggleItem title="App Updates" value={settings.updates} onChange={() => update("updates")} />
          <ToggleItem title="New Service Available" value={settings.newService} onChange={() => update("newService")} />

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
    paddingHorizontal: 20,
    paddingTop: 5, // 👈 مسافة بسيطة بس
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

  /* 💜 Custom Toggle */
  toggleContainer: {
    width: 55,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#ccc",
    justifyContent: "center",
    padding: 3,
  },

  toggleActive: {
    backgroundColor: "#6E26EA",
  },

  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  circleActive: {
    alignSelf: "flex-end",
  },
});