import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Icon } from "@/components/Icon";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { DEFAULT_PRESETS, TRANSACTION_CATEGORIES, type PresetTransaction } from "@shared/presets";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DbCustomPreset {
  id: number;
  userId: string;
  description: string;
  type: string;
  category: string;
  minAmount: number;
  maxAmount: number;
  isEnabled: boolean;
  createdAt: string;
}

interface MenuItemProps {
  icon: string;
  title: string;
  badge?: number;
  onPress?: () => void;
}

const MenuItem = ({ icon, title, badge, onPress }: MenuItemProps) => (
  <Pressable 
    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    onPress={onPress}
  >
    <View style={styles.menuItemLeft}>
      <Icon name={icon} size={22} color={BankColors.gray700} />
      <Text style={styles.menuItemText}>{title}</Text>
    </View>
    <View style={styles.menuItemRight}>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Icon name="chevron-right" size={20} color={BankColors.gray400} />
    </View>
  </Pressable>
);

interface TopActionProps {
  icon: string;
  label: string;
  badge?: number;
}

const TopAction = ({ icon, label, badge }: TopActionProps) => (
  <Pressable style={styles.topAction}>
    <View style={styles.topActionIconContainer}>
      <Icon name={icon} size={24} color={BankColors.gray700} />
      {badge ? (
        <View style={styles.topActionBadge}>
          <Text style={styles.topActionBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.topActionLabel}>{label}</Text>
  </Pressable>
);

export default function AltroScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { user, userId, logout, updateName, refreshUser } = useAuth();
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showConsole, setShowConsole] = useState(false);
  const [consoleTab, setConsoleTab] = useState<"form" | "preset">("form");
  const [txDescription, setTxDescription] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("income");
  const [txCategory, setTxCategory] = useState(TRANSACTION_CATEGORIES[0]);
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingPreset, setEditingPreset] = useState<DbCustomPreset | null>(null);
  const [presetDesc, setPresetDesc] = useState("");
  const [presetMinAmount, setPresetMinAmount] = useState("");
  const [presetMaxAmount, setPresetMaxAmount] = useState("");
  const [presetType, setPresetType] = useState<"expense" | "income">("expense");
  const [presetCategory, setPresetCategory] = useState(TRANSACTION_CATEGORIES[0]);

  // Fetch custom presets from database
  const { data: customPresets = [], refetch: refetchPresets } = useQuery<DbCustomPreset[]>({
    queryKey: [`/api/users/${userId}/custom-presets`],
    enabled: !!userId,
  });

  // Create preset mutation
  const createPresetMutation = useMutation({
    mutationFn: async (data: { description: string; type: string; category: string; minAmount: number; maxAmount: number }) => {
      const response = await apiRequest("POST", `/api/users/${userId}/custom-presets`, data);
      return response.json();
    },
    onSuccess: () => {
      refetchPresets();
      setShowPresetEditor(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Update preset mutation
  const updatePresetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DbCustomPreset> }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}/custom-presets/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      refetchPresets();
      setShowPresetEditor(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Delete preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}/custom-presets/${id}`);
      return response.json();
    },
    onSuccess: () => {
      refetchPresets();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Trigger preset transaction mutation
  const triggerPresetMutation = useMutation({
    mutationFn: async (presetId: number) => {
      const response = await apiRequest("POST", `/api/users/${userId}/custom-presets/${presetId}/trigger`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${userId}`] });
      refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.transaction) {
        const amount = Math.abs(parseFloat(data.transaction.amount));
        Alert.alert(
          "Transazione creata",
          `${data.transaction.description}: -${amount.toFixed(0)} EUR`
        );
      }
    },
    onError: (error: any) => {
      Alert.alert("Errore", error.message || "Impossibile eseguire la transazione");
    },
  });

  // Convert database presets to local format for display
  const allPresets: (PresetTransaction & { dbId?: number })[] = [
    ...DEFAULT_PRESETS,
    ...customPresets.map(p => ({
      description: p.description,
      type: p.type as "expense" | "income",
      category: p.category,
      minAmount: p.minAmount,
      maxAmount: p.maxAmount,
      isCustom: true,
      dbId: p.id,
    }))
  ];

  const confirmDeletePreset = (preset: PresetTransaction & { dbId?: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (preset.isCustom && preset.dbId) {
      Alert.alert(
        "Gestisci Preset",
        `Cosa vuoi fare con "${preset.description}"?`,
        [
          { text: "Annulla", style: "cancel" },
          { text: "Modifica", onPress: () => openEditPresetById(preset.dbId!) },
          { text: "Elimina", style: "destructive", onPress: () => deletePresetMutation.mutate(preset.dbId!) },
        ]
      );
    }
  };

  const openCreatePreset = () => {
    setEditingPreset(null);
    setPresetDesc("");
    setPresetMinAmount("");
    setPresetMaxAmount("");
    setPresetType("expense");
    setPresetCategory(TRANSACTION_CATEGORIES[0]);
    setShowPresetEditor(true);
  };

  const openEditPresetById = (id: number) => {
    const preset = customPresets.find(p => p.id === id);
    if (preset) {
      setEditingPreset(preset);
      setPresetDesc(preset.description);
      setPresetMinAmount(preset.minAmount.toString());
      setPresetMaxAmount(preset.maxAmount.toString());
      setPresetType(preset.type as "expense" | "income");
      setPresetCategory(preset.category);
      setShowPresetEditor(true);
    }
  };

  const savePreset = async () => {
    if (!presetDesc.trim() || !presetMinAmount.trim() || !presetMaxAmount.trim()) return;
    const min = parseInt(presetMinAmount);
    const max = parseInt(presetMaxAmount);
    if (isNaN(min) || isNaN(max) || min <= 0 || max < min) return;

    const presetData = {
      description: presetDesc.trim(),
      type: presetType,
      category: presetCategory,
      minAmount: min,
      maxAmount: max,
    };

    if (editingPreset) {
      updatePresetMutation.mutate({ id: editingPreset.id, data: presetData });
    } else {
      createPresetMutation.mutate(presetData);
    }
  };

  const createTransactionMutation = useMutation({
    mutationFn: async (data: { description: string; amount: string; type: string; category: string }) => {
      const response = await apiRequest("POST", "/api/transactions", {
        userId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        isContabilizzato: true,
        date: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", userId] });
      refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.wasCapped) {
        Alert.alert("Saldo riportato al massimo", data.cappedMessage || "L'importo e stato limitato per raggiungere il saldo massimo pagato.");
      }
    },
  });

  const generateRandomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/transactions/${userId}/generate-random`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", userId] });
      refreshUser();
      if (data.transaction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (data.wasCapped) {
          Alert.alert("Saldo riportato al massimo", data.cappedMessage || "L'importo e stato limitato per raggiungere il saldo massimo pagato.");
        }
      } else if (data.message) {
        Alert.alert("Info", data.message);
      }
    },
  });

  const handleAddTransaction = async () => {
    if (!txDescription.trim() || !txAmount.trim()) return;
    const amount = Math.floor(parseFloat(txAmount.replace(",", ".")));
    if (isNaN(amount) || amount <= 0) return;
    
    // Manual form is always income (certification of entries)
    try {
      await createTransactionMutation.mutateAsync({
        description: txDescription.trim(),
        amount: amount.toFixed(0) + ".00",
        type: "income",
        category: txCategory,
      });
      setTxDescription("");
      setTxAmount("");
    } catch (error: any) {
      // Error is already handled by mutation onSuccess for 403
    }
  };

  const handlePresetTransaction = async (preset: PresetTransaction) => {
    const amount = Math.floor(Math.random() * (preset.maxAmount - preset.minAmount) + preset.minAmount);
    
    try {
      await createTransactionMutation.mutateAsync({
        description: preset.description,
        amount: amount.toFixed(0) + ".00",
        type: preset.type,
        category: preset.category,
      });
    } catch (error: any) {
      if (error?.message?.includes("Saldo gia al massimo")) {
        Alert.alert("Saldo al massimo", "Il saldo e gia al massimo pagato. Non puoi aggiungere altre entrate simulate.");
      }
    }
  };

  const handleEditName = () => {
    setNewName(user?.fullName || "");
    setShowEditName(true);
  };

  const handleSaveName = async () => {
    if (newName.trim()) {
      await updateName(newName.trim());
      setShowEditName(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Text style={styles.pageTitle}>Altro</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.topActions}>
          <TopAction icon="bell" label="Avvisi" badge={5} />
          <View style={styles.topActionDivider} />
          <TopAction icon="archive" label="Archivio" badge={3} />
          <View style={styles.topActionDivider} />
          <TopAction icon="shopping-cart" label="Carrello" />
        </View>

        <Pressable style={styles.profileCard} onPress={handleEditName}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>
              {user?.fullName ? getInitials(user.fullName) : "MR"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>Il mio profilo</Text>
            <Text style={styles.profileName}>{user?.fullName || "MICHELE RINELLI"}</Text>
            <Text style={styles.profileBank}>EquisCash</Text>
            {user?.rechargeUsername ? (
              <Text style={styles.profileRechargeUsername}>Username ricarica: @{user.rechargeUsername}</Text>
            ) : null}
          </View>
          <Icon name="chevron-right" size={24} color={BankColors.gray400} />
        </Pressable>

        <View style={styles.menuSection}>
          <MenuItem icon="settings" title="Impostazioni e privacy" onPress={() => setShowSettings(true)} />
          <MenuItem icon="shield" title="Sicurezza" />
          <MenuItem icon="message-circle" title="Parla con noi" onPress={() => Linking.openURL("https://wa.me/393293293177")} />
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="volume-2" title="Ti suggeriamo di..." badge={1} />
          <MenuItem icon="percent" title="Finanziamenti" />
          <MenuItem icon="umbrella" title="Assicurazioni e Previdenza" />
          <MenuItem icon="book" title="Catalogo prodotti" />
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="file-text" title="Documenti" />
          <MenuItem icon="info" title="Informazioni" onPress={() => setShowConsole(true)} />
          <MenuItem icon="help-circle" title="FAQ e Tutorial" />
        </View>

        <Pressable 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="log-out" size={20} color={BankColors.error} />
          <Text style={styles.logoutText}>Esci</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showEditName} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditName(false)} />
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Modifica Nome</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nome Cognome"
              autoCapitalize="words"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowEditName(false)}>
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveName}>
                <Text style={styles.modalSaveText}>Salva</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showConsole} transparent animationType="slide">
        <View style={styles.consoleOverlay}>
          <View style={[styles.consoleContainer, { paddingTop: insets.top }]}>
            <View style={styles.consoleHeader}>
              <Text style={styles.consoleTitle}>Console Transazioni</Text>
              <Pressable style={styles.consoleCloseBtn} onPress={() => setShowConsole(false)}>
                <Icon name="x" size={24} color={BankColors.gray700} />
              </Pressable>
            </View>

            <View style={styles.certificationHeader}>
              <View style={styles.certRow}>
                <Icon name="shield" size={18} color={BankColors.primary} />
                <Text style={styles.certLabel}>Saldo Certificato:</Text>
                <Text style={styles.certValue}>
                  {parseFloat(user?.realPurchasedBalance || "0").toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={styles.certRow}>
                <Icon name="trending-up" size={18} color={BankColors.cardBlue} />
                <Text style={styles.certLabel}>Margine di recupero:</Text>
                <Text style={[styles.certValue, styles.certValueRecovery]}>
                  {(() => {
                    const currentBalance = parseFloat(user?.balance || "0");
                    const certifiedBalance = parseFloat(user?.realPurchasedBalance || "0");
                    const recovery = Math.max(0, Math.floor(certifiedBalance - currentBalance));
                    return `€${recovery.toLocaleString('it-IT')}`;
                  })()}
                </Text>
              </View>
            </View>

            <View style={styles.consoleTabs}>
              <Pressable 
                style={[styles.consoleTab, consoleTab === "form" && styles.consoleTabActive]}
                onPress={() => setConsoleTab("form")}
              >
                <Text style={[styles.consoleTabText, consoleTab === "form" && styles.consoleTabTextActive]}>
                  Certifica Entrata
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.consoleTab, consoleTab === "preset" && styles.consoleTabActive]}
                onPress={() => setConsoleTab("preset")}
              >
                <Text style={[styles.consoleTabText, consoleTab === "preset" && styles.consoleTabTextActive]}>
                  Uscite Random
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.consoleBody} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>
              {consoleTab === "form" ? (
                <View style={styles.consoleForm}>
                  <Text style={styles.incomeFormHint}>
                    Inserisci un'entrata per recuperare il saldo fino al massimo certificato.
                  </Text>
                  
                  <Text style={styles.formLabel}>Descrizione Entrata</Text>
                  <TextInput
                    style={styles.formInput}
                    value={txDescription}
                    onChangeText={setTxDescription}
                    placeholder="Es: Bonifico Affitto, Crypto, Stipendio"
                    placeholderTextColor={BankColors.gray400}
                  />

                  <Text style={styles.formLabel}>Importo (EUR) - Max: {(() => {
                    const currentBalance = parseFloat(user?.balance || "0");
                    const certifiedBalance = parseFloat(user?.realPurchasedBalance || "0");
                    const recovery = Math.max(0, Math.floor(certifiedBalance - currentBalance));
                    return recovery.toLocaleString('it-IT');
                  })()}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={txAmount}
                    onChangeText={(text) => {
                      const currentBalance = parseFloat(user?.balance || "0");
                      const certifiedBalance = parseFloat(user?.realPurchasedBalance || "0");
                      const maxRecovery = Math.max(0, Math.floor(certifiedBalance - currentBalance));
                      const numValue = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      if (!isNaN(numValue) && numValue > maxRecovery) {
                        setTxAmount(maxRecovery.toString());
                      } else {
                        setTxAmount(text.replace(/[^0-9]/g, ''));
                      }
                    }}
                    placeholder="Es: 100"
                    keyboardType="numeric"
                    placeholderTextColor={BankColors.gray400}
                  />

                  <Text style={styles.formLabel}>Categoria</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {TRANSACTION_CATEGORIES.map((cat) => (
                      <Pressable 
                        key={cat}
                        style={[styles.categoryChip, txCategory === cat && styles.categoryChipActive]}
                        onPress={() => setTxCategory(cat)}
                      >
                        <Text style={[styles.categoryChipText, txCategory === cat && styles.categoryChipTextActive]}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Pressable 
                    style={[styles.submitBtn, createTransactionMutation.isPending && styles.submitBtnDisabled, (() => {
                      const currentBalance = parseFloat(user?.balance || "0");
                      const certifiedBalance = parseFloat(user?.realPurchasedBalance || "0");
                      return certifiedBalance <= currentBalance ? styles.submitBtnDisabled : {};
                    })()]}
                    onPress={handleAddTransaction}
                    disabled={createTransactionMutation.isPending || (() => {
                      const currentBalance = parseFloat(user?.balance || "0");
                      const certifiedBalance = parseFloat(user?.realPurchasedBalance || "0");
                      return certifiedBalance <= currentBalance;
                    })()}
                  >
                    {createTransactionMutation.isPending ? (
                      <ActivityIndicator color={BankColors.white} />
                    ) : (
                      <Text style={styles.submitBtnText}>Certifica Entrata</Text>
                    )}
                  </Pressable>
                  
                  {(() => {
                    const currentBalance = parseFloat(user?.balance || "0");
                    const certifiedBalance = parseFloat(user?.realPurchasedBalance || "0");
                    if (certifiedBalance <= currentBalance) {
                      return (
                        <Text style={styles.noRecoveryHint}>
                          Il saldo attuale e gia al massimo certificato. Genera uscite per creare margine di recupero.
                        </Text>
                      );
                    }
                    return null;
                  })()}
                </View>
              ) : (
                <View style={styles.presetList}>
                  <View style={styles.randomSection}>
                    <Text style={styles.randomSectionTitle}>Genera una spesa casuale</Text>
                    <Text style={styles.randomSectionSubtitle}>
                      {allPresets.filter(p => p.type === "expense").length > 0 
                        ? "Simula uscite quotidiane dai preset configurati"
                        : "Crea prima dei preset per generare spese casuali"}
                    </Text>
                    <Pressable 
                      style={[
                        styles.randomBtn, 
                        styles.randomBtnFullWidth,
                        generateRandomMutation.isPending && styles.submitBtnDisabled
                      ]}
                      onPress={() => {
                        if (allPresets.filter(p => p.type === "expense").length === 0) {
                          Alert.alert("Nessun Preset", "Crea prima un preset di uscita per generare spese casuali.");
                          return;
                        }
                        generateRandomMutation.mutate();
                      }}
                      disabled={generateRandomMutation.isPending}
                    >
                      {generateRandomMutation.isPending ? (
                        <ActivityIndicator color={BankColors.white} />
                      ) : (
                        <>
                          <Icon name="shuffle" size={20} color={BankColors.white} />
                          <Text style={styles.randomBtnText}>Genera Uscita Random</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                  
                  <View style={styles.presetDivider} />
                  
                  <View style={styles.presetHeader}>
                    <View style={styles.presetHeaderLeft}>
                      <Text style={styles.presetTitle}>Preset uscite disponibili</Text>
                      <Text style={styles.presetSubtitle}>Tieni premuto per eliminare</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.addPresetBtn} 
                      onPress={openCreatePreset}
                      activeOpacity={0.7}
                    >
                      <Icon name="plus" size={18} color={BankColors.white} />
                      <Text style={styles.addPresetBtnText}>Nuovo</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {allPresets.filter(p => p.type === "expense").length === 0 ? (
                    <View style={styles.emptyPresetState}>
                      <Icon name="inbox" size={40} color={BankColors.gray300} />
                      <Text style={styles.emptyPresetText}>Nessun preset configurato</Text>
                      <Text style={styles.emptyPresetHint}>Premi "Nuovo" per creare il tuo primo preset</Text>
                    </View>
                  ) : null}
                  
                  {allPresets.filter(p => p.type === "expense").map((preset, index) => {
                    const isCustom = preset.isCustom;
                    return (
                      <Pressable 
                        key={preset.dbId || index}
                        style={[
                          styles.presetItem, 
                          isCustom && styles.presetItemCustom
                        ]}
                        onPress={() => {
                          if (isCustom && preset.dbId) {
                            triggerPresetMutation.mutate(preset.dbId);
                          } else {
                            handlePresetTransaction(preset);
                          }
                        }}
                        onLongPress={() => isCustom ? confirmDeletePreset(preset) : null}
                      >
                        <View style={styles.presetInfo}>
                          <View style={styles.presetDescRow}>
                            <Text style={styles.presetDesc}>{preset.description}</Text>
                            {isCustom ? <Text style={styles.customBadge}>Personalizzato</Text> : null}
                          </View>
                          <Text style={[styles.presetType, styles.presetTypeExpense]}>
                            Uscita - {preset.category}
                          </Text>
                          <Text style={styles.presetRange}>
                            Importo: {preset.minAmount} - {preset.maxAmount} EUR
                          </Text>
                        </View>
                        {isCustom && preset.dbId ? (
                          <Pressable onPress={() => openEditPresetById(preset.dbId!)}>
                            <Icon name="edit-2" size={20} color={BankColors.cardBlue} />
                          </Pressable>
                        ) : null}
                      </Pressable>
                    );
                  })}
                  
                  {/* Income Presets Section */}
                  {allPresets.filter(p => p.type === "income").length > 0 ? (
                    <>
                      <View style={styles.presetDivider} />
                      <View style={styles.presetHeader}>
                        <View style={styles.presetHeaderLeft}>
                          <Text style={styles.presetTitle}>Preset entrate (Giustificazione)</Text>
                          <Text style={styles.presetSubtitle}>Recupera il margine con entrate finte</Text>
                        </View>
                      </View>
                      
                      {allPresets.filter(p => p.type === "income").map((preset, index) => {
                        const isCustom = preset.isCustom;
                        return (
                          <Pressable 
                            key={`income-${preset.dbId || index}`}
                            style={[
                              styles.presetItem, 
                              isCustom && styles.presetItemCustom,
                              styles.presetItemIncome
                            ]}
                            onPress={() => {
                              if (isCustom && preset.dbId) {
                                triggerPresetMutation.mutate(preset.dbId);
                              }
                            }}
                            onLongPress={() => isCustom ? confirmDeletePreset(preset) : null}
                          >
                            <View style={styles.presetInfo}>
                              <View style={styles.presetDescRow}>
                                <Text style={styles.presetDesc}>{preset.description}</Text>
                                {isCustom ? <Text style={styles.customBadge}>Personalizzato</Text> : null}
                              </View>
                              <Text style={[styles.presetType, styles.presetTypeIncome]}>
                                Entrata - {preset.category}
                              </Text>
                              <Text style={styles.presetRange}>
                                Importo: {preset.minAmount} - {preset.maxAmount} EUR
                              </Text>
                            </View>
                            {isCustom && preset.dbId ? (
                              <Pressable onPress={() => openEditPresetById(preset.dbId!)}>
                                <Icon name="edit-2" size={20} color={BankColors.cardBlue} />
                              </Pressable>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showPresetEditor} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.consoleContainer}>
            <View style={styles.consoleHeader}>
              <Text style={styles.consoleTitle}>{editingPreset ? "Modifica Preset" : "Nuovo Preset"}</Text>
              <Pressable onPress={() => setShowPresetEditor(false)}>
                <Icon name="x" size={24} color={BankColors.gray700} />
              </Pressable>
            </View>
            <ScrollView style={styles.consoleBody} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>
              <View style={styles.consoleForm}>
                <Text style={styles.formLabel}>Descrizione</Text>
                <TextInput
                  style={styles.formInput}
                  value={presetDesc}
                  onChangeText={setPresetDesc}
                  placeholder="Es: Supermercato Locale"
                  placeholderTextColor={BankColors.gray400}
                />
                <Text style={styles.formLabel}>Importo Minimo (EUR)</Text>
                <TextInput
                  style={styles.formInput}
                  value={presetMinAmount}
                  onChangeText={setPresetMinAmount}
                  placeholder="Es: 10"
                  keyboardType="numeric"
                  placeholderTextColor={BankColors.gray400}
                />
                <Text style={styles.formLabel}>Importo Massimo (EUR)</Text>
                <TextInput
                  style={styles.formInput}
                  value={presetMaxAmount}
                  onChangeText={setPresetMaxAmount}
                  placeholder="Es: 100"
                  keyboardType="numeric"
                  placeholderTextColor={BankColors.gray400}
                />
                <Text style={styles.formLabel}>Tipo</Text>
                <View style={styles.typeSelector}>
                  <Pressable 
                    style={[styles.typeBtn, presetType === "expense" && styles.typeBtnActiveExpense]}
                    onPress={() => setPresetType("expense")}
                  >
                    <Text style={[styles.typeBtnText, presetType === "expense" && styles.typeBtnTextActive]}>Uscita</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.typeBtn, presetType === "income" && styles.typeBtnActiveIncome]}
                    onPress={() => setPresetType("income")}
                  >
                    <Text style={[styles.typeBtnText, presetType === "income" && styles.typeBtnTextActive]}>Entrata</Text>
                  </Pressable>
                </View>
                <Text style={styles.formLabel}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <Pressable 
                      key={cat}
                      style={[styles.categoryChip, presetCategory === cat && styles.categoryChipActive]}
                      onPress={() => setPresetCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, presetCategory === cat && styles.categoryChipTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable style={styles.submitBtn} onPress={savePreset}>
                  <Text style={styles.submitBtnText}>{editingPreset ? "Salva Modifiche" : "Crea Preset"}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSettings} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSettings(false)} />
          <View style={styles.settingsModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Impostazioni e privacy</Text>
              <Pressable onPress={() => setShowSettings(false)}>
                <Icon name="x" size={24} color={BankColors.gray700} />
              </Pressable>
            </View>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Username di ricarica</Text>
              <View style={styles.settingsUsernameBox}>
                <Icon name="at-sign" size={20} color={BankColors.primary} />
                <Text style={styles.settingsUsername}>{user?.rechargeUsername || "Non disponibile"}</Text>
              </View>
              <Text style={styles.settingsHint}>
                Questo username viene usato per le ricariche PayPal. Comunicalo quando effettui un pagamento.
              </Text>
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
    backgroundColor: BankColors.gray100,
  },
  header: {
    backgroundColor: BankColors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: BankColors.gray900,
  },
  scrollView: {
    flex: 1,
  },
  topActions: {
    flexDirection: "row",
    backgroundColor: BankColors.white,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    justifyContent: "center",
    gap: Spacing["3xl"],
  },
  topAction: {
    alignItems: "center",
  },
  topActionIconContainer: {
    position: "relative",
  },
  topActionBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: BankColors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  topActionBadgeText: {
    color: BankColors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  topActionLabel: {
    fontSize: 12,
    color: BankColors.gray700,
    marginTop: Spacing.xs,
  },
  topActionDivider: {
    width: 1,
    backgroundColor: BankColors.gray300,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: BankColors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  profileInitials: {
    color: BankColors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: BankColors.gray500,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  profileBank: {
    fontSize: 12,
    color: BankColors.gray500,
  },
  profileRechargeUsername: {
    fontSize: 11,
    color: BankColors.primary,
    marginTop: 4,
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: BankColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  menuItemPressed: {
    backgroundColor: BankColors.gray100,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: 16,
    color: BankColors.gray900,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: BankColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: BankColors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoutText: {
    fontSize: 16,
    color: BankColors.error,
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
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    width: "85%",
    maxWidth: 400,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: BankColors.gray900,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BankColors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 18,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: BankColors.gray200,
    alignItems: "center",
  },
  modalCancelText: {
    color: BankColors.gray700,
    fontSize: 16,
    fontWeight: "500",
  },
  modalSaveBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: BankColors.primary,
    alignItems: "center",
  },
  modalSaveText: {
    color: BankColors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  consoleOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  consoleContainer: {
    flex: 1,
    backgroundColor: BankColors.white,
    marginTop: 50,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  consoleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  consoleTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  consoleCloseBtn: {
    padding: Spacing.sm,
  },
  consoleTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  consoleTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  consoleTabActive: {
    borderBottomColor: BankColors.primary,
  },
  consoleTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: BankColors.gray500,
  },
  consoleTabTextActive: {
    color: BankColors.primary,
  },
  certificationHeader: {
    backgroundColor: BankColors.primary + "10",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.primary + "20",
  },
  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  certLabel: {
    fontSize: 14,
    color: BankColors.gray600,
    fontWeight: "500",
  },
  certValue: {
    fontSize: 16,
    color: BankColors.primary,
    fontWeight: "700",
    marginLeft: "auto",
  },
  certValueRecovery: {
    color: BankColors.cardBlue,
  },
  incomeFormHint: {
    fontSize: 14,
    color: BankColors.gray600,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  noRecoveryHint: {
    fontSize: 13,
    color: BankColors.error,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
  randomSection: {
    padding: Spacing.lg,
    alignItems: "center",
    backgroundColor: BankColors.error + "08",
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  randomSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray900,
    marginBottom: Spacing.xs,
  },
  randomSectionSubtitle: {
    fontSize: 13,
    color: BankColors.gray500,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  presetDivider: {
    height: 1,
    backgroundColor: BankColors.gray200,
    marginVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  recoveryBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.cardBlue + "15",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.cardBlue + "30",
  },
  recoveryBarText: {
    fontSize: 13,
    color: BankColors.cardBlue,
    fontWeight: "500",
  },
  consoleBody: {
    flex: 1,
  },
  consoleForm: {
    padding: Spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BankColors.gray700,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  formInput: {
    borderWidth: 1,
    borderColor: BankColors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    backgroundColor: BankColors.gray50,
    color: BankColors.gray900,
  },
  typeSelector: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankColors.gray300,
  },
  typeBtnActiveExpense: {
    backgroundColor: BankColors.error,
    borderColor: BankColors.error,
  },
  typeBtnActiveIncome: {
    backgroundColor: BankColors.primary,
    borderColor: BankColors.primary,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: BankColors.gray700,
  },
  typeBtnTextActive: {
    color: BankColors.white,
  },
  categoryScroll: {
    marginBottom: Spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: BankColors.gray300,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: BankColors.primary,
    borderColor: BankColors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    color: BankColors.gray700,
  },
  categoryChipTextActive: {
    color: BankColors.white,
  },
  submitBtn: {
    backgroundColor: BankColors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: BankColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: BankColors.gray200,
    marginVertical: Spacing.xl,
  },
  randomBtn: {
    backgroundColor: "#FF9800",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  randomBtnFullWidth: {
    width: "100%",
  },
  randomBtnText: {
    color: BankColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  presetList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  presetTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: BankColors.gray800,
    marginBottom: Spacing.xs,
  },
  presetSubtitle: {
    fontSize: 12,
    color: BankColors.gray500,
  },
  presetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  presetHeaderLeft: {
    flex: 1,
  },
  emptyPresetState: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    backgroundColor: BankColors.gray50,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.sm,
  },
  emptyPresetText: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray600,
    marginTop: Spacing.md,
  },
  emptyPresetHint: {
    fontSize: 13,
    color: BankColors.gray400,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  addPresetBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
    zIndex: 10,
    cursor: "pointer",
  } as any,
  addPresetBtnText: {
    color: BankColors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BankColors.gray200,
  },
  presetItemDisabled: {
    opacity: 0.6,
    backgroundColor: BankColors.gray100,
  },
  presetItemCustom: {
    borderColor: BankColors.cardBlue,
    borderWidth: 1.5,
  },
  presetItemIncome: {
    borderLeftColor: BankColors.primary,
    borderLeftWidth: 4,
  },
  presetDescRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  presetDescDisabled: {
    textDecorationLine: "line-through",
  },
  customBadge: {
    fontSize: 10,
    color: BankColors.white,
    backgroundColor: BankColors.cardBlue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "600",
  },
  presetDisabledBadge: {
    fontSize: 11,
    color: BankColors.error,
    marginTop: 4,
    fontWeight: "600",
  },
  presetItemPressed: {
    backgroundColor: BankColors.gray100,
  },
  swipeDeleteBtn: {
    backgroundColor: BankColors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  swipeDeleteText: {
    color: BankColors.white,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  presetInfo: {
    flex: 1,
  },
  presetDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: BankColors.gray900,
    marginBottom: 4,
  },
  presetType: {
    fontSize: 12,
    marginBottom: 2,
  },
  presetTypeIncome: {
    color: BankColors.primary,
  },
  presetTypeExpense: {
    color: BankColors.error,
  },
  presetRange: {
    fontSize: 12,
    color: BankColors.gray500,
  },
  settingsModalContent: {
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    width: "90%",
    maxWidth: 400,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BankColors.gray900,
  },
  settingsSection: {
    marginBottom: Spacing.lg,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: BankColors.gray700,
    marginBottom: Spacing.sm,
  },
  settingsUsernameBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.gray100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  settingsUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.primary,
  },
  settingsHint: {
    fontSize: 12,
    color: BankColors.gray500,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
});
