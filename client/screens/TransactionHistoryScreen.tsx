import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { Transaction } from "@shared/schema";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "@/navigation/MainTabNavigator";

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

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

export default function TransactionHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", userId],
    enabled: !!userId,
  });

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    return transactions.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate >= threeDaysAgo;
    });
  }, [transactions]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(tx => {
      if (!tx.date) return;
      const date = new Date(tx.date);
      const dateKey = date.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    return Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].date!);
      const dateB = new Date(b[1][0].date!);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredTransactions]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={BankColors.gray900} />
        </Pressable>
        <Text style={styles.headerTitle}>Movimenti</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterInfo}>
        <Icon name="calendar" size={16} color={BankColors.gray500} />
        <Text style={styles.filterText}>Ultimi 3 giorni</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={BankColors.primary} />
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={48} color={BankColors.gray300} />
          <Text style={styles.emptyText}>Nessun movimento negli ultimi 3 giorni</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {groupedTransactions.map(([dateLabel, txs]) => (
            <View key={dateLabel} style={styles.dateGroup}>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              {txs.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => navigation.navigate("TransactionDetail", { transaction })}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankColors.gray50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: BankColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  backBtn: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  headerSpacer: {
    width: 40,
  },
  filterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: BankColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  filterText: {
    fontSize: 14,
    color: BankColors.gray500,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: BankColors.gray500,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  dateGroup: {
    marginTop: Spacing.lg,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BankColors.gray500,
    textTransform: "capitalize",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray100,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontWeight: "500",
    color: BankColors.gray900,
  },
  transactionAccount: {
    fontSize: 12,
    color: BankColors.gray500,
    marginTop: 2,
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  nonContabilizzato: {
    fontSize: 9,
    color: BankColors.warning,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: BankColors.primary,
  },
  expenseAmount: {
    color: BankColors.gray900,
  },
});
