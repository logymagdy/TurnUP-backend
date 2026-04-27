import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import ScreenWrapper from "../components/ScreenWrapper";
import { salonsData } from "./Womansalons";

export default function SearchScreen() {
  const [searchText, setSearchText] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [rating, setRating] = useState(4);
  const [distance, setDistance] = useState(10);
  const [selectedDate, setSelectedDate] = useState(10);

  const slideAnim = useState(new Animated.Value(400))[0];

  const openFilter = () => {
    setShowFilter(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilter = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowFilter(false));
  };

  const panResponder = useState(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) closeFilter();
        else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  )[0];

  const days = [
    { day: "Wed", date: 9 },
    { day: "Thu", date: 10 },
    { day: "Fri", date: 11 },
    { day: "Sat", date: 12 },
    { day: "Sun", date: 13 },
    { day: "Mon", date: 14 },
  ];

  const popular = ["Hair", "Nails", "Coloring", "Makeup", "Facials"];

  // ✅ FIXED FILTER
  const filteredSalons = salonsData.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchText.toLowerCase()) &&
      (selectedService ? item.category?.includes(selectedService) : true)
    );
  });

  return (
    <View style={styles.container}>
      <AppHeader title="Search" />

      <ScreenWrapper>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              placeholder="Search salon or service..."
              style={styles.input}
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity onPress={openFilter}>
              <Ionicons name="options-outline" size={22} />
            </TouchableOpacity>
          </View>

          {/* POPULAR */}
          <Text style={styles.section}>Popular Search</Text>
          <View style={styles.popularWrap}>
            {popular.map((item, i) => (
              <TouchableOpacity key={i} onPress={() => setSearchText(item)}>
                <LinearGradient
                  colors={["#7B3FE4", "#9A6BFF"]}
                  style={styles.popularBtn}
                >
                  <Text style={styles.popularText}>{item}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* RESULTS */}
          <Text style={styles.section}>Suggestion for you</Text>

          {filteredSalons.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={item.image} style={styles.image} />

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="star" size={14} color="#FFA500" />
                  <Text style={styles.rating}> {item.rating}</Text>
                </View>

                <Text style={styles.sub}>
                  {item.category}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScreenWrapper>

      {/* FILTER */}
      {showFilter && (
        <View style={styles.overlay}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.filterBox,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>

              <View style={styles.handle} />

              <View style={styles.filterHeader}>
                <TouchableOpacity onPress={closeFilter}>
                  <Text>Cancel</Text>
                </TouchableOpacity>

                <Text style={styles.filterTitle}>Filter</Text>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedService(null);
                    setRating(4);
                    setDistance(10);
                  }}
                >
                  <Text style={{ color: "#7B3FE4" }}>Reset</Text>
                </TouchableOpacity>
              </View>

              {/* DATE */}
              <Text style={styles.section}>Available on</Text>

              <View style={styles.monthRow}>
                <Ionicons name="chevron-back" size={18} />
                <Text style={{ fontWeight: "600" }}>March, 2021</Text>
                <Ionicons name="chevron-forward" size={18} />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {days.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedDate(d.date)}
                    style={[
                      styles.dateBox,
                      selectedDate === d.date && styles.activeDate,
                    ]}
                  >
                    <Text>{d.day}</Text>
                    <Text style={{ fontWeight: "bold" }}>{d.date}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* SERVICE */}
              <Text style={styles.section}>Service</Text>
              <View style={styles.tags}>
                {["Hair", "Nails", "Facial","Highlights", "Makeup", "ho"].map((t) => (
                  <TouchableOpacity key={t} onPress={() => setSelectedService(t)}>
                    <LinearGradient
                      colors={
                        selectedService === t
                          ? ["#7B3FE4", "#9A6BFF"]
                          : ["#fff", "#fff"]
                      }
                      style={styles.tag}
                    >
                      <Text
                        style={{
                          color: selectedService === t ? "#fff" : "#000",
                        }}
                      >
                        {t}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* RATING */}
              <Text style={styles.section}>Rating</Text>
              <View style={{ flexDirection: "row", marginTop: 10 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Ionicons
                      name="star"
                      size={24}
                      color={star <= rating ? "#FFA500" : "#ccc"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* DISTANCE */}
              <Text style={styles.section}>Distance</Text>
              <Slider
                minimumValue={0}
                maximumValue={50}
                value={distance}
                onValueChange={setDistance}
                minimumTrackTintColor="#7B3FE4"
                maximumTrackTintColor="#ddd"
              />

              <View style={styles.distanceRow}>
                <Text>0 km</Text>
                <Text>{Math.round(distance)} km</Text>
              </View>

              {/* BUTTON */}
              <TouchableOpacity onPress={closeFilter}>
                <LinearGradient
                  colors={["#7B3FE4", "#9A6BFF"]}
                  style={styles.applyBtn}
                >
                  <Text style={styles.applyText}>Show Result</Text>
                </LinearGradient>
              </TouchableOpacity>

            </ScrollView>
          </Animated.View>
        </View>
      )}

      <BottomNav />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },

  input: { flex: 1, marginLeft: 8 },

  section: {
    marginTop: 20,
    fontWeight: "600",
    fontSize: 15,
  },

  popularWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  popularBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
  },

  popularText: { color: "#fff", fontSize: 12 },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 15,
    marginTop: 10,
    alignItems: "center",
  },

  image: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 10,
  },

  name: { fontWeight: "600" },

  rating: { fontSize: 12, color: "#777" },

  sub: { fontSize: 11, color: "#777" },

  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  filterBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
  },

  handle: {
    width: 50,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 10,
  },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  filterTitle: { fontWeight: "600", fontSize: 16 },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  tag: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
  },

  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  dateBox: {
    width: 60,
    height: 70,
    backgroundColor: "#eee",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  activeDate: {
    backgroundColor: "#7B3FE4",
  },

  distanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  applyBtn: {
    marginTop: 20,
    marginBottom: 50,
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },

  applyText: {
    color: "#fff",
    fontWeight: "600",
  },
});