import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet , Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
  onPress={() => navigation.goBack()}
  style={styles.backButton}
>
  <Ionicons name="arrow-back" size={28} color="black" />
</TouchableOpacity>

       <Image
              source={require("../Images/PHOTO-2025-12-22-22-34-52-removebg-preview.png")}
              style={styles.logo}
            />

      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        Manage bookings, queues, staff, and payments all in one place.
      </Text>

      <TextInput placeholder="Email address" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("busHome")}>
        <LinearGradient
          colors={["#7B3FF2", "#5F2EEA"]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>

 <TouchableOpacity onPress={() => navigation.navigate("busacc")}>
  <LinearGradient
          colors={["#7B3FF2", "#5F2EEA"]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </LinearGradient>
</TouchableOpacity>

      <Text style={styles.or}>or</Text>

      <TouchableOpacity style={styles.social}>
        <Text>Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.social}>
        <Text>Sign in with Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("CreateAccount")}>
  <Text style={styles.signUp}>
    Don't have an account?{" "}
    <Text style={styles.link}>Sign Up</Text>
  </Text>
</TouchableOpacity>

    </View>
  );


}

const styles = StyleSheet.create({

  container:{
    flex:1,
    padding:25,
    justifyContent:"center",
    backgroundColor:"#fff",
    paddingTop: 5,
  },

  logo: {
  width: 400,
  height: 200,
  resizeMode: "contain",
  alignSelf: "center",
  marginBottom: 1,
},

  title:{
    fontSize:22,
    fontWeight:"bold",
  },

  subtitle:{
    color:"#777",
    marginBottom:25
  },

  input:{
    borderWidth:1,
    borderColor:"#eee",
    borderRadius:30,
    padding:15,
    marginBottom:15
  },

  link:{
    color:"#7B3FF2",
    textAlign:"right",
    marginBottom:20
  },

  button:{
    padding:16,
    borderRadius:30,
    alignItems:"center",
    margin:10,
  },

  buttonText:{
    color:"#fff",
    fontWeight:"bold"
  },

  or:{
    textAlign:"center",
    marginVertical:20,
    color:"#888"
  },

  social:{
    borderWidth:1,
    borderColor:"#eee",
    borderRadius:30,
    padding:15,
    alignItems:"center",
    marginBottom:10
  },

  signUp: {
  textAlign: "center",
  color: "#777",
  marginTop: 20,
},
  backButton: {
  position: "absolute",
  top: 60,
  left: 20,
  zIndex: 10
}, 

});