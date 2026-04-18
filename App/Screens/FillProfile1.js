import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function FillProfile1({ navigation }) {
  const [showModal, setShowModal] = useState(false);

  const [gender, setGender] = useState("");
  const [showGender, setShowGender] = useState(false);

  const [showDate, setShowDate] = useState(false);
  const [date, setDate] = useState(null);

  const handleContinue = () => {
    setShowModal(true);

    setTimeout(() => {
      setShowModal(false);
      navigation.replace("Home");
    }, 3000);
  };

  return (
    <View style={styles.container}>

      {/* Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={26} color="#000" />
      </TouchableOpacity>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Ionicons name="person" size={50} color="#aaa" />

        <TouchableOpacity style={styles.editIcon}>
          <Ionicons name="pencil" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Fill Your Profile</Text>

      {/* Inputs */}
      <View style={styles.inputsContainer}>

        {/* Name */}
        <TextInput placeholder="Full Name" style={styles.input} />

        {/* Date Picker */}
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowDate(true)}
        >
          <Text style={{ color: date ? "#000" : "#999" }}>
            {date ? date.toLocaleDateString() : "Date of Birth"}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#999" />
        </TouchableOpacity>

        {showDate && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDate(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Email */}
        <TextInput
          placeholder="Email Address"
          style={styles.input}
          keyboardType="email-address"
        />

        {/* 📱 Mobile */}
        <TextInput
          placeholder="Mobile Number"
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={11}
        />

        {/* Gender Dropdown */}
        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowGender(!showGender)}
        >
          <Text style={{ color: gender ? "#000" : "#999" }}>
            {gender || "Gender"}
          </Text>
          <Ionicons name="chevron-down-outline" size={20} color="#999" />
        </TouchableOpacity>

        {showGender && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              onPress={() => {
                setGender("Male");
                setShowGender(false);
              }}
            >
              <Text style={styles.dropItem}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setGender("Female");
                setShowGender(false);
              }}
            >
              <Text style={styles.dropItem}>Female</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      {/* 🎉 BIG POPUP */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={50} color="#fff" />
            </View>

            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalText}>
              Your account is ready to use. Redirecting...
            </Text>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "#fff",
    paddingTop: 100,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
  },

  avatarContainer: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6C3BFF",
    padding: 6,
    borderRadius: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 25,
    textAlign: "center",
  },

  inputsContainer: {
    gap: 15,
  },

  input: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 14,
  },

  inputRow: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },

  dropItem: {
    padding: 10,
    fontSize: 14,
  },

  button: {
    backgroundColor: "#6C3BFF",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 40,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  /* 🎉 POPUP */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
  },

  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6C3BFF",
    marginBottom: 10,
  },

  modalText: {
    textAlign: "center",
    color: "#555",
  },
});