import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  Animated,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";

export default function BookingScreenWoman() {
  const navigation = useNavigation();
  const route = useRoute();

  const [activeTab, setActiveTab] = useState("Upcoming");
  const [showCancel, setShowCancel] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const translateY = useRef(new Animated.Value(0)).current;


  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.tab) {
        setActiveTab(route.params.tab);
      } else {
        setActiveTab("Upcoming");
      }
    }, [route.params])
  );

  // swipe down
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120) {
          setShowCancel(false);
          translateY.setValue(0);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;


  const [bookings, setBookings] = useState([
    {
      id: 1,
      name: "Tarek Elsohayar",
      status: "Upcoming",
      image: require("../Images/ts.jpeg"),
      date: "Dec 23,2025 - 10:00 pm",
      remind: true,
      address: "Mostafakamel, Sanstefano, Zezenia, Smouha",
    },
    {
      id: 2,
      name: "Mohamed El Beiruity",
      status: "Upcoming",
      image: require("../Images/beurity.jpeg"),
      date: "Aug 10,2025 - 12:00 pm",
      remind: false,
      address: "Zezenia, Smouha, Alexwest, Kafrabou",
    },
    {
      id: 3,
      name: "Just Curls",
      status: "Completed",
      image: require("../Images/justcurls.jpeg"),
      date: "Aug 10,2025 - 12:00 pm",
      address: "Alexandria,Kafrabou",
    },
    {
      id: 4,
      name: "Tarek Elsohayar",
      status: "Cancelled",
      image: require("../Images/ts.jpeg"),
      date: "Dec 23,2025 - 10:00 pm",
      address: "Mostafakamel, Sanstefano, Zezenia, Smouha",
    },
  ]);

  const filtered = bookings.filter((b) => b.status === activeTab);

  const toggleRemind = (id) => {
    setBookings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, remind: !item.remind } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="My Booking" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* TABS */}
        <View style={styles.tabs}>
          {["Upcoming", "Completed", "Cancelled"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CARDS */}
        {filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.date}>{item.date}</Text>

              {activeTab === "Upcoming" && (
                <View style={styles.remindRow}>
                  <Text style={styles.remindText}>Remind Me</Text>
                  <Switch
                    value={item.remind}
                    onValueChange={() => toggleRemind(item.id)}
                    trackColor={{ false: "#ccc", true: "#7B3FE4" }}
                    thumbColor="#fff"
                  />
                </View>
              )}
            </View>

            <View style={styles.row}>
              <Image source={item.image} style={styles.img} />

              <View style={{ marginLeft: 10 }}>
                <Text style={styles.name}>{item.name}</Text>

                {/* ✅ address مختلف */}
                <Text style={styles.address}>{item.address}</Text>

      
              </View>
            </View>

            {/* UPCOMING */}
            {activeTab === "Upcoming" && (
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setSelectedBookingId(item.id);
                    setShowCancel(true);
                  }}
                >
                  <Text style={styles.cancelText}>Cancel Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.receiptBtn}>
                  <LinearGradient
                    colors={["#7B3FE4", "#9A6BFF"]}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.receiptText}>View E-Receipt</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* COMPLETED */}
            {activeTab === "Completed" && (
              <TouchableOpacity style={styles.receiptFull}>
                <LinearGradient
                  colors={["#7B3FE4", "#9A6BFF"]}
                  style={styles.gradientBtn}
                >
                  <Text style={styles.receiptText}>View E-Receipt</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* MODAL */}
      {showCancel && (
        <View style={styles.overlay}>
          <Animated.View
            style={[styles.modal, { transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.dragLine} />

            <Text style={styles.modalTitle}>Cancel Booking</Text>

            <Text style={styles.modalText}>
              Are you sure you want to cancel your salon booking?
            </Text>

            <Text style={styles.subText}>
              Only 80% refund according to policy
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={{ flex: 1, marginRight: 6 }}
                onPress={() => setShowCancel(false)}
              >
                <LinearGradient
                  colors={["#7B3FE4", "#9A6BFF"]}
                  style={styles.modalBtn}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, marginLeft: 6 }}
                onPress={() => {
                  setBookings((prev) =>
                    prev.map((item) =>
                      item.id === selectedBookingId
                        ? { ...item, status: "Cancelled" }
                        : item
                    )
                  );

                  setShowCancel(false);

                  navigation.navigate("CancelBookingScreen");
                }}
              >
                <LinearGradient
                  colors={["#FF5F5F", "#FF7B7B"]}
                  style={styles.modalBtn}
                >
                  <Text style={styles.modalBtnText}>
                    Yes, Cancel Booking
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      {!showCancel && <BottomNav />}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  /* TABS */
  tabs: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 30,
    padding: 5,
    margin: 16,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 25,
  },

  activeTab: {
    backgroundColor: "#7B3FE4",
  },

  tabText: {
    fontSize: 13,
    color: "#777",
  },

  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 15,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  img: {
    width: 65,
    height: 65,
    borderRadius: 35,
  },

  name: {
    fontSize: 14,
    fontWeight: "700",
  },

  address: {
    fontSize: 11,
    color: "#777",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  rating: {
    fontSize: 12,
    color: "#777",
    marginLeft: 3,
  },

  /* ✅ NEW followers */
  followers: {
    fontSize: 11,
    color: "#999",
    marginLeft: 6,
  },

  date: {
    fontSize: 11,
    color: "#999",
  },

  /* REMIND */
  remindRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  remindText: {
    fontSize: 10,
    marginRight: 5,
    color: "#777",
  },

  /* BUTTONS */
  btnRow: {
    flexDirection: "row",
    marginTop: 15,
  },

  cancelBtn: {
    backgroundColor: "#7B3FE4",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
  },

  cancelText: {
    color: "#fff",
    fontSize: 12,
  },

  receiptBtn: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 25,
    overflow: "hidden",
  },

  receiptFull: {
    marginTop: 10,
    borderRadius: 25,
    overflow: "hidden",
  },

  gradientBtn: {
    padding: 12,
    alignItems: "center",
    borderRadius: 25,
  },

  receiptText: {
    color: "#fff",
    fontSize: 12,
  },

  /* MODAL */
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
  },

  dragLine: {
    width: 50,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 10,
  },

  modalTitle: {
    textAlign: "center",
    color: "red",
    fontWeight: "700",
    fontSize: 16,
  },

  modalText: {
    textAlign: "center",
    marginTop: 10,
  },

  subText: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 11,
    color: "#777",
  },

  modalBtns: {
    flexDirection: "row",
    marginTop: 20,
  },

  modalBtn: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  modalBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});