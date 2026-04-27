import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import AppHeader from "../components/AppHeader";

// ✅ صور ثابتة
const images = [
  require("../Images/girl1.jpeg"),
  require("../Images/girl2.jpeg"),
  require("../Images/girl3.jpeg"),
  require("../Images/girl4.jpeg"),
  require("../Images/girl5.jpeg"),
  require("../Images/girl6.jpeg"),
  require("../Images/girl7.jpeg"),
  require("../Images/girl9.jpeg"),
];

const data = [
  { id: 1, name: "Mariam", phone: "01005382002", invited: true },
  { id: 2, name: "Kenzi", phone: "01005382002", invited: true },
  { id: 3, name: "Malak", phone: "01005382002", invited: false },
  { id: 4, name: "Farida", phone: "01005382002", invited: true },
  { id: 5, name: "Maya", phone: "01005382002", invited: false },
  { id: 6, name: "Nour", phone: "01005382002", invited: false },
  { id: 7, name: "Shahd", phone: "01005382002", invited: true },
  { id: 8, name: "Rowan", phone: "01005382002", invited: true },
];

export default function InviteFriends({ navigation }) {
  const [list, setList] = useState(data);

  const toggleInvite = (id) => {
    setList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, invited: !item.invited } : item
      )
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      {/* 👤 Left */}
      <View style={styles.left}>
        <Image
          source={images[index % images.length]}
          style={styles.avatar}
        />

        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
      </View>

      {/* 💜 Invite Button */}
      <TouchableOpacity
        onPress={() => toggleInvite(item.id)}
        style={[
          styles.inviteBtn,
          item.invited ? styles.activeBtn : styles.outlineBtn,
        ]}
      >
        <Text
          style={{
            color: item.invited ? "#fff" : "#6E26EA",
            fontWeight: "500",
          }}
        >
          {item.invited ? "Invited" : "Invite"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* 🔥 Header */}
      <AppHeader title="Invite Friends" />

      <FlatList
        data={list}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  list: {
    padding: 16,
    paddingBottom: 30,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "500",
  },

  phone: {
    fontSize: 13,
    color: "#777",
  },

  inviteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  activeBtn: {
    backgroundColor: "#6E26EA",
  },

  outlineBtn: {
    borderWidth: 1,
    borderColor: "#6E26EA",
  },
});