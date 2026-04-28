import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";

export default function CancelBookingScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState("card");
  const shineAnim = useRef(new Animated.Value(-150)).current;
  const paid = 500;
  const refund = paid * 0.8;

  return (
    <View style={styles.container}>
      <AppHeader title="Cancel Booking" />

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Please select a payment method (Only 80% will be refunded).
        </Text>

        {/* 💳 CARD */}
        <TouchableOpacity onPress={() => setSelected("card")}>
          <LinearGradient
            colors={
              selected === "card"
                ? ["#000000", "#FFF5CC", "#C5A100"] // GOLD
                : ["#C0C0C0", "#F5F5F5", "#A9A9A9"] // SILVER
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* ✨ animated shine */}
            <Animated.View
              style={[
                styles.shine,
                { transform: [{ translateX: shineAnim }] },
              ]}
            />

            {/* radio */}
            <View style={styles.radio}>
              {selected === "card" && <View style={styles.innerRadio} />}
            </View>

            {/* 💳 chip */}

            <Text style={styles.visa}>VISA</Text>

            <Text style={styles.number}>4570 5367 5338 6080</Text>

            <View style={styles.row}>
              <View>
                <Text style={styles.small}>CVV</Text>
                <Text style={styles.cardText}>***</Text>
              </View>

              <View>
                <Text style={styles.small}>EXPIRES</Text>
                <Text style={styles.cardText}>08/27</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* OR */}
        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={{ color: "#999" }}>or</Text>
          <View style={styles.line} />
        </View>

        {/* OPTIONS */}
        {["paypal", "google", "apple"].map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.option}
            onPress={() => setSelected(type)}
          >
            <View style={styles.radioOutline}>
              {selected === type && <View style={styles.innerRadio} />}
            </View>

            <Text style={styles.optionText}>
              {type === "paypal"
                ? "PayPal"
                : type === "google"
                ? "Google Pay"
                : "Apple Pay"}
            </Text>

            <Ionicons
              name={
                type === "paypal"
                  ? "logo-paypal"
                  : type === "google"
                  ? "logo-google"
                  : "logo-apple"
              }
              size={22}
              color={
                type === "paypal"
                  ? "#003087"
                  : type === "google"
                  ? "#30a04a"
                  : "#000"
              }
            />
          </TouchableOpacity>
        ))}

        {/* INFO */}
        <View style={styles.bottomInfo}>
          <Text style={styles.infoText}>Paid: ${paid}</Text>
          <Text style={styles.infoText}>Refund: ${refund}</Text>
        </View>

        {/* BUTTON */}
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <LinearGradient
            colors={["#6E26EA", "#6E26EA"]}
            style={styles.confirmBtn}
          >
            <Text style={styles.buttonText}>Confirm Cancellation</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* SUCCESS MODAL */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={28} color="#fff" />
            </View>

            <Text style={styles.successTitle}>Successful!</Text>

            <Text style={styles.successText}>
              You have successfully cancelled your booking order. 80% funds
              will be returned to your account.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                navigation.goBack();
              }}
              style={styles.okBtn}
            >
              <Text style={{ color: "#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F6" },

  content: { paddingHorizontal: 20, flex: 1 },

  subtitle: { color: "#777", marginTop: 15, marginBottom: 15 },

  /* 💳 CARD */
  card: {
    borderRadius: 20,
    padding: 25,
    height: 230,
    justifyContent: "space-between",
    overflow: "hidden",

    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  shine: {
    position: "absolute",
    width: 120,
    height: 300,
    backgroundColor: "rgba(255,255,255,0.25)",
    transform: [{ rotate: "25deg" }],
  },

  chip: {
    width: 40,
    height: 30,
    backgroundColor: "#d4af37",
    borderRadius: 6,
    marginBottom: 10,
  },

  visa: {
    color: "#000",
    alignSelf: "flex-end",
    fontWeight: "bold",
    fontSize: 18,
  },

  number: {
    color: "#000",
    fontSize: 20,
    marginVertical: 20,
    letterSpacing: 2,
  },

  row: { flexDirection: "row", justifyContent: "space-between" },

  small: { color: "#333", fontSize: 10 },

  cardText: { color: "#000", marginTop: 3 },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#000",
    position: "absolute",
    top: 15,
    left: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#aaa",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  innerRadio: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },

  line: { flex: 1, height: 1, backgroundColor: "#ddd", marginHorizontal: 10 },

  option: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionText: { fontSize: 14, flex: 1, marginLeft: 10 },

  bottomInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  infoText: { color: "#777" },

  confirmBtn: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 50,
  },

  buttonText: { color: "#fff", fontWeight: "600" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },

  checkCircle: {
    backgroundColor: "#4CAF50",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  successTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10 },

  successText: {
    textAlign: "center",
    marginTop: 10,
    color: "#555",
  },

  okBtn: {
    marginTop: 20,
    backgroundColor: "#6E26EA",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
});