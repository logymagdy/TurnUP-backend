import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation, route }) {
  const currentRoute = route.name;

  const featuredSalons = [
    {
      id: 1,
      image: require("../Images/ts.jpeg"),
      name: "Tarek Elsohayar",
      category: "Hair • Nails • Facial",
      address: "360 Stillwater Rd",
      rating: "4.8 (3.1k)",
    },
    {
      id: 2,
      image: require("../Images/curls.jpeg"),
      name: "Mohamed El Soury",
      category: "Hair • Facial",
      address: "25 Alexandria St",
      rating: "4.7 (2.1k)",
    },
  ];

  const salons = [
    {
      id: 1,
      image: require("../Images/curls.jpeg"),
      category: "Hair • Facial",
      name: "Mohamed El Soury Salon",
      address: "360 Stillwater Rd",
      rating: "4.7 (2.7k)",
      discount: "-58%",
    },
    {
      id: 2,
      image: require("../Images/ts.jpeg"),
      category: "Hair • Nails",
      name: "Tarek Salon",
      address: "Alexandria St",
      rating: "4.5 (1.2k)",
      discount: "-30%",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8F8" }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
            style={styles.logo}
          />

          <View style={styles.headerRight}>
            <Ionicons name="heart-outline" size={22} style={{ marginRight: 12 }} />
            <Ionicons name="notifications-outline" size={22} />
          </View>
        </View>

        <View style={styles.container}>
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
              { icon: "cut-outline", label: "Women" },
              { icon: "cut", label: "Men" },
              { icon: "brush-outline", label: "Nails" },
              { icon: "color-palette-outline", label: "Coloring" },
              { icon: "sparkles-outline", label: "Facial" },
              { icon: "happy-outline", label: "Kids" },
            ].map((item, i) => (
              <View key={i} style={styles.gridItem}>
                <View style={styles.catCircle}>
                  <Ionicons name={item.icon} size={20} color="#333" />
                </View>
                <Text style={styles.catText}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* FEATURED (GRID) */}
          <View style={styles.row}>
            <Text style={styles.title}>Featured Salon</Text>
            <Text style={styles.viewAll}>View all</Text>
          </View>

          <View style={styles.featuredContainer}>
            {featuredSalons.map((item) => (
              <View key={item.id} style={styles.featuredCard}>
                <Image source={item.image} style={styles.featuredImg} />

                <View style={styles.favIcon}>
                  <Ionicons name="heart-outline" size={14} />
                </View>

                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.address}>{item.address}</Text>
                <Text style={styles.rating}>⭐ {item.rating}</Text>
              </View>
            ))}
          </View>

          {/* SEARCH TAGS */}
          <Text style={styles.title}>Most Search Interest</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["Haircut", "Facial", "Nails", "Color", "Spa"].map((t, i) => (
              <View key={i} style={styles.searchTag}>
                <Text style={styles.searchTagText}>{t}</Text>
              </View>
            ))}
          </ScrollView>

          {/* NEARBY (HORIZONTAL) */}
          <View style={styles.row}>
            <Text style={styles.title}>Nearby Offers</Text>
            <Text style={styles.viewAll}>View all</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {salons.map((item) => (
              <View key={item.id} style={styles.nearbyCard}>
                <Image source={item.image} style={styles.nearbyImg} />

                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.address}>{item.address}</Text>

                  <View style={{ flexDirection: "row" }}>
                    <Text style={styles.rating}>⭐ {item.rating}</Text>
                    <Text style={styles.discount}>{item.discount}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        {[
          { name: "Home", icon: "home" },
          { name: "Search", icon: "compass-outline" },
          { name: "Booking", icon: "calendar-outline" },
          { name: "Inbox", icon: "mail-outline" },
          { name: "Profile", icon: "person-outline" },
        ].map((tab) => (
          <TouchableOpacity key={tab.name}>
            <Ionicons
              name={tab.icon}
              size={20}
              color={currentRoute === tab.name ? "#7B3FE4" : "#999"}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },

  header: {
    marginTop: 40,
    alignItems: "center",
  },

  headerRight: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
  },

  logo: {
    width: 190,
    height: 50,
    resizeMode: "contain",
  },

  greeting: {
    marginTop: 10,
    color: "#777",
  },

  searchBox: {
    marginTop: 10,
    backgroundColor: "#EFEFEF",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    marginLeft: 8,
    flex: 1,
  },

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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 12,
    alignSelf: "flex-start",
  },

  bannerBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

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

  title: {
    marginTop: 20,
    fontWeight: "bold",
    fontSize: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  viewAll: {
    color: "#7B3FE4",
    fontSize: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },

  gridItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 15,
  },

  catCircle: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  catText: {
    fontSize: 11,
    marginTop: 5,
  },

  /* FEATURED */
  featuredContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  featuredCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
  },

  featuredImg: {
    width: "100%",
    height: 120,
    borderRadius: 12,
  },

  /* COMMON */
  favIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 15,
  },

  category: {
    fontSize: 10,
    color: "#777",
    marginTop: 5,
  },

  name: {
    fontWeight: "bold",
    marginTop: 2,
  },

  address: {
    fontSize: 10,
    color: "#999",
  },

  rating: {
    fontSize: 11,
  },

  /* SEARCH TAGS */
  searchTag: {
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginTop: 10,
  },

  searchTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },

  /* NEARBY */
  nearbyCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    marginRight: 12,
    width: 260,
    alignItems: "center",
  },

  nearbyImg: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },

  discount: {
    color: "#4CAF50",
    marginLeft: 5,
    fontWeight: "bold",
  },

  bottomNav: {
    height: 65,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
});