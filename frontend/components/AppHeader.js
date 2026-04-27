import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppHeader({
  title,
  showBack = true,
  rightComponent,
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>

      {/* LEFT */}
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} />
          </TouchableOpacity>
        )}
      </View>

      {/* CENTER */}
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* RIGHT */}
      <View style={styles.side}>
        {rightComponent ? rightComponent : <View style={{ width: 22 }} />}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center", // 👈 يخلي كله في نفس الخط
    paddingHorizontal: 15,
    paddingBottom: 12,
    backgroundColor: "#fff",

    // shadow خفيف
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },

  side: {
    width: 70,
    alignItems: "flex-start",
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
});