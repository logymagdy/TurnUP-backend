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
  const [time, setTime] = useState(150);
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

  // 🔥 Auto Submit
  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = () => {
    navigation.navigate("NewPassword");
  };

  // 🔢 typing
  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  // ⬅️ backspace
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  // 🔁 resend
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
        <Ionicons name="arrow-back" size={22} color="#000" />
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
          style={styles.logo}
        />
      </View>

      {/* 👇 مهم عشان يظبط المسافات */}
      <View style={styles.flexArea}>
        <View style={styles.content}>

          <Text style={styles.title}>Email verification</Text>

          <Text style={styles.subtitle}>
            Please type OTP code that we sent to you
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

          {/* Timer */}
          {time > 0 ? (
            <Text style={styles.resend}>Resend in {formatTime()}</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resend}>Resend Code</Text>
            </TouchableOpacity>
          )}

          {/* Button */}
          <TouchableOpacity onPress={handleVerify}>
            <LinearGradient
              colors={["#6E26EA", "#6E26EA"]}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Verify OTP</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

  /* نفس باقي الشاشات */
  logoContainer: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 20,
  },

  logo: {
    width: 200,
    height: 120,
    resizeMode: "contain",
  },

  flexArea: {
    flex: 1,
    justifyContent: "flex-start",
  },

  content: {
    paddingHorizontal: 25,
    marginTop: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#777",
    marginBottom: 30,
    lineHeight: 20,
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
    backgroundColor: "#6E26EA",
    color: "#fff",
    borderColor: "#6E26EA",
  },

  resend: {
    textAlign: "right",
    color: "#6E26EA",
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
});