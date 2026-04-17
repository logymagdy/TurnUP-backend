import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";


const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    image: require("../Images/bus1.jpg"),
    title: " Manage Your Business In One Place",
    text: " Control bookings, queues, staff, and payments easily."
  },
  {
    id: "2",
    image: require("../Images/bus6.jpg"),
   title: "Smart queue & online bookings",
  text: "Customers can book or join the queue without waiting."
},
  ];
  

export default function OnboardingScreen({ navigation }) {

  const [currentIndex, setCurrentIndex] = useState(0);
  const ref = useRef();

  const updateIndex = (e) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / width
    );
    setCurrentIndex(index);
  };
  
const nextSlide = () => {
  if (currentIndex < slides.length - 1) {
    ref.current.scrollToIndex({ index: currentIndex + 1 });
  } else {
    navigation.replace("buslogin");
  }
};

  return (
    <View style={styles.container}>

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="white" />
      </TouchableOpacity>

      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={ref}
        onMomentumScrollEnd={updateIndex}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (

          <View style={styles.slide}>

            <Image source={item.image} style={styles.image} />

            <Text style={styles.title}>
              {item.title}
            </Text>

            <Text style={styles.text}>
              {item.text}
            </Text>

          </View>
        )}
      />

      {/* 🔥 الجزء اللي تحت كله */}
      <View style={styles.bottomSection}>

        {/* dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot
              ]}
            />
          ))}
        </View>

        {/* next button */}
        <TouchableOpacity
          style={styles.button}
          onPress={nextSlide}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1
              ? "Get Started"
              : "Next"}
          </Text>
        </TouchableOpacity>

        {/* sign in */}
        <TouchableOpacity onPress={() => navigation.navigate("buslogin")}>
          <Text style={styles.signIn}>
            Already have an account?{" "}
            <Text style={styles.link}>Sign In</Text>
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center"
  },

  slide: {
    width,
    alignItems: "center"
  },

  image: {
    width: width,
    height: 560,
    resizeMode: "cover"
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 25,
    paddingHorizontal: 30
  },

  text: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 50,
    lineHeight: 20
  },

  /* 🔥 الجزء اللي تحت */
  bottomSection: {
    position: "absolute",
    bottom: 50, // 👈 غيري الرقم ده لو عايزة أعلى/أقل
    width: "100%",
    alignItems: "center",
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30

  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: "#6C3BFF",
    width: 20
  },

  button: {
    width: "85%",
    backgroundColor: "#6C3BFF",
    paddingVertical: 16,
    borderRadius: 35,
    alignItems: "center",
    marginBottom: 10
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },

  signIn: {
    color: "#777"
  },

  link: {
    color: "#6C3BFF",
    fontWeight: "600"
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10
  }

});