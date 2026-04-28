import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function CancelBookingScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState("PayPal"); // 🔘

  return (
    <View style={styles.container}>

      {/* 🔙 Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Payment Method</Text>

      {/* 💳 Card */}
      <LinearGradient colors={["#C33764", "#1D2671"]} style={styles.card}>
        <Text style={styles.visa}>VISA</Text>
        <Text style={styles.number}>4570 5367 5338 6080</Text>

        {/* ✅ خط تحت الرقم */}
        <View style={styles.cardLine} />

        <View style={styles.row}>
          <Text style={styles.cardText}>CVV ***</Text>
          <Text style={styles.cardText}>08/27</Text>
        </View>
      </LinearGradient>

       {/* ✅ Divider قبل options */}
<View style={styles.orContainer}>
  <View style={styles.line} />
  <Text style={styles.orText}>or</Text>
  <View style={styles.line} />
</View>

      {/* 🔘 Options */}
      {["PayPal", "Google Pay", "Apple Pay"].map((item) => (
        <TouchableOpacity
          key={item}
          style={styles.option}
          onPress={() => setSelected(item)}
        >
          <Text style={styles.optionText}>{item}</Text>

          {/* Circle */}
          <View
            style={[
              styles.circle,
              selected === item && styles.activeCircle,
            ]}
          />
        </TouchableOpacity>
      ))}

      {/* ✅ Confirm */}
      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      {/* ✅ Modal */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.check}>✔</Text>
            <Text style={styles.successTitle}>Successful!</Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowModal(false)}
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
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
    padding: 20,
  },

  title: {
    fontSize: 20,
    marginTop: 60,
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    borderRadius: 20,
    padding: 40,
    marginVertical: 60,
  },

  visa: {
    color: "#fff",
    alignSelf: "flex-end",
    fontWeight: "bold",
  },

  number: {
    color: "#fff",
    fontSize: 18,
    marginVertical: 20,
    letterSpacing: 2,
  },

  cardLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginVertical: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardText: {
    color: "#fff",
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginBottom: 20,
  },

  option: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  optionText: {
    fontSize: 16,
  },

  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#aaa",
  },

  activeCircle: {
    backgroundColor: "#6E26EA",
    borderColor: "#6E26EA",
  },

  confirmBtn: {
    backgroundColor: "#6E26EA",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 40,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

  /* Modal */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },

  check: {
    fontSize: 40,
    color: "#89DAD1",
  },

  successTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  closeBtn: {
    marginTop: 20,
    backgroundColor: "#6E26EA",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
  orContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginVertical: 20,
},

line: {
  flex: 1,
  height: 1,
  backgroundColor: "#ccc",
},

orText: {
  marginHorizontal: 10,
  color: "#999",
  fontWeight: "600",
},
});