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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [disabledPresets, setDisabledPresets] = useState<string[]>([]);
  const [deletedPresets, setDeletedPresets] = useState<string[]>([]);
  const [customPresets, setCustomPresets] = useState<PresetTransaction[]>([]);
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetTransaction | null>(null);
  const [presetDesc, setPresetDesc] = useState("");
  const [presetMinAmount, setPresetMinAmount] = useState("");
  const [presetMaxAmount, setPresetMaxAmount] = useState("");
  const [presetType, setPresetType] = useState<"expense" | "income">("expense");
  const [presetCategory, setPresetCategory] = useState(TRANSACTION_CATEGORIES[0]);

  useEffect(() => {
    if (!userId) return;
    const loadSettings = async () => {
      try {
        const response = await fetch(new URL(`/api/users/${userId}/preset-settings`, getApiUrl()).toString());
        if (response.ok) {
          const data = await response.json();
          setDeletedPresets(data.deletedPresets || []);
          setDisabledPresets(data.disabledPresets || []);
          setCustomPresets(data.customPresets || []);
        }
      } catch (error) {
        console.error("Error loading preset settings:", error);
      }
    };
    loadSettings();
  }, [userId]);

  const allPresets: PresetTransaction[] = [
    ...DEFAULT_PRESETS.filter(p => !deletedPresets.includes(p.description)),
    ...customPresets.map(p => ({ ...p, isCustom: true }))
  ];

  const savePresetSettings = async (updates: { deletedPresets?: string[]; disabledPresets?: string[]; customPresets?: PresetTransaction[] }) => {
    if (!userId) return;
    try {
      await fetch(new URL(`/api/users/${userId}/preset-settings`, getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Error saving preset settings:", error);
    }
  };

  const deleteDefaultPreset = async (description: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newList = [...deletedPresets, description];
    setDeletedPresets(newList);
    await savePresetSettings({ deletedPresets: newList });
  };

  const togglePresetDisabled = async (description: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newList = disabledPresets.includes(description)
      ? disabledPresets.filter((d) => d !== description)
      : [...disabledPresets, description];
    setDisabledPresets(newList);
    await savePresetSettings({ disabledPresets: newList });
  };

  const confirmDeletePreset = (description: string, isCustom?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isDisabled = disabledPresets.includes(description);
    
    if (isCustom) {
      Alert.alert(
        "Gestisci Preset",
        `Cosa vuoi fare con "${description}"?`,
        [
          { text: "Annulla", style: "cancel" },
          { text: "Modifica", onPress: () => openEditPreset(description) },
          { text: "Elimina", style: "destructive", onPress: () => deleteCustomPreset(description) },
        ]
      );
    } else {
      Alert.alert(
        "Gestisci Preset",
        `Cosa vuoi fare con "${description}"?`,
        [
          { text: "Annulla", style: "cancel" },
          { text: isDisabled ? "Riabilita" : "Disabilita", onPress: () => togglePresetDisabled(description) },
          { text: "Elimina", style: "destructive", onPress: () => deleteDefaultPreset(description) },
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

  const openEditPreset = (description: string) => {
    const preset = customPresets.find(p => p.description === description);
    if (preset) {
      setEditingPreset(preset);
      setPresetDesc(preset.description);
      setPresetMinAmount(preset.minAmount.toString());
      setPresetMaxAmount(preset.maxAmount.toString());
      setPresetType(preset.type);
      setPresetCategory(preset.category);
      setShowPresetEditor(true);
    }
  };

  const savePreset = async () => {
    if (!presetDesc.trim() || !presetMinAmount.trim() || !presetMaxAmount.trim()) return;
    const min = parseInt(presetMinAmount);
    const max = parseInt(presetMaxAmount);
    if (isNaN(min) || isNaN(max) || min <= 0 || max < min) return;

    const newPreset: PresetTransaction = {
      description: presetDesc.trim(),
      type: presetType,
      category: presetCategory,
      minAmount: min,
      maxAmount: max,
      isCustom: true,
    };

    let newList: PresetTransaction[];
    if (editingPreset) {
      newList = customPresets.map(p => p.description === editingPreset.description ? newPreset : p);
    } else {
      newList = [...customPresets, newPreset];
    }

    setCustomPresets(newList);
    await savePresetSettings({ customPresets: newList });
    setShowPresetEditor(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteCustomPreset = async (description: string) => {
    const newList = customPresets.filter(p => p.description !== description);
    setCustomPresets(newList);
    await savePresetSettings({ customPresets: newList });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            <Text style={styles.profileBank}>Intesa Sanpaolo</Text>
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
                  {parseFloat(user?.purchasedBalance || "0").toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={styles.certRow}>
                <Icon name="trending-up" size={18} color={BankColors.cardBlue} />
                <Text style={styles.certLabel}>Margine di recupero:</Text>
                <Text style={[styles.certValue, styles.certValueRecovery]}>
                  {(() => {
                    const currentBalance = parseFloat(user?.balance || "0");
                    const purchasedBalance = parseFloat(user?.purchasedBalance || "0");
                    const recovery = Math.max(0, Math.floor(purchasedBalance - currentBalance));
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
                  />

                  <Text style={styles.formLabel}>Importo (EUR) - Max: {(() => {
                    const currentBalance = parseFloat(user?.balance || "0");
                    const purchasedBalance = parseFloat(user?.purchasedBalance || "0");
                    const recovery = Math.max(0, Math.floor(purchasedBalance - currentBalance));
                    return recovery.toLocaleString('it-IT');
                  })()}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={txAmount}
                    onChangeText={(text) => {
                      const currentBalance = parseFloat(user?.balance || "0");
                      const purchasedBalance = parseFloat(user?.purchasedBalance || "0");
                      const maxRecovery = Math.max(0, Math.floor(purchasedBalance - currentBalance));
                      const numValue = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      if (!isNaN(numValue) && numValue > maxRecovery) {
                        setTxAmount(maxRecovery.toString());
                      } else {
                        setTxAmount(text.replace(/[^0-9]/g, ''));
                      }
                    }}
                    placeholder="Es: 100"
                    keyboardType="numeric"
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
                      const purchasedBalance = parseFloat(user?.purchasedBalance || "0");
                      return purchasedBalance <= currentBalance ? styles.submitBtnDisabled : {};
                    })()]}
                    onPress={handleAddTransaction}
                    disabled={createTransactionMutation.isPending || (() => {
                      const currentBalance = parseFloat(user?.balance || "0");
                      const purchasedBalance = parseFloat(user?.purchasedBalance || "0");
                      return purchasedBalance <= currentBalance;
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
                    const purchasedBalance = parseFloat(user?.purchasedBalance || "0");
                    if (purchasedBalance <= currentBalance) {
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
                    <Text style={styles.randomSectionSubtitle}>Simula uscite quotidiane come Conad, Amazon, benzina...</Text>
                    <Pressable 
                      style={[styles.randomBtn, generateRandomMutation.isPending && styles.submitBtnDisabled]}
                      onPress={() => generateRandomMutation.mutate()}
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
                    <View>
                      <Text style={styles.presetTitle}>Preset uscite disponibili:</Text>
                      <Text style={styles.presetSubtitle}>Tieni premuto per eliminare o disabilitare</Text>
                    </View>
                    <Pressable style={styles.addPresetBtn} onPress={openCreatePreset}>
                      <Icon name="plus" size={18} color={BankColors.white} />
                      <Text style={styles.addPresetBtnText}>Nuovo</Text>
                    </Pressable>
                  </View>
                  {allPresets.filter(p => p.type === "expense").map((preset, index) => {
                    const isDisabled = disabledPresets.includes(preset.description);
                    const isCustom = preset.isCustom;
                    return (
                      <Pressable 
                        key={index}
                        style={[
                          styles.presetItem, 
                          isDisabled && styles.presetItemDisabled,
                          isCustom && styles.presetItemCustom
                        ]}
                        onPress={() => handlePresetTransaction(preset)}
                        onLongPress={() => confirmDeletePreset(preset.description, isCustom)}
                      >
                        <View style={styles.presetInfo}>
                          <View style={styles.presetDescRow}>
                            <Text style={[styles.presetDesc, isDisabled && styles.presetDescDisabled]}>{preset.description}</Text>
                            {isCustom ? <Text style={styles.customBadge}>Personalizzato</Text> : null}
                          </View>
                          <Text style={[styles.presetType, styles.presetTypeExpense]}>
                            Uscita - {preset.category}
                          </Text>
                          <Text style={styles.presetRange}>
                            Importo: {preset.minAmount} - {preset.maxAmount} EUR
                          </Text>
                          {isDisabled ? (
                            <Text style={styles.presetDisabledBadge}>Escluso da random</Text>
                          ) : null}
                        </View>
                        {isCustom ? (
                          <Pressable onPress={() => openEditPreset(preset.description)}>
                            <Icon name="edit-2" size={20} color={BankColors.cardBlue} />
                          </Pressable>
                        ) : (
                          <Icon name="minus-circle" size={24} color={BankColors.error} />
                        )}
                      </Pressable>
                    );
                  })}
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
                />
                <Text style={styles.formLabel}>Importo Minimo (EUR)</Text>
                <TextInput
                  style={styles.formInput}
                  value={presetMinAmount}
                  onChangeText={setPresetMinAmount}
                  placeholder="Es: 10"
                  keyboardType="numeric"
                />
                <Text style={styles.formLabel}>Importo Massimo (EUR)</Text>
                <TextInput
                  style={styles.formInput}
                  value={presetMaxAmount}
                  onChangeText={setPresetMaxAmount}
                  placeholder="Es: 100"
                  keyboardType="numeric"
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
  randomBtnText: {
    color: BankColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  presetList: {
    padding: Spacing.lg,
  },
  presetTitle: {
    fontSize: 14,
    color: BankColors.gray600,
    marginBottom: Spacing.xs,
  },
  presetSubtitle: {
    fontSize: 12,
    color: BankColors.gray400,
    fontStyle: "italic",
  },
  presetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  addPresetBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
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
