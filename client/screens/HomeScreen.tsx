import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";
import { Icon } from "@/components/Icon";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { Transaction } from "@shared/schema";
import type { HomeStackParamList } from "@/navigation/MainTabNavigator";

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, "HomeMain">;

const QuickActionButton = ({ 
  icon, 
  label, 
  onPress 
}: { 
  icon: string; 
  label: string; 
  onPress?: () => void;
}) => (
  <Pressable 
    style={({ pressed }) => [styles.quickActionBtn, pressed && styles.quickActionPressed]}
    onPress={onPress}
  >
    <Icon name={icon} size={18} color={BankColors.white} />
    <Text style={styles.quickActionLabel}>{label}</Text>
  </Pressable>
);

const TransactionItem = ({ transaction, onPress }: { transaction: Transaction; onPress: () => void }) => {
  const isExpense = transaction.type === "expense";
  const amountValue = Math.abs(parseFloat(transaction.amount));
  const formattedAmount = `${isExpense ? "-" : "+"} ${amountValue.toFixed(2).replace(".", ",")} \u20AC`;
  const dateStr = transaction.date ? new Date(transaction.date).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) : "";

  return (
    <Pressable style={styles.transactionItem} onPress={onPress}>
      <View style={styles.transactionIcon}>
        <Icon 
          name={isExpense ? "arrow-down-left" : "arrow-up-right"} 
          size={20} 
          color={BankColors.gray600} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDate}>{dateStr}</Text>
        <Text style={styles.transactionDesc}>{transaction.description}</Text>
        {transaction.accountNumber ? (
          <Text style={styles.transactionAccount}>{transaction.accountNumber}</Text>
        ) : null}
      </View>
      <View style={styles.transactionAmountContainer}>
        {!transaction.isContabilizzato ? (
          <Text style={styles.nonContabilizzato}>NON CONTABILIZZATO</Text>
        ) : null}
        <View style={styles.transactionAmountRow}>
          <Text style={[styles.transactionAmount, isExpense && styles.expenseAmount]}>
            {formattedAmount}
          </Text>
          <Icon name="chevron-right" size={20} color={BankColors.gray400} />
        </View>
      </View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { user, userId, refreshUser, updateBalance, updateAccountNumber } = useAuth();
  const [showBalance, setShowBalance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [showWeeklyHistory, setShowWeeklyHistory] = useState(false);

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", userId],
    enabled: !!userId,
  });

  const generateTransactionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/transactions/${userId}/generate-random`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/transactions", userId] });
      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleHelpPress = () => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateTransactionsMutation.mutate();
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshUser();
    await queryClient.invalidateQueries({ queryKey: ["/api/transactions", userId] });
    setIsRefreshing(false);
  }, [refreshUser, queryClient, userId]);

  const handleToggleBalance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowBalance(!showBalance);
  };

  const handleOpenPayPal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const paypalUrl = "https://paypal.me/rinntech2/1";
    try {
      const supported = await Linking.canOpenURL(paypalUrl);
      if (supported) {
        await Linking.openURL(paypalUrl);
      } else {
        Alert.alert("Errore", "Impossibile aprire il link PayPal");
      }
    } catch (error) {
      Alert.alert("Errore", "Si e verificato un errore nell'apertura del link");
    }
  };

  const handleEditBalance = () => {
    setNewBalance(user?.balance || "0");
    setShowEditBalance(true);
  };

  const handleSaveBalance = async () => {
    const value = newBalance.replace(",", ".");
    if (!isNaN(parseFloat(value))) {
      await updateBalance(value);
      setShowEditBalance(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleEditAccountNumber = () => {
    setNewAccountNumber(user?.accountNumber || "");
    setShowEditAccount(true);
  };

  const handleSaveAccountNumber = async () => {
    if (newAccountNumber.trim()) {
      await updateAccountNumber(newAccountNumber.trim());
      setShowEditAccount(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    const [integer, decimal] = num.toFixed(2).split(".");
    return { integer: integer.replace(/\B(?=(\d{3})+(?!\d))/g, "."), decimal };
  };

  const balanceFormatted = user?.balance ? formatBalance(user.balance) : { integer: "0", decimal: "00" };

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Filter transactions from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const txDate = new Date(t.date);
    return txDate >= sevenDaysAgo;
  });

  const formatTransactionDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Oggi";
    if (date.toDateString() === yesterday.toDateString()) return "Ieri";
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <LinearGradient
          colors={[BankColors.primaryLight, BankColors.primary, BankColors.primaryDark]}
          style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
        >
          <View style={styles.headerTop}>
            <Pressable style={styles.headerBackBtn}>
              <Icon name="chevron-left" size={24} color={BankColors.white} />
              <Text style={styles.headerBackText}>Il mio patrimonio</Text>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable style={styles.headerAction}>
                <Icon name="search" size={22} color={BankColors.white} />
                <Text style={styles.headerActionText}>Cerca</Text>
              </Pressable>
              <Pressable style={styles.headerAction} onPress={handleHelpPress}>
                {generateTransactionsMutation.isPending ? (
                  <ActivityIndicator size="small" color={BankColors.white} />
                ) : (
                  <Icon name="help-circle" size={22} color={BankColors.white} />
                )}
                <Text style={styles.headerActionText}>Aiuto</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Ciao {user?.username || "Utente"}</Text>
            <Pressable>
              <Text style={styles.personalizeLink}>Personalizza</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleEditAccountNumber}>
            <Text style={styles.accountNumber}>Conto {user?.accountNumber || "1000/00002521"}</Text>
          </Pressable>

          <Pressable style={styles.balanceRow} onPress={handleOpenPayPal} onLongPress={handleEditBalance}>
            {showBalance ? (
              <Text style={styles.balanceAmount}>
                {balanceFormatted.integer}<Text style={styles.balanceDecimal}>,{balanceFormatted.decimal}</Text> {"\u20AC"}
              </Text>
            ) : (
              <Text style={styles.balanceAmount}>******* {"\u20AC"}</Text>
            )}
            <Pressable style={styles.showHideBtn} onPress={handleToggleBalance}>
              <Icon 
                name={showBalance ? "eye-off" : "eye"} 
                size={20} 
                color={BankColors.white} 
              />
              <Text style={styles.showHideText}>{showBalance ? "Nascondi" : "Mostra"}</Text>
            </Pressable>
          </Pressable>

          <Pressable onPress={handleEditBalance}>
            <Text style={styles.detailLink}>Dettaglio</Text>
          </Pressable>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
            contentContainerStyle={styles.quickActionsContainer}
          >
            <QuickActionButton icon="send" label="Bonifico" />
            <QuickActionButton icon="credit-card" label="Carta virtuale" />
            <QuickActionButton icon="file-text" label="CBILL/pagoPA" />
            <QuickActionButton icon="smartphone" label="Ricarica" />
            <QuickActionButton icon="message-circle" label="Consulente AI" onPress={() => navigation.navigate("Advisor")} />
            <QuickActionButton icon="rss" label="Notizie" onPress={() => navigation.navigate("News")} />
          </ScrollView>
        </LinearGradient>

        <View style={styles.movimentiSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimenti</Text>
            <Pressable style={styles.viewAllBtn} onPress={() => setShowWeeklyHistory(true)}>
              <Text style={styles.viewAllText}>Visualizza tutti</Text>
              <Icon name="chevron-right" size={16} color={BankColors.primary} />
            </Pressable>
          </View>

          <View style={styles.expenseSummary}>
            <Text style={styles.expenseSummaryLabel}>Uscite nei prossimi 30 giorni:</Text>
            <Text style={styles.expenseSummaryAmount}>- {totalExpenses.toFixed(2).replace(".", ",")} {"\u20AC"}</Text>
            <Text style={styles.expenseSummaryCount}>{transactions.filter(t => t.type === "expense").length} operazione</Text>
            <Pressable onPress={() => setShowWeeklyHistory(true)}>
              <Text style={styles.detailLinkGreen}>Dettagli</Text>
            </Pressable>
          </View>

          {loadingTransactions ? (
            <ActivityIndicator style={styles.loader} color={BankColors.primary} />
          ) : (
            transactions.slice(0, 5).map((transaction) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction} 
                onPress={() => navigation.navigate("TransactionDetail", { transaction })}
              />
            ))
          )}
        </View>

        <View style={styles.analisiSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analisi delle spese</Text>
            <Pressable style={styles.viewAllBtn} onPress={() => navigation.navigate("Analisi")}>
              <Text style={styles.viewAllText}>Vai alla sezione</Text>
              <Icon name="chevron-right" size={16} color={BankColors.primary} />
            </Pressable>
          </View>

          <View style={styles.analisiCard}>
            <View style={styles.analisiRow}>
              <Text style={styles.analisiLabel}>Uscite del mese</Text>
              <View style={styles.analisiAmountRow}>
                <Text style={styles.analisiAmountNegative}>
                  - {totalExpenses.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} {"\u20AC"}
                </Text>
                <Icon name="arrow-down" size={16} color={BankColors.error} />
              </View>
            </View>
            <View style={styles.analisiDivider} />
            <View style={styles.analisiRow}>
              <Text style={styles.analisiLabel}>Entrate del mese</Text>
              <View style={styles.analisiAmountRow}>
                <Text style={styles.analisiAmountPositive}>
                  + {totalIncome.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} {"\u20AC"}
                </Text>
                <Icon name="arrow-up" size={16} color={BankColors.success} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showEditBalance} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditBalance(false)} />
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Modifica Saldo</Text>
            <TextInput
              style={styles.modalInput}
              value={newBalance}
              onChangeText={setNewBalance}
              keyboardType="decimal-pad"
              placeholder="0.00"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowEditBalance(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveBalance}>
                <Text style={styles.modalSaveText}>Salva</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditAccount} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditAccount(false)} />
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Modifica Numero Conto</Text>
            <TextInput
              style={styles.modalInput}
              value={newAccountNumber}
              onChangeText={setNewAccountNumber}
              placeholder="1000/00002521"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowEditAccount(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveAccountNumber}>
                <Text style={styles.modalSaveText}>Salva</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showWeeklyHistory} animationType="slide">
        <View style={styles.weeklyModalContainer}>
          <View style={styles.weeklyModalHeader}>
            <Pressable onPress={() => setShowWeeklyHistory(false)} style={styles.weeklyCloseBtn}>
              <Icon name="x" size={24} color={BankColors.gray800} />
            </Pressable>
            <Text style={styles.weeklyModalTitle}>Movimenti Settimanali</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.weeklyScrollView} contentContainerStyle={styles.weeklyScrollContent}>
            <Text style={styles.weeklyLabel}>TRANSAZIONI ULTIMI 7 GIORNI</Text>
            
            {weeklyTransactions.length === 0 ? (
              <View style={styles.weeklyEmptyState}>
                <Icon name="inbox" size={48} color={BankColors.gray400} />
                <Text style={styles.weeklyEmptyText}>Nessuna transazione questa settimana</Text>
              </View>
            ) : (
              weeklyTransactions.map((transaction) => {
                const isExpense = transaction.type === "expense";
                const amountValue = Math.abs(parseFloat(transaction.amount));
                const formattedAmount = `${isExpense ? "-" : "+"} ${amountValue.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} \u20AC`;
                
                return (
                  <Pressable 
                    key={transaction.id} 
                    style={styles.weeklyTransRow}
                    onPress={() => {
                      setShowWeeklyHistory(false);
                      navigation.navigate("TransactionDetail", { transaction });
                    }}
                  >
                    <View style={styles.weeklyIconCircle}>
                      <Icon 
                        name={isExpense ? "arrow-down-left" : "arrow-up-right"} 
                        size={20} 
                        color={isExpense ? BankColors.gray600 : BankColors.primary} 
                      />
                    </View>
                    <View style={styles.weeklyTransInfo}>
                      <Text style={styles.weeklyTransName}>{transaction.description}</Text>
                      <Text style={styles.weeklyTransDate}>
                        {transaction.date ? formatTransactionDate(transaction.date) : ""}
                      </Text>
                    </View>
                    <Text style={[
                      styles.weeklyTransAmount,
                      { color: isExpense ? BankColors.gray800 : BankColors.primary }
                    ]}>
                      {formattedAmount}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerBackBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBackText: {
    color: BankColors.white,
    fontSize: 14,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  headerAction: {
    alignItems: "center",
  },
  headerActionText: {
    color: BankColors.white,
    fontSize: 11,
    marginTop: 2,
  },
  greetingContainer: {
    marginBottom: Spacing.sm,
  },
  greeting: {
    color: BankColors.white,
    fontSize: 32,
    fontWeight: "700",
  },
  personalizeLink: {
    color: BankColors.white,
    fontSize: 14,
    textDecorationLine: "underline",
    opacity: 0.9,
  },
  accountNumber: {
    color: BankColors.white,
    fontSize: 16,
    marginBottom: Spacing.md,
    opacity: 0.9,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    color: BankColors.white,
    fontSize: 36,
    fontWeight: "700",
  },
  balanceDecimal: {
    fontSize: 24,
    fontWeight: "400",
  },
  showHideBtn: {
    alignItems: "center",
  },
  showHideText: {
    color: BankColors.white,
    fontSize: 11,
    marginTop: 2,
  },
  detailLink: {
    color: BankColors.white,
    fontSize: 14,
    textDecorationLine: "underline",
    marginBottom: Spacing.lg,
  },
  quickActionsScroll: {
    marginHorizontal: -Spacing.lg,
  },
  quickActionsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: "row",
  },
  quickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
  },
  quickActionPressed: {
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  quickActionLabel: {
    color: BankColors.white,
    fontSize: 13,
    fontWeight: "500",
  },
  movimentiSection: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    color: BankColors.primary,
    fontSize: 14,
  },
  expenseSummary: {
    backgroundColor: BankColors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  expenseSummaryLabel: {
    fontSize: 14,
    color: BankColors.gray600,
    marginBottom: Spacing.xs,
  },
  expenseSummaryAmount: {
    fontSize: 28,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  expenseSummaryCount: {
    fontSize: 12,
    color: BankColors.gray500,
    marginBottom: Spacing.xs,
  },
  detailLinkGreen: {
    color: BankColors.primary,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: BankColors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: BankColors.gray500,
    marginBottom: 2,
  },
  transactionDesc: {
    fontSize: 15,
    color: BankColors.gray900,
    fontWeight: "500",
  },
  transactionAccount: {
    fontSize: 12,
    color: BankColors.gray500,
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  nonContabilizzato: {
    fontSize: 10,
    color: BankColors.primary,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionAmountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "500",
    color: BankColors.gray900,
  },
  expenseAmount: {
    color: BankColors.error,
  },
  chatButton: {
    position: "absolute",
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.gray800,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  chatButtonText: {
    color: BankColors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "80%",
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BankColors.gray300,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 18,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankColors.gray200,
    alignItems: "center",
  },
  modalCancelText: {
    color: BankColors.gray700,
    fontSize: 16,
  },
  modalSaveBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankColors.primary,
    alignItems: "center",
  },
  modalSaveText: {
    color: BankColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  analisiSection: {
    padding: Spacing.lg,
    backgroundColor: BankColors.white,
  },
  analisiCard: {
    backgroundColor: BankColors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  analisiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  analisiLabel: {
    fontSize: 15,
    color: BankColors.gray700,
  },
  analisiAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  analisiAmountNegative: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.error,
  },
  analisiAmountPositive: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.primary,
  },
  analisiDivider: {
    height: 1,
    backgroundColor: BankColors.gray300,
    marginVertical: Spacing.sm,
  },
  weeklyModalContainer: {
    flex: 1,
    backgroundColor: BankColors.white,
  },
  weeklyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  weeklyCloseBtn: {
    padding: Spacing.xs,
  },
  weeklyModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BankColors.gray800,
  },
  weeklyScrollView: {
    flex: 1,
  },
  weeklyScrollContent: {
    padding: Spacing.lg,
  },
  weeklyLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: BankColors.gray500,
    marginBottom: Spacing.lg,
    letterSpacing: 1,
  },
  weeklyEmptyState: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  weeklyEmptyText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: BankColors.gray500,
  },
  weeklyTransRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray100,
  },
  weeklyIconCircle: {
    width: 40,
    height: 40,
    backgroundColor: BankColors.gray100,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  weeklyTransInfo: {
    flex: 1,
  },
  weeklyTransName: {
    fontWeight: "600",
    fontSize: 15,
    color: BankColors.gray800,
  },
  weeklyTransDate: {
    color: BankColors.gray500,
    fontSize: 12,
    marginTop: 2,
  },
  weeklyTransAmount: {
    fontWeight: "600",
    fontSize: 15,
  },
});
