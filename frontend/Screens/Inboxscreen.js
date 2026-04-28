import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";

export default function InboxScreen({ navigation }) {
  const [chats, setChats] = useState([
    {
      id: 1,
      name: "Tarek EL soghayar",
      msg: "Good morning, anything we can help...",
      time: "11:32 PM",
      image: require("../Images/ts.jpeg"),
      unread: 2,
    },
    {
      id: 2,
      name: "Mohamed El-Beiruity",
      msg: "Your appointment is confirmed.",
      time: "11:32 PM",
      image: require("../Images/beurity.jpeg"),
      unread: 2,
    },
    {
      id: 3,
      name: "Mohamed El Soury",
      msg: "Let us know if you need anything else.",
      time: "Yesterday",
      image: require("../Images/curls.jpeg"),
      unread: 0,
    },
  ]);

  return (
    <View style={styles.container}>
      <AppHeader title="Inbox" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput placeholder="Search messages" style={styles.searchInput} />
        </View>

        {/* CHAT LIST */}
        {chats.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.chatItem}
            onPress={() => {
              setChats((prev) =>
                prev.map((chat) =>
                  chat.id === item.id ? { ...chat, unread: 0 } : chat
                )
              );

              navigation.navigate("Chatscreen", { chat: item });
            }}
          >
            <Image source={item.image} style={styles.avatar} />

            <View style={styles.chatText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.msg} numberOfLines={1}>
                {item.msg}
              </Text>
            </View>

            <View style={styles.rightSide}>
              <Text style={styles.time}>{item.time}</Text>

              {item.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#F3F3F3",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    alignItems: "center",
  },

  searchInput: {
    marginLeft: 8,
    flex: 1,
  },

  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },

  chatText: {
    flex: 1,
  },

  name: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 3,
  },

  msg: {
    fontSize: 12,
    color: "#777",
  },

  rightSide: {
    alignItems: "flex-end",
  },

  time: {
    fontSize: 10,
    color: "#999",
  },

  badge: {
    backgroundColor: "#7B3FE4",
    borderRadius: 10,
    paddingHorizontal: 6,
    marginTop: 5,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
  },
});