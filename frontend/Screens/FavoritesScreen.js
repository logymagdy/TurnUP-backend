import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";

const salonsData = [
  {
    id: 1,
    image: require("../Images/ts.jpeg"),
    name: "Tarek Elsohayar",
    category: "Hair • Nails • Facial",
    rating: "4.8 (49.5k)",
  },
  {
    id: 2,
    image: require("../Images/Belal.jpeg"),
    name: "Belal Gad",
    category: "Hair • Coloring • Styling",
    rating: "4.7 (239k)",
  },
  {
    id: 3,
    image: require("../Images/curls.jpeg"),
    name: "Mohamed El Soury",
    category: "Hair • Facial • Treatments",
    rating: "5 (275k)",
  },
  {
    id: 4,
    image: require("../Images/justcurls.jpeg"),
    name: "Just Curls",
    category: "Curly Hair • Styling",
    rating: "4.5 (2,441)",
  },
];

export default function FavoritesScreen({ navigation }) {
  const [list, setList] = useState(salonsData);

  const renderItem = ({ item }) => {
    const scaleAnim = new Animated.Value(1);

    const onPressHeart = () => {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setList((prev) => prev.filter((i) => i.id !== item.id));
      }, 200);
    };

    return (
      <View style={styles.card}>
        {/* IMAGE */}
        <Image source={item.image} style={styles.image} />

        {/* INFO */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>

          {/* ✅ FIX هنا */}
          <Text style={styles.address}>{item.category}</Text>

          {/* ⭐ RATING */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFA500" />
            <Text style={styles.rating}> {item.rating}</Text>
          </View>
        </View>

        {/* ❤️ HEART */}
        <TouchableOpacity onPress={onPressHeart}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="heart" size={22} color="#7B3FE4" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Favorites" />

      <FlatList
        data={list}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },

  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
  },

  image: {
    width: 65,
    height: 65,
    borderRadius: 35,
    marginRight: 12,
  },

  name: {
    fontWeight: "600",
    fontSize: 14,
  },

  address: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  rating: {
    fontSize: 12,
    marginLeft: 4,
  },

  distance: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
});