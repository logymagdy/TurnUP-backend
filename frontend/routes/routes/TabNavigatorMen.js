import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

import HomeMen from "../Screens/HomeMen";
import SearchScreenmen from "../Screens/SearchScreenmen";
import Bookingscreenmen from "../Screens/Bookingscreenmen";
import Profilescreenmen from "../Screens/Profilescreenmen";
import Qrscreen from "../Screens/Qrscreen";

const Tab = createBottomTabNavigator();

export default function TabNavigatorMen() {
  const isDark = useColorScheme() === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#6f00ff",
        tabBarInactiveTintColor: isDark ? "#aaa" : "#999",

        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: isDark ? "#000" : "#fff",
          borderTopWidth: 0,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "HomeMen") iconName = "home";
          else if (route.name === "Search") iconName = "search";
          else if (route.name === "Booking") iconName = "calendar";
          else if (route.name === "QR") iconName = "qr-code";
          else if (route.name === "Profile") iconName = "person";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeMen"
        component={HomeMen}
        options={{
          tabBarLabel: "Home",
        }}
      />

      <Tab.Screen name="Search" component={SearchScreenmen} />
      <Tab.Screen name="Booking" component={Bookingscreenmen} />
      <Tab.Screen name="QR" component={Qrscreen} />
      <Tab.Screen name="Profile" component={Profilescreenmen} />
    </Tab.Navigator>
  );
}