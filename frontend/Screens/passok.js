import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function SuccessScreen({ navigation }) {

return (

<View style={styles.container}>

<Text style={styles.check}>✓</Text>

<Text style={styles.title}>Password Reset</Text>

<Text style={styles.subtitle}>
You can now log in with your new password.
</Text>

<TouchableOpacity onPress={() => navigation.navigate("buslogin")}>
<LinearGradient colors={["#7B3FF2","#5F2EEA"]} style={styles.button}>
<Text style={styles.buttonText}>Back to login</Text>
</LinearGradient>
</TouchableOpacity>

</View>

);
}

const styles = StyleSheet.create({

container:{
flex:1,
justifyContent:"center",
alignItems:"center",
padding:30
},

check:{
fontSize:80,
color:"green",
marginBottom:20
},

title:{
fontSize:24,
fontWeight:"bold"
},

subtitle:{
color:"#777",
marginVertical:20,
textAlign:"center"
},

button:{
padding:16,
borderRadius:30,
width:220,
alignItems:"center"
},

buttonText:{ color:"#fff", fontWeight:"bold" }

});