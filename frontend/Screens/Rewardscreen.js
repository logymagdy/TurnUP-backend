import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RewardsScreen({ navigation }) {
  const [userPoints, setUserPoints] = useState(500);
  const [selectedReward, setSelectedReward] = useState(null);

  const rewards = [
    {
      id: 1,
      title: "20% Off SELF Products",
      pts: 3500,
      image: require("../Images/Self.jpg"),
    },
    {
      id: 2,
      title: "25% Off Capixy Haircare",
      pts: 3000,
      image: require("../Images/Capixy.jpg"),
    },
    {
      id: 3,
      title: "30% Off Tools",
      pts: 2500,
      image: require("../Images/Rushbrush.jpg"),
    },
    {
      id: 4,
      title: "30% Off Keratin",
      pts: 2000,
      image: require("../Images/ts.jpeg"),
    },
    {
      id: 5,
      title: "30% Full Package",
      pts: 1500,
      image: require("../Images/curls.jpeg"),
    },
    {
      id: 6,
      title: "20% Haircut",
      pts: 1000,
      image: require("../Images/beurity.jpeg"),
    },
    {
      id: 7,
      title: "20% Curly Wash",
      pts: 500,
      image: require("../Images/justcurls.jpeg"),
    },
    {
      id: 8,
      title: "25% Coloring",
      pts: 250,
      image: require("../Images/Belal.jpeg"),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} />
          </TouchableOpacity>

          <Text style={styles.title}>All Rewards</Text>

          <Text style={styles.points}>{userPoints} pts</Text>
        </View>

        {/* GRID */}
        <View style={styles.grid}>
          {rewards.map((item) => {
            const unlocked = userPoints >= item.pts;

            const scaleAnim = new Animated.Value(1);

            const pressIn = () => {
              Animated.spring(scaleAnim, {
                toValue: 0.95,
                useNativeDriver: true,
              }).start();
            };

            const pressOut = () => {
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
              }).start();
            };

            return (
              <Animated.View
                key={item.id}
                style={{
                  width: "48%",
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.card,
                    !unlocked && { opacity: 0.4 },
                  ]}
                  disabled={!unlocked}
                  onPressIn={pressIn}
                  onPressOut={pressOut}
                  onPress={() => setSelectedReward(item)}
                >
                  {/* LOGO */}
                  <Image source={item.image} style={styles.logo} />

                  {/* POINTS */}
                  <View style={styles.pointsBox}>
                    <Ionicons
                      name={unlocked ? "checkmark" : "lock-closed"}
                      size={12}
                    />
                    <Text style={styles.pointsText}>
                      {item.pts} pts
                    </Text>
                  </View>

                  {/* TITLE */}
                  <Text style={styles.cardText}>
                    {item.title}
                  </Text>

                  {/* BUTTON */}
                  {unlocked && (
                    <View style={styles.redeemBtn}>
                      <Text style={styles.redeemText}>
                        Redeem
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal visible={!!selectedReward} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Redeem Reward</Text>

            <Text style={styles.modalText}>
              {selectedReward?.title}
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setSelectedReward(null)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  setUserPoints(userPoints - selectedReward.pts);
                  setSelectedReward(null);
                }}
              >
                <Text style={{ color: "#fff" }}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
  },

  points: {
    color: "#7B3FE4",
    fontWeight: "600",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
  },

  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },

  pointsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAEAEA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },

  pointsText: {
    fontSize: 11,
    marginLeft: 4,
  },

  cardText: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "500",
  },

  redeemBtn: {
    backgroundColor: "#7B3FE4",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 12,
  },

  redeemText: {
    color: "#fff",
    fontSize: 12,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  modalTitle: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },

  modalText: {
    textAlign: "center",
    marginVertical: 10,
  },

  modalBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  confirmBtn: {
    backgroundColor: "#7B3FE4",
    padding: 10,
    borderRadius: 10,
  },
});