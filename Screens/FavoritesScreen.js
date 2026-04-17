import React from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const data = [
  { id: "1", name: "Gents Salon" },
  { id: "2", name: "Mohamed El-Beirutiy" },
  { id: "3", name: "Tarek EL soghayar" },
  { id: "4", name: "Mohamed El Soury Salon" },
   { id: "5", name: "Mohamed El Soury Salon" },
];

export default function FavoritesScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: "https://i.imgur.com/1bX5QH6.jpg" }}
        style={styles.image}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>360 Stillwater Rd. Palm City</Text>
        <Text style={styles.rating}>⭐ 4.7 (2.7k)</Text>
      </View>

      <Ionicons name="bookmark" size={20} />
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Favorites</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Text style={[styles.tab, styles.active]}>All</Text>
        <Text style={styles.tab}>Haircuts</Text>
        <Text style={styles.tab}>Facial</Text>
        <Text style={styles.tab}>Nails</Text>
      </View>

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
  container: { flex: 1, backgroundColor: "#F6F6F6" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginTop: 10,
  },

  tab: {
    backgroundColor: "#EDEDED",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    fontSize: 12,
  },

  active: {
    backgroundColor: "#7B3FE4",
    color: "#fff",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
    alignItems: "center",
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },

  name: { fontWeight: "600" },
  address: { color: "#888", fontSize: 12 },
  rating: { fontSize: 12, marginTop: 2 },
});