import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import api from "@/config/api";
import { useUser } from "@/contexts/UserContext";
import { io, Socket } from "socket.io-client";

type Chat = {
  id: string;
  participants: { user: { id: string; name: string | null; image: string | null; }; }[];
  messages: { content: string; createdAt: string; senderId: string; }[];
};

export default function MessagesScreen() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const response = await api.get('/chats');
      const rawChats: Chat[] = response.data;
      const processedChats = rawChats.map(chat => ({ ...chat, participants: chat.participants.map(p => ({ ...p, user: { ...p.user, image: p.user.image && !p.user.image.startsWith('http') ? `${api.defaults.baseURL}${p.user.image}` : p.user.image, } })) }));
      setChats(processedChats);
    } catch (err) {
      setError("Failed to load messages.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchChats();

      if (user && !socketRef.current) {
        const socket = io(api.defaults.baseURL || "http://localhost:3000");
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('registerUser', user.id);
        });

        socket.on('onlineUsers', (users: string[]) => {
          setOnlineUsers(users);
        });

        // Listen for new messages and update the chat list
        socket.on('receiveMessage', (message: { id: number; content: string; createdAt: string; senderId: string; chatId: string; }) => {
          setChats((prevChats) => {
            // Find the chat that this message belongs to
            const chatIndex = prevChats.findIndex(chat => chat.id === message.chatId);

            if (chatIndex !== -1) {
              // Update the existing chat with the new message
              const updatedChats = [...prevChats];
              const updatedChat = { ...updatedChats[chatIndex] };

              // Add the new message at the beginning (most recent first)
              updatedChat.messages = [{
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.senderId
              }, ...updatedChat.messages];

              // Remove the chat from its current position
              updatedChats.splice(chatIndex, 1);

              // Add it to the top of the list
              return [updatedChat, ...updatedChats];
            }

            // If chat not found, fetch chats again to get the new chat
            fetchChats();
            return prevChats;
          });
        });

        return () => {
          socket.disconnect();
          socketRef.current = null;
        };
      }
    }, [fetchChats, user])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchChats();
  }, [fetchChats]);

  const filteredChats = chats.filter((chat) => {
    const other = chat.participants.find(p => p.user.id !== user?.id);
    return other?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleChatPress = (chat: Chat) => {
    const other = chat.participants.find(p => p.user.id !== user?.id)?.user;
    if (!other) return;
    router.push({ pathname: "/chat/[id]", params: { id: other.id, chatId: chat.id, recipientName: other.name || 'User', recipientAvatar: other.image || '' } });
  };

  const renderChatItem = (chat: Chat) => {
    const other = chat.participants.find(p => p.user.id !== user?.id)?.user;
    if (!other) return null;
    const lastMessage = chat.messages[0];
    const isOnline = onlineUsers.includes(other.id);
    let lastMessageText = "No messages yet";
    if (lastMessage) {
      lastMessageText = lastMessage.senderId === user?.id ? `You: ${lastMessage.content}` : lastMessage.content;
    }

    return (
      <TouchableOpacity key={chat.id} style={styles.chatItem} onPress={() => handleChatPress(chat)}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: other.image || 'https://via.placeholder.com/50' }} style={styles.avatar} contentFit="cover" />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}><Text style={styles.chatName}>{other.name || 'Unknown'}</Text>{lastMessage && <Text style={styles.chatTime}>{new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}</View>
          <View style={styles.messageRow}><Text style={styles.lastMessage} numberOfLines={1}>{lastMessageText}</Text></View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}><Text style={styles.title}>Messages</Text></View>
      <View style={styles.searchContainer}><View style={styles.searchBar}><Ionicons name="search-outline" size={20} color="#888888" /><TextInput style={styles.searchInput} placeholder="Search chats..." value={searchQuery} onChangeText={setSearchQuery} /></View></View>
      {isLoading && !isRefreshing ? <ActivityIndicator style={{ marginTop: 50 }} size="large" /> : error ? <View style={styles.emptyState}><Text style={styles.errorText}>{error}</Text></View> : (
        <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
          {filteredChats.length === 0 ? <View style={styles.emptyState}><Ionicons name="chatbubbles-outline" size={48} color="#888888" /><Text style={styles.emptyText}>{searchQuery ? "No chats found" : "No messages yet"}</Text></View> : filteredChats.map(renderChatItem)}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: "700", color: "#000000" },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 16, color: "#000000", marginLeft: 12 },
  chatList: { flex: 1 },
  chatItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  avatarContainer: { position: "relative", marginRight: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  onlineIndicator: { position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#2ecc71', borderWidth: 2, borderColor: '#ffffff' },
  chatContent: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: "600", color: "#000000" },
  chatTime: { fontSize: 12, color: "#888888" },
  messageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lastMessage: { fontSize: 14, color: "#888888", flex: 1, marginRight: 8 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { fontSize: 16, color: "#888888", marginTop: 12 },
  errorText: { fontSize: 16, color: 'red', marginTop: 12 },
  bottomSpacing: { height: 100 },
});