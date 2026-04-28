import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import ScreenWrapper from "../components/ScreenWrapper";

export default function ServiceScreen({ route }) {
  const { type } = route.params;

  const salons = [
    {
      id: 1,
      name: "Tarek Salon",
      rating: 4.8,
      distance: "2.1 km",
      image: require("../Images/ts.jpeg"),
    },
    {
      id: 2,
      name: "Curls Beauty",
      rating: 4.7,
      distance: "1.5 km",
      image: require("../Images/curls.jpeg"),
    },
  ];

  return (
    <View style={styles.container}>
    
          <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
      <AppHeader title="type" />

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            placeholder={`Search ${type}...`}
            style={styles.input}
          />
        </View>

        {/* FILTER BUTTON */}
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={18} />
          <Text style={{ marginLeft: 5 }}>Filter</Text>
        </TouchableOpacity>

        {/* SALONS */}
        <Text style={styles.section}>Available Salons</Text>

        {salons.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={item.image} style={styles.image} />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={14} color="#FFA500" />
                <Text style={styles.rating}> {item.rating}</Text>
              </View>

              <Text style={styles.distance}>{item.distance}</Text>
            </View>

            <TouchableOpacity style={styles.bookBtn}>
              <Text style={{ color: "#fff" }}>Book</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      </ScreenWrapper>
       <BottomNav />
       
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 12,
    alignItems: "center",
  },

  input: {
    marginLeft: 8,
    flex: 1,
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    alignSelf: "flex-end",
  },

  section: {
    marginTop: 20,
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 15,
    marginTop: 10,
    alignItems: "center",
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },

  name: {
    fontWeight: "600",
  },

  rating: {
    fontSize: 12,
    color: "#777",
  },

  distance: {
    fontSize: 11,
    color: "#999",
  },

  bookBtn: {
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
});