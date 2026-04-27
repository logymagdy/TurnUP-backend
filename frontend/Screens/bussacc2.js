import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function BusinessStep2({ navigation }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 🔥 animation refs
  const scaleAnims = {
    length: useRef(new Animated.Value(1)).current,
    upper: useRef(new Animated.Value(1)).current,
    lower: useRef(new Animated.Value(1)).current,
    number: useRef(new Animated.Value(1)).current,
    symbol: useRef(new Animated.Value(1)).current,
  };

  const animate = (anim) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 🔐 rules
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*]/.test(password);
  const hasLength = password.length >= 8;

  useEffect(() => {
    if (hasLength) animate(scaleAnims.length);
    if (hasUpper) animate(scaleAnims.upper);
    if (hasLower) animate(scaleAnims.lower);
    if (hasNumber) animate(scaleAnims.number);
    if (hasSymbol) animate(scaleAnims.symbol);
  }, [password]);

  const passedRules = [
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
    hasLength,
  ].filter(Boolean).length;

  const getBarColor = () => {
    if (passedRules <= 2) return "#FF4D4D";
    if (passedRules <= 4) return "#FFA500";
    return "#4CAF50";
  };

  const isMatch = password === confirm && confirm.length > 0;

  const handleSubmit = () => {
    if (!isMatch || passedRules < 5) {
      alert("Please enter a valid strong password");
      return;
    }

    navigation.navigate("BusinessProfile");
  };

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={22} color="#000" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Set Your Password</Text>
        <Text style={styles.subtitle}>Step 2 of 2</Text>

        {/* Password */}
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Password"
            secureTextEntry={!showPass}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons
              name={showPass ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6E26EA" 
            />
          </TouchableOpacity>
        </View>

        {/* Confirm */}
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Confirm Password"
            secureTextEntry={!showConfirm}
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6E26EA"
            />
          </TouchableOpacity>
        </View>

        {/* ✅ Match */}
        {confirm.length > 0 && (
          <View style={styles.matchRow}>
            <Ionicons
              name={isMatch ? "checkmark-circle" : "close-circle"}
              size={18}
              color={isMatch ? "#4CAF50" : "#FF4D4D"}
            />
            <Text
              style={[
                styles.matchText,
                { color: isMatch ? "#4CAF50" : "#FF4D4D" },
              ]}
            >
              {isMatch ? "Passwords match" : "Passwords do not match"}
            </Text>
          </View>
        )}

        {/* 🔥 Strength Bar */}
        <View style={styles.barContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  backgroundColor:
                    i <= passedRules ? getBarColor() : "#eee",
                },
              ]}
            />
          ))}
        </View>

        {/* RULES */}
        <View style={styles.rulesBox}>
          {[
            { cond: hasLength, text: "At least 8 characters", anim: scaleAnims.length },
            { cond: hasUpper, text: "One uppercase letter", anim: scaleAnims.upper },
            { cond: hasLower, text: "One lowercase letter", anim: scaleAnims.lower },
            { cond: hasNumber, text: "One number", anim: scaleAnims.number },
            { cond: hasSymbol, text: "One special character (!@#$)", anim: scaleAnims.symbol },
          ].map((rule, index) => (
            <View key={index} style={styles.ruleRow}>
              <Animated.View style={{ transform: [{ scale: rule.anim }] }}>
                <Ionicons
                  name={rule.cond ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color={rule.cond ? "#4CAF50" : "#ccc"}
                />
              </Animated.View>
              <Text style={styles.ruleText}>{rule.text}</Text>
            </View>
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity onPress={handleSubmit}>
          <LinearGradient
            colors={["#6E26EA", "#6E26EA"]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  back: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

  content: {
    paddingHorizontal: 25,
    marginTop: 120,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 30,
    paddingHorizontal: 15,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  matchText: {
    marginLeft: 6,
    fontSize: 13,
  },

  barContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },

  bar: {
    flex: 1,
    height: 6,
    borderRadius: 5,
    marginHorizontal: 3,
  },

  rulesBox: {
    marginBottom: 15,
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  ruleText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#777",
  },

  button: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});