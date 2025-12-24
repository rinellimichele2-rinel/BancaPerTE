import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "@/components/Icon";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface UserInfo {
  id: string;
  username: string;
  fullName: string | null;
  displayName?: string | null;
  accountNumber: string | null;
  balance?: string | null;
}

export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchUsername, setSearchUsername] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  
  // Fetch all users for listing - with cache busting for fresh data
  const { data: allUsers = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery<UserInfo[]>({
    queryKey: ["/api/users/list", user?.id],
    queryFn: async () => {
      const timestamp = Date.now();
      const response = await fetch(
        new URL(`/api/users/list?exclude=${user?.id}&_t=${timestamp}`, getApiUrl()).toString()
      );
      if (!response.ok) return [];
      const data = await response.json();
      console.log("[TransferScreen] Users fetched from API:", JSON.stringify(data));
      return data;
    },
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 0,
  });
  
  // Filter users in real-time as user types - search by exact username string
  const filteredUsers = React.useMemo(() => {
    console.log("[TransferScreen] allUsers:", JSON.stringify(allUsers.map(u => u.username)));
    if (!searchUsername.trim()) return allUsers;
    const search = searchUsername.trim().toLowerCase().replace(/^@/, "");
    return allUsers.filter(u => {
      const usernameMatch = u.username.toLowerCase().includes(search);
      const fullNameMatch = u.fullName && u.fullName.toLowerCase().includes(search);
      const displayNameMatch = u.displayName && u.displayName.toLowerCase().includes(search);
      return usernameMatch || fullNameMatch || displayNameMatch;
    });
  }, [searchUsername, allUsers]);

  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const usernameToSearch = searchUsername.trim().replace(/^@/, "");
    
    if (usernameToSearch.toLowerCase() === user?.username.toLowerCase()) {
      setSearchError("Non puoi inviare denaro a te stesso");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSelectedUser(null);
    setSearchResults([]);

    try {
      // Use partial matching to find users
      const response = await fetch(
        new URL(`/api/users/search/${encodeURIComponent(usernameToSearch)}?partial=true`, getApiUrl()).toString()
      );
      
      if (response.ok) {
        const results = await response.json();
        // Filter out current user
        const filtered = results.filter((u: UserInfo) => u.id !== user?.id);
        if (filtered.length === 0) {
          setSearchError("Nessun utente trovato con questo username");
        } else if (filtered.length === 1) {
          setSelectedUser(filtered[0]);
        } else {
          setSearchResults(filtered);
        }
      } else {
        setSearchError("Errore durante la ricerca");
      }
    } catch (error) {
      setSearchError("Errore di connessione. Riprova.");
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchUsername("");
    setSelectedUser(null);
    setSearchResults([]);
    setSearchError(null);
    setAmount("");
  };
  
  const selectUser = (u: UserInfo) => {
    setSelectedUser(u);
    setSearchResults([]);
    setSearchError(null);
  };

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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cerca destinatario</Text>
          <Pressable 
            style={styles.refreshButton}
            onPress={() => refetchUsers()}
          >
            <Icon name="refresh-cw" size={16} color={BankColors.primary} />
            <Text style={styles.refreshButtonText}>Aggiorna</Text>
          </Pressable>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="at-sign" size={20} color={BankColors.gray500} />
            <TextInput
              style={styles.searchInput}
              value={searchUsername}
              onChangeText={(text) => {
                setSearchUsername(text);
                setSearchError(null);
              }}
              placeholder="Inserisci username"
              placeholderTextColor={BankColors.gray400}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchUsername.length > 0 ? (
              <Pressable onPress={clearSearch} style={styles.clearButton}>
                <Icon name="x" size={18} color={BankColors.gray500} />
              </Pressable>
            ) : null}
          </View>
          <Pressable 
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color={BankColors.white} size="small" />
            ) : (
              <Icon name="search" size={20} color={BankColors.white} />
            )}
          </Pressable>
        </View>

        {searchError ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={20} color={BankColors.error} />
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        ) : null}

        {selectedUser ? (
          <View style={styles.usersList}>
            <View style={styles.foundUserLabel}>
              <Icon name="check-circle" size={16} color={BankColors.primary} />
              <Text style={styles.foundUserText}>Destinatario selezionato</Text>
            </View>
            <Pressable 
              style={[styles.userCard, styles.userCardSelected]}
              onPress={clearSearch}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>@{selectedUser.username}</Text>
                <Text style={styles.userAccount}>
                  {selectedUser.displayName || selectedUser.fullName || selectedUser.accountNumber || "Tocca per cambiare"}
                </Text>
              </View>
              <Icon name="check-circle" size={24} color={BankColors.primary} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.usersList}>
            <View style={styles.foundUserLabel}>
              <Icon name="users" size={16} color={searchUsername ? BankColors.primary : BankColors.gray500} />
              <Text style={[styles.foundUserText, { color: searchUsername ? BankColors.primary : BankColors.gray600 }]}>
                {isLoadingUsers ? "Caricamento..." : 
                  searchUsername ? `${filteredUsers.length} risultati` : 
                  `${allUsers.length} utenti disponibili`}
              </Text>
            </View>
            {filteredUsers.length === 0 && searchUsername ? (
              <View style={styles.noResultsContainer}>
                <Icon name="user-x" size={32} color={BankColors.gray400} />
                <Text style={styles.noResultsText}>Nessun utente trovato</Text>
                <Text style={styles.noResultsHint}>Prova con un altro username</Text>
              </View>
            ) : (
              filteredUsers.map((u) => (
                <Pressable 
                  key={u.id}
                  style={styles.userCard}
                  onPress={() => selectUser(u)}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {u.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>@{u.username}</Text>
                    <Text style={styles.userAccount}>
                      {u.displayName || u.fullName || u.accountNumber || ""}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={BankColors.gray400} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {selectedUser ? (
          <View style={styles.transferForm}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm }]}>Importo da trasferire</Text>
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray700,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshButtonText: {
    fontSize: 13,
    color: BankColors.primary,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: BankColors.gray900,
    paddingVertical: Spacing.md,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  searchButton: {
    backgroundColor: BankColors.primary,
    borderRadius: BorderRadius.md,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: BankColors.error,
    flex: 1,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  hintText: {
    fontSize: 14,
    color: BankColors.gray500,
    flex: 1,
    lineHeight: 20,
  },
  foundUserLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  foundUserText: {
    fontSize: 14,
    color: BankColors.primary,
    fontWeight: "500",
  },
  usersList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
  moreUsersHint: {
    fontSize: 13,
    color: BankColors.gray400,
    textAlign: "center",
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray600,
  },
  noResultsHint: {
    fontSize: 14,
    color: BankColors.gray400,
  },
});
