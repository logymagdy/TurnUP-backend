import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FavoritesContext } from "../context/FavoritesContext";
import API from "../services/api.js";
import { AuthContext } from "../App";

export default function AppHeader({
  title,
  showBack = true,
  rightComponent,
  showLogo = false,
  isBusiness = false,
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";

  // جلب المفضلة بأمان لمنع الـ undefined وقت الـ Load
  const context = useContext(FavoritesContext);
  const favorites = context?.favorites || [];
  const { userGender } = useContext(AuthContext) || {};

  const isMenStore = (name, type) => {
    if (type === "barbershop") return true;
    if (type === "beautySalon") return false;
    const n = (name || "").toLowerCase();
    return n.includes("sameh") || n.includes("aly") || n.includes("gents") || n.includes("bella");
  };

  const filteredFavsCount = (favorites || []).filter((item) => {
    const salonData = item.salonId || item.salon || item;
    const storeType = salonData?.storeType;
    const storeName = salonData?.storeName || salonData?.name;
    if (userGender === "MEN") {
      return isMenStore(storeName, storeType);
    } else {
      return !isMenStore(storeName, storeType);
    }
  }).length;

  // Notifications count
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await API.get("/notifications/unread-count");
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        console.log("Unread count error:", err?.response?.data || err.message);
      }
    };

    fetchUnreadCount();

    const unsubscribe = navigation.addListener("focus", () => {
      fetchUnreadCount();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 10,
          backgroundColor: isDark ? "#000" : "#fff",
        },
      ]}
    >
      {/* LEFT */}
      <View style={[styles.side, { alignItems: "flex-start" }]}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={22}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* CENTER */}
      <View style={styles.center}>
        {showLogo ? (
          <Image
            source={
              isDark
                ? require("../Images/Logodark.png")
                : require("../Images/Logolight.png")
            }
            style={styles.logo}
          />
        ) : (
          <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
            {title}
          </Text>
        )}
      </View>

      {/* RIGHT */}
      <View
        style={[
          styles.side,
          { alignItems: "flex-end", flexDirection: "row" },
        ]}
      >
        {rightComponent !== undefined ? (
          rightComponent
        ) : (
          <>
            {/* Favorites */}
            {!isBusiness && (
              <TouchableOpacity
                style={{ marginRight: 15 }}
                onPress={() => {
                  // 🎯 تعديل الاسم ليتطابق مع الـ Stack.Screen الأساسي في الـ App.js
                  navigation.navigate("FavoritesScreen"); 
                }}
              >
                <Ionicons
                  name={filteredFavsCount > 0 ? "heart" : "heart-outline"}
                  size={25}
                  color="#6f00ff"
                />
              </TouchableOpacity>
            )}

            {/* 🔔 Notifications */}
            <TouchableOpacity
              onPress={() => {
                navigation.navigate(isBusiness ? "BusinessNotifications" : "NotificationScreen");
                setUnreadCount(0);
              }}
            >
              <View>
                <Ionicons
                  name="notifications-outline"
                  size={25}
                  color="#6f00ff"
                />

                {/* 🔴 Badge */}
                {unreadCount > 0 && (
                  <View style={styles.badge} />
                )}
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  side: {
    width: 70,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  logo: {
    width: 90,
    height: 30,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "red",
    borderRadius: 4,
    width: 8,
    height: 8,
  },
});