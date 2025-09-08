// Betkiray/app/chat/[id].tsx (Corrected and Smarter)

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import api from "@/config/api";
import { io, Socket } from "socket.io-client";

const { width } = Dimensions.get("window");

interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

// Define the shape of the recipient user
interface Recipient {
  name: string;
  avatar: string;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string, chatId?: string, recipientName?: string, recipientAvatar?: string }>();
  const recipientId = params.id;
  
  const { user } = useUser();

  const [chatId, setChatId] = useState<string | null>(params.chatId ? params.chatId : null); // --- FIX IS HERE ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // --- Real-time Logic ---

  useEffect(() => {
    if (!user || !recipientId) return;

    const initializeChat = async () => {
      try {
        let currentChatId = chatId;

        if (!currentChatId) {
          const chatResponse = await api.post('/chats/initiate', { recipientId });
          currentChatId = chatResponse.data.id;
          setChatId(currentChatId);
        }
        
        if (currentChatId) {
          const messagesResponse = await api.get(`/chats/${currentChatId}/messages`);
          setMessages(messagesResponse.data);

          setRecipient({ 
            name: params.recipientName || 'Chat User', 
            avatar: params.recipientAvatar || 'https://via.placeholder.com/150' 
          });

          if (!socketRef.current) {
            const socket = io(api.defaults.baseURL || "http://localhost:3000");
            socketRef.current = socket;

            socket.on('connect', () => {
              console.log('Connected to WebSocket server:', socket.id);
              socket.emit('joinChat', currentChatId);
            });

            socket.on('receiveMessage', (incomingMessage: Message) => {
              setMessages((prevMessages) => [...prevMessages, incomingMessage]);
            });

            socket.on('disconnect', () => {
              console.log('Disconnected from WebSocket server');
            });
          } else {
            socketRef.current.emit('joinChat', currentChatId);
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, recipientId, params.chatId]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !socketRef.current || !chatId || !user) return;
    const payload = { chatId, senderId: user.id, content: newMessage.trim() }; // <-- chatId is now a string
    socketRef.current.emit('sendMessage', payload);
    setNewMessage('');
  };

  const renderMessage = (msg: Message) => {
    const isMe = msg.senderId === user?.id;
    return (
      <View key={msg.id} style={[ styles.messageContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer ]}>
        {!isMe && (
          <Image source={{ uri: msg.sender.image || 'https://via.placeholder.com/150' }} style={styles.messageAvatar} contentFit="cover" />
        )}
        <View style={[ styles.messageBubble, isMe ? styles.myMessageBubble : styles.theirMessageBubble ]}>
          <Text style={[ styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText ]}>{msg.content}</Text>
        </View>
        <Text style={styles.messageTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    );
  };
  
  if (isLoading) {
    return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: recipient?.avatar }} style={styles.headerAvatar} contentFit="cover" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{recipient?.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
        {messages.map(renderMessage)}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.messageInputContainer}>
          <TextInput style={styles.messageInput} placeholder="Type a message..." placeholderTextColor="#888888" value={newMessage} onChangeText={setNewMessage} multiline />
        </View>
        <TouchableOpacity style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]} onPress={handleSendMessage} disabled={!newMessage.trim()}>
          <Ionicons name="send" size={20} color={newMessage.trim() ? "#ffffff" : "#888888"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Styles are unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  callButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: "#000000",
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: "#E5E5EA",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#ffffff",
  },
  theirMessageText: {
    color: "#000000",
  },
  messageTime: {
    fontSize: 11,
    color: "#888888",
    marginHorizontal: 8,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  messageInputContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    marginRight: 12,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E5EA",
  },
  sendButtonActive: {
    backgroundColor: "#007AFF",
  },
});