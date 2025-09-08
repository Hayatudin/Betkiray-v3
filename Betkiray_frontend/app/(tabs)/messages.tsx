// Betkiray/app/(tabs)/messages.tsx (Corrected)

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import api from "@/config/api";
import { useUser } from "@/contexts/UserContext";

type Chat = {
  id: string; // --- FIX IS HERE ---
  participants: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  messages: {
    content: string;
    createdAt: string;
  }[];
};

export default function MessagesScreen() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/chats');
        setChats(response.data);
      } catch (err) {
        setError("Failed to load messages.");
        console.error("Failed to fetch chats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.participants.find(p => p.user.id !== user?.id);
    return otherParticipant?.user?.name && otherParticipant.user.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleChatPress = (chat: Chat) => {
    const otherParticipant = chat.participants.find(p => p.user.id !== user?.id)?.user;
    if (!otherParticipant) return;
    
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: otherParticipant.id,
        chatId: chat.id,
        recipientName: otherParticipant.name || 'Unknown User',
        recipientAvatar: otherParticipant.image || '',
      }
    });
  };

  const renderChatItem = (chat: Chat) => {
    const otherParticipant = chat.participants.find(p => p.user.id !== user?.id)?.user;
    const lastMessage = chat.messages[0];

    if (!otherParticipant) return null;

    return (
      <TouchableOpacity
        key={chat.id}
        style={styles.chatItem}
        onPress={() => handleChatPress(chat)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: otherParticipant.image || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{otherParticipant.name || 'Unknown User'}</Text>
            {lastMessage && <Text style={styles.chatTime}>{new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
          </View>
          <View style={styles.messageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage?.content || "No messages yet"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#888888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 50 }} size="large" />
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#888888" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No chats found" : "No messages yet"}
            </Text>
          </View>
        ) : (
          filteredChats.map(renderChatItem)
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
  },
  newChatButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    marginLeft: 12,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  chatTime: {
    fontSize: 12,
    color: "#888888",
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#888888",
    flex: 1,
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#888888",
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginTop: 12,
  },
  bottomSpacing: {
    height: 100,
  },
});