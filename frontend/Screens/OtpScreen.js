import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function OtpScreen({ navigation }) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [time, setTime] = useState(150); // 2:30
  const inputs = useRef([]);

  // ⏱ Timer
  useEffect(() => {
    if (time === 0) return;

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [time]);

  const formatTime = () => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // 🔢 Handle typing
  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  // ⬅️ Backspace يرجّع
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  // 🔁 Resend
  const handleResend = () => {
    setTime(150);
    setOtp(["", "", "", ""]);
    inputs.current[0].focus();
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

      {/* Logo */}
      <Image
        source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Email verification</Text>
      <Text style={styles.subtitle}>
        Please type OTP code that we give you
      </Text>

      {/* OTP */}
      <View style={styles.row}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={[styles.box, digit && styles.activeBox]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>

      {/* Timer / Resend */}
      {time > 0 ? (
        <Text style={styles.resend}>Resend in {formatTime()}</Text>
      ) : (
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resend}>Resend Code</Text>
        </TouchableOpacity>
      )}

      {/* Button */}
      <TouchableOpacity onPress={() => navigation.navigate("NewPassword")}>
        <LinearGradient colors={["#7B3FF2", "#5F2EEA"]} style={styles.button}>
          <Text style={styles.buttonText}>Verify OTP</Text>
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 80,
    backgroundColor: "#fff",
  },

  logo: {
    width: 200,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#777",
    marginBottom: 30,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  box: {
    width: 65,
    height: 65,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
    fontSize: 22,
  },

  activeBox: {
    backgroundColor: "#6C3BFF",
    color: "#fff",
    borderColor: "#6C3BFF",
  },

  resend: {
    textAlign: "right",
    color: "#6C3BFF",
    marginBottom: 30,
    fontSize: 13,
  },

  button: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },
});