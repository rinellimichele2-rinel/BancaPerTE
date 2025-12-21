import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";

interface Message {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  userId: string | null;
  title: string;
  createdAt: string;
  messages?: Message[];
}

const SUGGESTED_QUESTIONS = [
  "Come posso risparmiare di più?",
  "Analizza le mie spese del mese",
  "Consigli per investire i risparmi",
  "Cos'è un fondo comune d'investimento?",
];

export default function AdvisorScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const { userId, user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Fetch conversations list
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", userId],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}/api/conversations?userId=${userId}`);
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch active conversation with messages
  const { data: activeConversation, isLoading: loadingConversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", activeConversationId],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}/api/conversations/${activeConversationId}`);
      return response.json();
    },
    enabled: !!activeConversationId,
    refetchInterval: false,
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: "Nuova Conversazione",
        userId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setActiveConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", userId] });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversationId) return;
      setIsTyping(true);
      
      const userContext = user ? `Saldo attuale: €${parseFloat(user.balance || "0").toFixed(2)}, Nome: ${user.fullName}` : "";
      
      const response = await apiRequest("POST", `/api/conversations/${activeConversationId}/messages`, {
        content,
        userContext,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", activeConversationId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      setIsTyping(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeConversation?.messages) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeConversation?.messages?.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const message = inputMessage.trim();
    setInputMessage("");
    
    // If no active conversation, create one first
    if (!activeConversationId) {
      const newConversation = await createConversationMutation.mutateAsync();
      setActiveConversationId(newConversation.id);
      setTimeout(() => {
        sendMessageMutation.mutate(message);
      }, 100);
    } else {
      sendMessageMutation.mutate(message);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const messages = activeConversation?.messages || [];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.md }]}>
        {!activeConversationId && messages.length === 0 ? (
          <ScrollView 
            style={styles.welcomeScroll}
            contentContainerStyle={[styles.welcomeContainer, { paddingBottom: insets.bottom + 100 }]}
          >
            <View style={styles.advisorIcon}>
              <Icon name="message-circle" size={48} color={BankColors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Assistente EquisCash</Text>
            <Text style={styles.welcomeSubtitle}>
              Il tuo consulente finanziario personale, sempre disponibile per aiutarti.
            </Text>

            <Text style={styles.suggestionsLabel}>Domande suggerite:</Text>
            <View style={styles.suggestionsContainer}>
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    pressed && styles.suggestionChipPressed,
                  ]}
                  onPress={() => handleSuggestedQuestion(question)}
                >
                  <Text style={styles.suggestionText}>{question}</Text>
                </Pressable>
              ))}
            </View>

            {conversations.length > 0 ? (
              <View style={styles.recentSection}>
                <Text style={styles.recentLabel}>Conversazioni recenti:</Text>
                {conversations.slice(0, 3).map((conv) => (
                  <Pressable
                    key={conv.id}
                    style={({ pressed }) => [
                      styles.recentItem,
                      pressed && styles.recentItemPressed,
                    ]}
                    onPress={() => setActiveConversationId(conv.id)}
                  >
                    <Icon name="message-square" size={20} color={BankColors.gray500} />
                    <Text style={styles.recentItemText} numberOfLines={1}>
                      {conv.title}
                    </Text>
                    <Icon name="chevron-right" size={20} color={BankColors.gray400} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
        ) : (
          <>
            <View style={styles.chatHeader}>
              <Pressable style={styles.backBtn} onPress={handleNewConversation}>
                <Icon name="plus" size={20} color={BankColors.primary} />
                <Text style={styles.backBtnText}>Nuova</Text>
              </Pressable>
            </View>
            
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesScroll}
              contentContainerStyle={[styles.messagesContainer, { paddingBottom: 20 }]}
            >
              {loadingConversation ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={BankColors.primary} />
                </View>
              ) : (
                messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      msg.role === "user" ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {msg.role === "assistant" ? (
                      <View style={styles.assistantHeader}>
                        <Icon name="message-circle" size={16} color={BankColors.primary} />
                        <Text style={styles.assistantLabel}>Assistente EquisCash</Text>
                      </View>
                    ) : null}
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === "user" ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                ))
              )}
              
              {isTyping ? (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <View style={styles.typingIndicator}>
                    <View style={styles.typingDot} />
                    <View style={[styles.typingDot, styles.typingDotMiddle]} />
                    <View style={styles.typingDot} />
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </>
        )}
      </View>

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Scrivi un messaggio..."
          placeholderTextColor={BankColors.gray400}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
        />
        <Pressable
          style={[
            styles.sendButton,
            (!inputMessage.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || sendMessageMutation.isPending}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color={BankColors.white} />
          ) : (
            <Icon name="send" size={20} color={BankColors.white} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankColors.gray100,
  },
  content: {
    flex: 1,
  },
  welcomeScroll: {
    flex: 1,
  },
  welcomeContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  advisorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BankColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: BankColors.gray900,
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: BankColors.gray600,
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    lineHeight: 24,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BankColors.gray700,
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  suggestionsContainer: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  suggestionChip: {
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: BankColors.gray200,
  },
  suggestionChipPressed: {
    backgroundColor: BankColors.gray50,
  },
  suggestionText: {
    fontSize: 15,
    color: BankColors.gray800,
  },
  recentSection: {
    width: "100%",
  },
  recentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BankColors.gray700,
    marginBottom: Spacing.md,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: BankColors.gray200,
  },
  recentItemPressed: {
    backgroundColor: BankColors.gray50,
  },
  recentItemText: {
    flex: 1,
    fontSize: 15,
    color: BankColors.gray800,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    fontSize: 14,
    color: BankColors.primary,
    fontWeight: "500",
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  userBubble: {
    backgroundColor: BankColors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: BankColors.white,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: BankColors.gray200,
  },
  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  assistantLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BankColors.primary,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: BankColors.white,
  },
  assistantText: {
    color: BankColors.gray800,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BankColors.gray400,
    opacity: 0.5,
  },
  typingDotMiddle: {
    opacity: 0.75,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: BankColors.white,
    borderTopWidth: 1,
    borderTopColor: BankColors.gray200,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: BankColors.gray100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    maxHeight: 100,
    color: BankColors.gray900,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: BankColors.gray300,
  },
});
