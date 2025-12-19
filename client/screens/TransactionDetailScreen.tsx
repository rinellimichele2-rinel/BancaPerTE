import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/lib/auth-context";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { Transaction } from "@shared/schema";
import type { HomeStackParamList } from "@/navigation/MainTabNavigator";

type TransactionDetailRouteProp = RouteProp<HomeStackParamList, "TransactionDetail">;

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<TransactionDetailRouteProp>();
  const queryClient = useQueryClient();
  const { userId, refreshUser } = useAuth();
  const { transaction } = route.params;

  const [showEditAmount, setShowEditAmount] = useState(false);
  const [showEditDescription, setShowEditDescription] = useState(false);
  const [newAmount, setNewAmount] = useState(transaction.amount);
  const [newDescription, setNewDescription] = useState(transaction.description);

  const isExpense = transaction.type === "expense";
  const amountValue = Math.abs(parseFloat(transaction.amount));
  const formattedAmount = `${isExpense ? "-" : "+"}${amountValue.toFixed(2).replace(".", ",")} \u20AC`;

  const dateStr = transaction.date 
    ? new Date(transaction.date).toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Ieri";

  const updateMutation = useMutation({
    mutationFn: async (updates: { amount?: string; description?: string }) => {
      const response = await apiRequest("PUT", `/api/transactions/${transaction.id}`, updates);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/transactions", userId] });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleSaveAmount = async () => {
    const cleanAmount = newAmount.replace(",", ".");
    if (!isNaN(parseFloat(cleanAmount)) && parseFloat(cleanAmount) > 0) {
      await updateMutation.mutateAsync({ amount: parseFloat(cleanAmount).toFixed(2) });
      setShowEditAmount(false);
    }
  };

  const handleSaveDescription = async () => {
    if (newDescription.trim()) {
      await updateMutation.mutateAsync({ description: newDescription.trim() });
      setShowEditDescription(false);
    }
  };

  const getCategoryIcon = () => {
    switch (transaction.category) {
      case "Supermercato":
        return "shopping-cart";
      case "Elettronica":
        return "monitor";
      case "Carburante":
        return "truck";
      case "Ristorazione":
        return "coffee";
      case "Salute":
        return "heart";
      case "Utenze":
        return "zap";
      case "Bonifici":
      case "Stipendio":
      case "Pensione":
        return "arrow-up-right";
      case "Affitti":
        return "home";
      case "Investimenti":
        return "trending-up";
      case "Rimborsi":
        return "rotate-ccw";
      default:
        return isExpense ? "arrow-down-left" : "arrow-up-right";
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={BankColors.primary} />
          <Text style={styles.backText}>Indietro</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Dettaglio operazione</Text>
        <Pressable style={styles.helpButton}>
          <Feather name="help-circle" size={24} color={BankColors.primary} />
          <Text style={styles.helpText}>Aiuto</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, isExpense ? styles.expenseIcon : styles.incomeIcon]}>
            <Feather 
              name={getCategoryIcon()} 
              size={32} 
              color={isExpense ? BankColors.primary : BankColors.success} 
            />
          </View>
        </View>

        <Text style={styles.categoryLabel}>
          {isExpense ? "ALTRE USCITE" : "ENTRATE"}
        </Text>

        <Pressable onPress={() => setShowEditAmount(true)}>
          <Text style={[styles.amount, isExpense && styles.expenseAmount]}>
            {formattedAmount}
          </Text>
        </Pressable>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Pressable style={styles.descriptionRow} onPress={() => setShowEditDescription(true)}>
              <Text style={styles.description}>{transaction.description}</Text>
            </Pressable>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          
          {!transaction.isContabilizzato ? (
            <Text style={styles.nonContabilizzato}>NON CONTABILIZZATO</Text>
          ) : null}

          {transaction.accountNumber ? (
            <Text style={styles.accountNumber}>{transaction.accountNumber}</Text>
          ) : null}
        </View>

        <View style={styles.actionsContainer}>
          <Pressable style={styles.actionButton}>
            <View style={styles.actionIconCircle}>
              <Feather name="share-2" size={24} color={BankColors.primary} />
            </View>
            <Text style={styles.actionText}>Condividi</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={showEditAmount} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditAmount(false)} />
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Modifica Importo</Text>
            <TextInput
              style={styles.modalInput}
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowEditAmount(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable 
                style={styles.modalSaveBtn} 
                onPress={handleSaveAmount}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color={BankColors.white} size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Salva</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditDescription} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditDescription(false)} />
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Modifica Descrizione</Text>
            <TextInput
              style={styles.modalInput}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Descrizione"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowEditDescription(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable 
                style={styles.modalSaveBtn} 
                onPress={handleSaveDescription}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color={BankColors.white} size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Salva</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankColors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
    backgroundColor: BankColors.gray50,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    color: BankColors.primary,
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  helpButton: {
    alignItems: "center",
  },
  helpText: {
    color: BankColors.primary,
    fontSize: 11,
    marginTop: 2,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing["3xl"],
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseIcon: {
    backgroundColor: "#F3E8FF",
  },
  incomeIcon: {
    backgroundColor: "#DCFCE7",
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BankColors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  amount: {
    fontSize: 32,
    fontWeight: "600",
    color: BankColors.gray900,
    marginBottom: Spacing.xl,
  },
  expenseAmount: {
    color: BankColors.gray900,
  },
  detailsContainer: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  descriptionRow: {
    flex: 1,
    marginRight: Spacing.md,
  },
  description: {
    fontSize: 16,
    color: BankColors.gray900,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 14,
    color: BankColors.gray600,
    textTransform: "capitalize",
  },
  nonContabilizzato: {
    fontSize: 12,
    fontWeight: "600",
    color: BankColors.success,
    alignSelf: "flex-end",
  },
  accountNumber: {
    fontSize: 14,
    color: BankColors.gray600,
    marginTop: Spacing.sm,
  },
  actionsContainer: {
    position: "absolute",
    bottom: 100,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BankColors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  actionText: {
    fontSize: 12,
    color: BankColors.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "85%",
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BankColors.gray900,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BankColors.gray300,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: BankColors.gray900,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: BankColors.gray100,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray600,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: BankColors.primary,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.white,
  },
});
