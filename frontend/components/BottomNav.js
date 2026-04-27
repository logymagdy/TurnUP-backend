import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function BottomNav() {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;

  const tabs = [
  { name: "Home", icon: "home-outline" },
  { name: "Search", icon: "compass-outline" },
  { name: "Booking", icon: "calendar-outline" },
  { name: "Inbox", icon: "mail-outline" },
  { name: "Profile", icon: "person-outline" }, 
];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tabItem}
          onPress={() => navigation.navigate(tab.name)}
        >
          <Ionicons
            name={tab.icon}
            size={22}
            color={currentRoute === tab.name ? "#7B3FE4" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              currentRoute === tab.name && { color: "#7B3FE4" },
            ]}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    fontSize: 11,
    marginTop: 3,
    color: "#999",
  },
});
