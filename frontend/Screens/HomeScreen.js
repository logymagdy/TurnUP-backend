import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import BottomNav from "../components/BottomNav";

export default function HomeScreen({ logout }) {
  const navigation = useNavigation();

  const [showLocation, setShowLocation] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setShowLocation(status !== "granted");
  };

  const toggleFavorite = (item) => {
    const exists = favorites.find((f) => f.id === item.id);
    if (exists) {
      setFavorites(favorites.filter((f) => f.id !== item.id));
    } else {
      setFavorites([...favorites, item]);
    }
  };

  const isFavorite = (item) => {
    return favorites.find((f) => f.id === item.id);
  };

  const featuredSalons = [
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

  const salons = [
    {
      id: 1,
      image: require("../Images/curls.jpeg"),
      category: "Hair • Facial",
      name: "Mohamed El Soury ",
      rating: "5 (275k)",
      discount: "-58%",
    },
    {
      id: 2,
      image: require("../Images/beurity.jpeg"),
      category: "Hair • Nails",
      name: "Mohamed EL Beiruty",
      rating: "4.8 (43.9k)",
      discount: "-30%",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8F8" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ width: 60 }} />

            <View style={styles.logoCenter}>
              <Image
                source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
                style={styles.logo}
              />
            </View>

            <View style={styles.iconsRow}>
              <TouchableOpacity onPress={() => navigation.navigate("Favorites")}>
                <Ionicons name="heart" size={24} color="#7B3FE4" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Notificationshome")}
                style={{ marginLeft: 12 }}
              >
                <Ionicons name="notifications-outline" size={24} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.greeting}>Hello, Nour 👋</Text>

          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              placeholder="Search salon or service..."
              style={styles.input}
            />
          </View>

          {/* BANNER */}
          <View style={styles.banner}>
            <Image
              source={require("../Images/lindsay-cash-Md_DhaFsnCQ-unsplash.jpg")}
              style={styles.bannerImg}
            />
            <View style={styles.overlay} />

            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>
                Look more beautiful and{"\n"}save more discount
              </Text>

              <TouchableOpacity style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Get offer now!</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.circle}>
              <Text style={{ color: "#fff", fontSize: 11 }}>Up to</Text>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>50%</Text>
            </View>
          </View>

          {/* CATEGORIES */}
          <Text style={styles.title}>What do you want to do?</Text>

          <View style={styles.grid}>
            {[
              { icon: "air-freshener", label: "Hair Services" },
              { icon: "spa", label: "Facial Services" },
              { icon: "hand-sparkles", label: "Nail Services" },
              { icon: "air-freshener", label: "Hair Removal" },
              { icon: "paint-brush", label: "Makeup Services" },
              { icon: "gem", label: "Bridal & Packages" },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={styles.gridItem}>
                <View style={styles.catCircle}>
                  <FontAwesome5 name={item.icon} size={24} color="#7B3FE4" />
                </View>
                <Text style={styles.catText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FEATURED */}
          <Text style={styles.title}>Featured Salon</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredSalons.map((item) => (
              <View key={item.id} style={styles.featuredCard}>

                <TouchableOpacity
                  style={styles.heart}
                  onPress={() => toggleFavorite(item)}
                >
                  <Ionicons
                    name={isFavorite(item) ? "heart" : "heart-outline"}
                    size={18}
                    color="#7B3FE4"
                  />
                </TouchableOpacity>

                <View style={styles.logoCircle}>
                  <Image source={item.image} style={styles.logoImage} />
                </View>

                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.name}>{item.name}</Text>

                <Text style={styles.rating}>⭐ {item.rating}</Text>
              </View>
            ))}
          </ScrollView>

          {/* NEARBY */}
          <Text style={styles.title}>Nearby Offers</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {salons.map((item) => (
              <View key={item.id} style={styles.nearbyCard}>

                <TouchableOpacity
                  style={styles.heart}
                  onPress={() => toggleFavorite(item)}
                >
                  <Ionicons
                    name={isFavorite(item) ? "heart" : "heart-outline"}
                    size={18}
                    color="#7B3FE4"
                  />
                </TouchableOpacity>

                <Image source={item.image} style={styles.nearbyImg} />

                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.categoryLeft}>{item.category}</Text>
                  <Text style={styles.nameLeft}>{item.name}</Text>

                  <View style={styles.ratingRow}>
                    <Text style={styles.rating}>⭐ {item.rating}</Text>
                    <Text style={styles.discount}>{item.discount}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 40, paddingHorizontal: 16 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logoCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },

  logo: { width: 150, height: 60, resizeMode: "contain" },

  greeting: { marginTop: 10, color: "#777", fontSize: 16 },

  iconsRow: { flexDirection: "row" },

  searchBox: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  input: { marginLeft: 8, flex: 1 },

  banner: {
    marginTop: 15,
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
  },

  bannerImg: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  bannerContent: { padding: 15 },

  bannerTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  bannerBtn: {
    backgroundColor: "#7B3FE4",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: "flex-start",
  },

  bannerBtnText: { color: "#fff" },

  circle: {
    position: "absolute",
    right: 15,
    bottom: 15,
    backgroundColor: "#7B3FE4",
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  title: { marginTop: 18, fontWeight: "bold", fontSize: 16 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 15,
  },

  gridItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 25,
  },

  catCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
  },

  catText: { fontSize: 12, marginTop: 8 },

  featuredCard: {
    width: 170,
    marginRight: 15,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    position: "relative",
  },

  nearbyCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    marginRight: 12,
    marginTop: 10,
    width: 300,
    alignItems: "center",
    position: "relative",
  },

  heart: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
  },

  logoCircle: {
    width: 85,
    height: 85,
    borderRadius: 45,
    overflow: "hidden",
    marginBottom: 8,
  },

  logoImage: { width: "100%", height: "100%" },

  nearbyImg: { width: 65, height: 65, borderRadius: 35 },

  category: { fontSize: 11, color: "#777", marginTop: 6 },

  name: { fontWeight: "bold", fontSize: 14, marginTop: 4 },

  ratingRow: { flexDirection: "row", marginTop: 6 },

  rating: { fontSize: 12 },

  categoryLeft: { fontSize: 11, color: "#777" },

  nameLeft: { fontWeight: "bold", fontSize: 14 },

  discount: {
    color: "green",
    marginLeft: 8,
    fontWeight: "600",
  },
});