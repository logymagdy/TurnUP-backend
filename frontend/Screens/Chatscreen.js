import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen({ route, navigation }) {
  const { chat } = route.params;

  const [messages, setMessages] = useState([
    { id: 1, text: "Hello, good morning :)", fromMe: true, seen: true },
    { id: 2, text: "Good morning, anything we can help?", fromMe: false },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const flatListRef = useRef();

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: input,
      fromMe: true,
      seen: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Thanks for your message 💜",
          fromMe: false,
        },
      ]);
      setTyping(false);
    }, 1500);
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={() => setShowImage(true)}>
            <View style={styles.avatarWrapper}>
              <Image source={chat.image} style={styles.headerAvatar} />
              <View style={styles.onlineDot} />
            </View>
          </TouchableOpacity>

          <View>
            <Text style={styles.name}>{chat.name}</Text>
            <Text style={styles.onlineText}>
              {typing ? "Typing..." : "Online"}
            </Text>
          </View>
        </View>

        <Ionicons name="call-outline" size={20} />
      </View>

      {/* MESSAGES */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesContainer}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <View
              style={[
                styles.bubble,
                item.fromMe ? styles.myMsg : styles.theirMsg,
              ]}
            >
              <Text style={{ color: item.fromMe ? "#fff" : "#000" }}>
                {item.text}
              </Text>
            </View>

            {item.fromMe && (
              <Text style={styles.status}>
                {item.seen ? "✓✓ Seen" : "✓ Sent"}
              </Text>
            )}
          </View>
        )}
      />

      {typing && (
        <View style={{ paddingHorizontal: 16 }}>
          <Text>Typing...</Text>
        </View>
      )}

      {/* INPUT */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Type a message"
            value={input}
            onChangeText={setInput}
            style={styles.input}
          />

          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* IMAGE MODAL */}
      <Modal visible={showImage} transparent>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowImage(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <Image source={chat.image} style={styles.fullImage} />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },

  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  avatarWrapper: { position: "relative" },

  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 20,
  },

  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CD964",
    borderWidth: 2,
    borderColor: "#fff",
  },

  name: { fontWeight: "600", fontSize: 15 },

  onlineText: { fontSize: 11, color: "#777" },

  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "75%",
  },

  myMsg: {
    alignSelf: "flex-end",
    backgroundColor: "#7B3FE4",
  },

  theirMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
  },

  status: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    alignSelf: "flex-end",
  },

  inputWrapper: { padding: 10 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 8,
    elevation: 5,
  },

  input: {
    flex: 1,
    backgroundColor: "#F3F3F3",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
  },

  sendBtn: {
    backgroundColor: "#7B3FE4",
    padding: 10,
    borderRadius: 25,
    marginLeft: 8,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: "90%",
    height: "50%",
    borderRadius: 15,
    resizeMode: "cover",
  },

  closeBtn: {
    position: "absolute",
    top: 60,
    right: 20,
  },
});