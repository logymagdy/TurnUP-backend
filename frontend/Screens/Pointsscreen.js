import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function PointsScreen({ navigation }) {
  const history = [
    { id: 1, points: 100, date: "2025-12-10" },
    { id: 2, points: 100, date: "2025-12-01" },
    { id: 3, points: 50, date: "2025-11-13" },
    { id: 4, points: 100, date: "2025-12-01" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} />
          </TouchableOpacity>

          <Text style={styles.title}>My Points</Text>

          <View style={{ width: 22 }} />
        </View>

        {/* CARD */}
        <LinearGradient
          colors={["#9A6BFF", "#7B3FE4"]}
          style={styles.pointsCard}
        >
          <Text style={styles.small}>Your Points</Text>
          <Text style={styles.points}>500 points</Text>
        </LinearGradient>

        <Text style={styles.expire}>
          Points expire 12 months after they earned
        </Text>

        {/* HEADER ROW */}
        <View style={styles.row}>
          <Text style={styles.section}>Points History</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("Rewards")}
          >
            <Text style={styles.link}>All Rewards</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.desc}>
          Points are automatically added after purchase.
        </Text>

        {/* LIST */}
        {history.map((item) => (
          <View key={item.id} style={styles.card}>
            <View>
              <Text style={styles.earned}>Earned</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>

            <Text style={styles.pointsNum}>
              {item.points} 💰
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 70,
    paddingHorizontal: 15,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  title: {
    fontWeight: "600",
    fontSize: 16,
  },

  pointsCard: {
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },

  small: {
    color: "#eee",
    fontSize: 12,
  },

  points: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 5,
  },

  expire: {
    textAlign: "center",
    color: "#777",
    marginTop: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  section: {
    fontWeight: "600",
    fontSize: 16,
  },

  link: {
    color: "#7B3FE4",
  },

  desc: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 3,
  },

  earned: {
    fontWeight: "600",
  },

  date: {
    fontSize: 12,
    color: "#777",
  },

  pointsNum: {
    fontWeight: "600",
  },
});