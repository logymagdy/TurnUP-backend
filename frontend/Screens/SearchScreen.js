import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

export default function SearchScreen({ navigation , route }) {
  const currentRoute = route.name;
  const [showFilter, setShowFilter] = useState(false);
  const [selectedDay, setSelectedDay] = useState(10);
  const [distance, setDistance] = useState(10);

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Search Input + Filter */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#999" />

        <TextInput
          placeholder="Search salon or service..."
          style={{ flex: 1 }}
        />

        <TouchableOpacity onPress={() => setShowFilter(true)}>
          <Ionicons name="options-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Recents */}
      <Text style={styles.section}>Recents</Text>

      {["Hair service", "Nail", "Little cuts"].map((item, i) => (
        <View key={i} style={styles.recentItem}>
          <Text>{item}</Text>
          <Ionicons name="close" size={18} />
        </View>
      ))}

      {/* Popular */}
      <Text style={styles.section}>Popular Search</Text>

      <View style={styles.tags}>
        {["Hair", "Nails", "Coloring", "Massage", "Facials"].map(
          (t, i) => (
            <View key={i} style={styles.tag}>
              <Text style={{ color: "#fff" }}>{t}</Text>
            </View>
          )
        )}
      </View>

      {/* Suggestion */}
      <Text style={styles.section}>Suggestion for you</Text>

      <View style={styles.card}>
        <Image
          source={{ uri: "https://i.imgur.com/1bX5QH6.jpg" }}
          style={styles.image}
        />
        <View>
          <Text style={styles.name}>Mohamed El Soury Salon</Text>
          <Text style={styles.rating}>⭐ 4.7 (2.7k)</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Image
          source={{ uri: "https://i.imgur.com/3ZQ3Z4C.jpg" }}
          style={styles.image}
        />
        <View>
          <Text style={styles.name}>Belal Beauty Salon</Text>
          <Text style={styles.rating}>⭐ 4.7 (2.7k)</Text>
        </View>
      </View>

      {/* ================= FILTER ================= */}
      {showFilter && (
        <View style={styles.overlay}>
          <View style={styles.filterBox}>

            {/* Header */}
            <View style={styles.filterHeader}>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>

              <Text style={{ fontWeight: "bold" }}>Filter</Text>

              <View style={{ width: 50 }} />
            </View>

            {/* Available On */}
            <Text style={styles.section}>Available on</Text>

            <View style={styles.calendarHeader}>
              <Ionicons name="chevron-back" size={18} />
              <Text>March, 2021</Text>
              <Ionicons name="chevron-forward" size={18} />
            </View>

            <View style={styles.daysRow}>
              {[9, 10, 11, 12, 13, 14].map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.day,
                    selectedDay === day && styles.activeDay,
                  ]}
                >
                  <Text
                    style={{
                      color: selectedDay === day ? "#fff" : "#000",
                    }}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Service */}
            <Text style={styles.section}>Service</Text>

            <View style={styles.tags}>
              {["Hair", "Nails", "Massage", "Shaving"].map((t, i) => (
                <View key={i} style={styles.tagOutline}>
                  <Text>{t}</Text>
                </View>
              ))}
            </View>

            {/* Rating */}
            <Text style={styles.section}>Rating</Text>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star" size={20} color="#FFA500" />
              ))}
              <Text style={{ marginLeft: 10 }}>4 Star</Text>
            </View>

            {/* Distance */}
            <Text style={styles.section}>Distance</Text>

            <Slider
              style={{ width: "100%", height: 40 }}
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

            {/* Button */}
            <TouchableOpacity style={styles.applyBtn}>
              <Text style={{ color: "#fff" }}>Show Result</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}
 {/* Bottom Navigation */}
     <View style={styles.bottomNav}>
  {[
    { name: "Home", icon: "home" },
    { name: "Search", icon: "compass-outline" },
    { name: "Booking", icon: "calendar-outline" },
    { name: "Inbox", icon: "mail-outline" },
    { name: "Profile", icon: "person-outline" },
  ].map((tab) => (
    <TouchableOpacity
      key={tab.name}
      onPress={() => navigation.navigate(tab.name)}
    >
      <Ionicons
        name={tab.icon}
        size={22}
        color={currentRoute === tab.name ? "#7B3FE4" : "#999"}
      />
    </TouchableOpacity>
  ))}
</View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 25,
    padding: 10,
    marginTop: 20,
    alignItems: "center",
  },

  section: {
    marginTop: 20,
    fontWeight: "bold",
  },

  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  tag: {
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
  },

  tagOutline: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 5,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },

  name: { fontWeight: "bold" },
  rating: { color: "#777" },

  /* FILTER */
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
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },

  daysRow: {
    flexDirection: "row",
    marginTop: 10,
  },

  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  activeDay: {
    backgroundColor: "#7B3FE4",
  },

  distanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  applyBtn: {
    backgroundColor: "#7B3FE4",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
});