import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";

const data = [
  { id: "1", title: "Reminder!", desc: "Get ready for your appointment at 9am", time: "Just now", section: "Today" },
  { id: "2", title: "Payment at Tarek ELsoghayar was success!", time: "11:32 PM", section: "Yesterday" },
  { id: "3", title: "You make an appointment with Tarek ELsoghayar", time: "Yesterday", section: "Yesterday" },
  { id: "4", title: "Get 20% offers for hair service at CURLS", time: "Yesterday", section: "Yesterday" },
  { id: "5", title: "Credit Card Connected!", desc: "Credit Card has been linked", time: "1 week ago", section: "December 11,2025" },
];

export default function NotificationScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.icon}>
        <Ionicons name="notifications" size={18} color="#fff" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        {item.desc && <Text style={styles.desc}>{item.desc}</Text>}
      </View>

      <Text style={styles.time}>{item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
       <AppHeader title="Notifications" />
      

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7B3FE4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  title: { fontWeight: "600" },
  desc: { color: "#777", fontSize: 12 },
  time: { color: "#aaa", fontSize: 11 },
});