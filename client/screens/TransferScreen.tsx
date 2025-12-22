import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "@/components/Icon";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface UserInfo {
  id: string;
  username: string;
  fullName: string | null;
  accountNumber: string | null;
  balance: string | null;
}

export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const { data: users = [], isLoading } = useQuery<UserInfo[]>({
    queryKey: ["/api/users"],
  });

  const otherUsers = users.filter((u) => u.id !== user?.id);

  const handleTransfer = async () => {
    if (!selectedUser || !amount || !user) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Errore", "Inserisci un importo valido maggiore di zero");
      return;
    }

    const currentBalance = parseFloat(user.balance || "0");
    if (amountNum > currentBalance) {
      Alert.alert("Errore", "Saldo insufficiente per questo trasferimento");
      return;
    }

    Alert.alert(
      "Conferma Trasferimento",
      `Vuoi trasferire ${amountNum.toFixed(0)} EUR a @${selectedUser.username}?\n\nCodice ID: ${selectedUser.accountNumber || "N/A"}`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma",
          onPress: async () => {
            setIsTransferring(true);
            try {
              const response = await apiRequest("POST", "/api/transfer", {
                fromUserId: user.id,
                toUserId: selectedUser.id,
                amount: amountNum,
              });

              const data = await response.json();
              if (data.success) {
                await refreshUser();
                await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                await queryClient.invalidateQueries({ queryKey: [`/api/transactions/${user.id}`] });
                
                Alert.alert(
                  "Trasferimento Completato",
                  `Hai trasferito ${amountNum.toFixed(0)} EUR a @${selectedUser.username}`,
                  [{ text: "OK", onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert("Errore", data.error || "Errore durante il trasferimento");
              }
            } catch (error: any) {
              if (error.securityViolation) {
                Alert.alert(
                  "Sicurezza",
                  "Rilevata modifica non autorizzata. L'operazione è stata bloccata.",
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert("Errore", error.message || "Errore durante il trasferimento");
              }
            } finally {
              setIsTransferring(false);
            }
          },
        },
      ]
    );
  };

  const formatBalance = (balance: string | null | undefined) => {
    if (!balance) return "0";
    const num = parseFloat(balance);
    return num.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={BankColors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Scambia Denaro</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Il tuo saldo disponibile</Text>
        <Text style={styles.balanceAmount}>{formatBalance(user?.balance)} EUR</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <Text style={styles.sectionTitle}>Seleziona destinatario</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BankColors.primary} />
            <Text style={styles.loadingText}>Caricamento utenti...</Text>
          </View>
        ) : otherUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="users" size={48} color={BankColors.gray400} />
            <Text style={styles.emptyText}>Nessun altro utente registrato</Text>
            <Text style={styles.emptySubtext}>
              Invita altri utenti a registrarsi per scambiare denaro
            </Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {otherUsers.map((u) => (
              <Pressable
                key={u.id}
                style={[
                  styles.userCard,
                  selectedUser?.id === u.id && styles.userCardSelected,
                ]}
                onPress={() => setSelectedUser(u)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {u.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>@{u.username}</Text>
                  <Text style={styles.userAccount}>
                    {u.accountNumber || "ID non disponibile"}
                  </Text>
                </View>
                {selectedUser?.id === u.id ? (
                  <Icon name="check-circle" size={24} color={BankColors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        )}

        {selectedUser ? (
          <View style={styles.transferForm}>
            <Text style={styles.sectionTitle}>Importo da trasferire</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>EUR</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ""))}
                placeholder="0"
                placeholderTextColor={BankColors.gray400}
                keyboardType="numeric"
                maxLength={7}
              />
            </View>

            <Pressable
              style={[
                styles.transferButton,
                (!amount || isTransferring) && styles.transferButtonDisabled,
              ]}
              onPress={handleTransfer}
              disabled={!amount || isTransferring}
            >
              {isTransferring ? (
                <ActivityIndicator color={BankColors.white} />
              ) : (
                <>
                  <Icon name="send" size={20} color={BankColors.white} />
                  <Text style={styles.transferButtonText}>Trasferisci</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankColors.gray100,
  },
  header: {
    backgroundColor: BankColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: BankColors.white,
  },
  balanceCard: {
    backgroundColor: BankColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: BankColors.white,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray700,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  loadingContainer: {
    padding: Spacing.xl * 2,
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    color: BankColors.gray500,
  },
  emptyContainer: {
    padding: Spacing.xl * 2,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray700,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: BankColors.gray500,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  usersList: {
    paddingHorizontal: Spacing.lg,
  },
  userCard: {
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  userCardSelected: {
    borderColor: BankColors.primary,
    backgroundColor: "rgba(32, 128, 55, 0.05)",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: BankColors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  userAccount: {
    fontSize: 14,
    color: BankColors.gray500,
    marginTop: 2,
  },
  transferForm: {
    marginTop: Spacing.md,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: BankColors.gray500,
    marginRight: Spacing.md,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: BankColors.gray900,
  },
  transferButton: {
    backgroundColor: BankColors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  transferButtonDisabled: {
    opacity: 0.5,
  },
  transferButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.white,
  },
});
