import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";


const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    image: require("../Images/bus1.jpg"),
    title: "Manage Your Business In One Place",
    text: "Control bookings, queues, staff, and payments easily."
  },
  {
    id: "2",
    image: require("../Images/Menbus.png"),
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
      navigation.replace("Buslogin");
    }
  };

  return (
    <View style={styles.container}>

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={22} color="black" />
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

            {/* IMAGE */}
            <Image source={item.image} style={styles.image} />

            {/* CARD */}
            <SafeAreaView style={styles.card} edges={['bottom']}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.text}>{item.text}</Text>

              {/* dots */}
              <View style={styles.dotsContainer}>
                {slides.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentIndex === index && styles.activeDot,
                    ]}
                  />
                ))}
              </View>

              {/* button */}
              <TouchableOpacity style={styles.button} onPress={nextSlide}>
                <Text style={styles.buttonText}>
                  {currentIndex === slides.length - 1
                    ? "Get Started"
                    : "Next"}
                </Text>
              </TouchableOpacity>

              {/* sign in */}
              <TouchableOpacity onPress={() => navigation.navigate("Buslogin")}>
                <Text style={styles.signIn}>
                  Already have an account?{" "}
                  <Text style={styles.link}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </SafeAreaView>

          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  slide: {
    width,
    flex: 1,
  },

  image: {
    width: "100%",
    height: height * 0.65,
    resizeMode: "cover",
  },

  card: {
    position: "absolute",
    bottom: 0, // ✅ بقى full تحت
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 90,
    paddingBottom: 35,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#000", // 👈 مهم عشان الخلفية بقت white
  },

  text: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: "#6E26EA",
    width: 20,
  },

  button: {
    width: "100%",
    backgroundColor: "#6E26EA",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  signIn: {
    color: "#777",
    marginTop: 15,
    textAlign: "center",
  },

  link: {
    color: "#6E26EA",
    fontWeight: "600",
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },

});