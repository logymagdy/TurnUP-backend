import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

export default function CreateAccountScreen({ navigation }) {
  const [secure, setSecure] = useState(true);
  const [password, setPassword] = useState("");

  const scaleAnims = {
    length: useRef(new Animated.Value(1)).current,
    upper: useRef(new Animated.Value(1)).current,
    lower: useRef(new Animated.Value(1)).current,
    number: useRef(new Animated.Value(1)).current,
    symbol: useRef(new Animated.Value(1)).current,
  };

  const animate = (anim) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*]/.test(password);
  const hasLength = password.length >= 8;

  useEffect(() => {
    if (password.length > 0) {
      if (hasLength) animate(scaleAnims.length);
      if (hasUpper) animate(scaleAnims.upper);
      if (hasLower) animate(scaleAnims.lower);
      if (hasNumber) animate(scaleAnims.number);
      if (hasSymbol) animate(scaleAnims.symbol);
    }
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

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subtitle}>
          Enter your details below to create your account
        </Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Username"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Email address"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Mobile number"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#6E26EA" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={secure}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6E26EA"
            />
          </TouchableOpacity>
        </View>

        {/* 🔥 Strength Bar (تظهر بس لما تكتبي) */}
        {password.length > 0 && (
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
        )}

        {/* 🔥 Rules (تظهر بس لما تكتبي) */}
        {password.length > 0 && (
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
        )}

        {/* Terms */}
        <Text style={styles.terms}>
          By signing up you agree to our{" "}
          <Text style={styles.link}>Terms</Text> and{" "}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("FillProfile1")}
        >
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>

        {/* Google */}
        <TouchableOpacity style={styles.socialBtn}>
          <FontAwesome name="google" size={18} color="#30a04a" />
          <Text style={styles.socialText}>Sign in with Google</Text>
        </TouchableOpacity>

        {/* Sign In */}
        <Text style={styles.signIn}>
          Already have an account?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },

  backButton: {
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
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25,
  },

  inputContainer: {
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
    color: "#000",
  },

  /* 🔥 PASSWORD BAR */
  barContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },

  bar: {
    flex: 1,
    height: 5,
    marginHorizontal: 2,
    borderRadius: 5,
  },

  /* 🔥 RULES */
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

  /* TERMS */
  terms: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginVertical: 15,
  },

  link: {
    color: "#6E26EA",
    fontWeight: "600",
  },

  /* BUTTON */
  button: {
    backgroundColor: "#6E26EA",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  /* DIVIDER */
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  orText: {
    marginHorizontal: 10,
    color: "#999",
  },

  /* GOOGLE BUTTON */
  socialBtn: {
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 30,
    gap: 10,
  },

  socialText: {
    fontWeight: "500",
  },

  signIn: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },
});