import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

// التعديل هنا: استخدام ../ للوصول لفولدر الـ Screens اللي بره
import Busready from "../Screens/Busready"; 
import QueueManager from "../Screens/QueueManager";
import BusinessBookings from "../Screens/BusinessBookings";
import BusinessSettings from "../Screens/BusinessSettings";

const Tab = createBottomTabNavigator();

export default function BusinessTabNavigator() {
  const { colors, isDark } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? "#888" : "#999",
        tabBarStyle: {
          height: 85,
          paddingBottom: 25,
          paddingTop: 12,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          elevation: 15,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          
          if (route.name === "Dashboard") iconName = focused ? "pulse" : "pulse-outline";
          else if (route.name === "Queue") iconName = focused ? "list" : "list-outline";
          else if (route.name === "Booking") iconName = focused ? "calendar" : "calendar-outline";
          else if (route.name === "Settings") iconName = focused ? "settings" : "settings-outline";

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Busready} />
      <Tab.Screen name="Queue" component={QueueManager} />
      <Tab.Screen name="Booking" component={BusinessBookings} />
      <Tab.Screen name="Settings" component={BusinessSettings} />
    </Tab.Navigator>
  );
}