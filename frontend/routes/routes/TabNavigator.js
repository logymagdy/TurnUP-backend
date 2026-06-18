import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

// screens
import HomeMen from "../Screens/HomeMen";
import HomeScreen from "../Screens/HomeScreen";
import SearchScreen from "../Screens/SearchScreen";
import Bookingscreenwoman from "../Screens/Bookingscreenwoman";
import ProfileScreen from "../Screens/Profilescreen";
import Qrscreen from "../Screens/Qrscreen"; // 🔥 ضيفي الشاشة دي

const Tab = createBottomTabNavigator();

// ✅ تأكدي من وجود { route } هنا
export default function TabNavigator({ route }) {
  const isDark = useColorScheme() === "dark";

  // الخطأ كان هنا: لازم نتأكد إن الـ route والـ params موجودين عشان ميطلعش ReferenceError
  const userType = route?.params?.userType || 'women'; 

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#6f00ff",
        tabBarInactiveTintColor: isDark ? "#aaa" : "#999",
        tabBarStyle: {
          position: "absolute",
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: isDark ? "#000" : "#fff",
          borderTopWidth: 0,
          elevation: 5, // عشان تظهر واضحة
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Search") iconName = "search";
          else if (route.name === "Booking") iconName = "calendar";
          else if (route.name === "QR") iconName = "qr-code";
          else if (route.name === "Profile") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* الـ Home دلوقتي هي اللي بتحدد هتعرض Men ولا Women جوه الـ Tab */}
      <Tab.Screen name="Home">
        {(props) => userType === 'men' ? <HomeMen {...props} /> : <HomeScreen {...props} />}
      </Tab.Screen>

      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Booking" component={Bookingscreenwoman} />
      <Tab.Screen name="QR" component={Qrscreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}