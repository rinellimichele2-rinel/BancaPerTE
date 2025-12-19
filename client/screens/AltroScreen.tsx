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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Icon } from "@/components/Icon";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const DISABLED_PRESETS_KEY = "disabled_presets";
const CUSTOM_PRESETS_KEY = "custom_presets";

type PresetTransaction = {
  description: string;
  type: "expense" | "income";
  category: string;
  minAmount: number;
  maxAmount: number;
  isCustom?: boolean;
};

const TRANSACTION_CATEGORIES = [
  "Spesa e supermercati",
  "Ristorazione e bar",
  "Trasporti",
  "Casa",
  "Prelievi",
  "Bonifici ricevuti",
  "Altre uscite",
  "Salute e benessere",
  "Tempo libero",
];

const PRESET_TRANSACTIONS: PresetTransaction[] = [
  { description: "Bonifico Disposto Da CAMMAROTA DONATO C. S.N.C.", type: "income", category: "Bonifici ricevuti", minAmount: 300, maxAmount: 600 },
  { description: "Bonifico Disposto Da INPS", type: "income", category: "Bonifici ricevuti", minAmount: 300, maxAmount: 800 },
  { description: "Bonifico Istantaneo Disposto Da LAURENZIELLO GIOVINA", type: "income", category: "Bonifici ricevuti", minAmount: 50, maxAmount: 200 },
  { description: "Conad Superstore", type: "expense", category: "Spesa e supermercati", minAmount: 30, maxAmount: 150 },
  { description: "Lidl", type: "expense", category: "Spesa e supermercati", minAmount: 20, maxAmount: 100 },
  { description: "Prelievo Sportello Banca Del Gruppo", type: "expense", category: "Prelievi", minAmount: 50, maxAmount: 500 },
  { description: "Metro' Pizzeria Via Roma 14", type: "expense", category: "Ristorazione e bar", minAmount: 10, maxAmount: 40 },
];

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
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txCategory, setTxCategory] = useState(TRANSACTION_CATEGORIES[0]);
  const [disabledPresets, setDisabledPresets] = useState<string[]>([]);
  const [customPresets, setCustomPresets] = useState<PresetTransaction[]>([]);
  const [showPresetEditor, setShowPresetEditor] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetTransaction | null>(null);
  const [presetDesc, setPresetDesc] = useState("");
  const [presetMinAmount, setPresetMinAmount] = useState("");
  const [presetMaxAmount, setPresetMaxAmount] = useState("");
  const [presetType, setPresetType] = useState<"expense" | "income">("expense");
  const [presetCategory, setPresetCategory] = useState(TRANSACTION_CATEGORIES[0]);

  useEffect(() => {
    AsyncStorage.getItem(DISABLED_PRESETS_KEY).then((data) => {
      if (data) setDisabledPresets(JSON.parse(data));
    });
    AsyncStorage.getItem(CUSTOM_PRESETS_KEY).then((data) => {
      if (data) setCustomPresets(JSON.parse(data));
    });
  }, []);

  const allPresets: PresetTransaction[] = [...PRESET_TRANSACTIONS, ...customPresets.map(p => ({ ...p, isCustom: true }))];

  const togglePresetDisabled = async (description: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newList = disabledPresets.includes(description)
      ? disabledPresets.filter((d) => d !== description)
      : [...disabledPresets, description];
    setDisabledPresets(newList);
    await AsyncStorage.setItem(DISABLED_PRESETS_KEY, JSON.stringify(newList));
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
          { text: "Elimina", style: "destructive", onPress: () => togglePresetDisabled(description) },
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
    await AsyncStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(newList));
    setShowPresetEditor(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteCustomPreset = async (description: string) => {
    const newList = customPresets.filter(p => p.description !== description);
    setCustomPresets(newList);
    await AsyncStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(newList));
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", userId] });
      refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const generateRandomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/transactions/${userId}/generate-random`, {
        excludeDescriptions: disabledPresets,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", userId] });
      refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleAddTransaction = async () => {
    if (!txDescription.trim() || !txAmount.trim()) return;
    const amount = Math.round(parseFloat(txAmount.replace(",", ".")));
    if (isNaN(amount) || amount <= 0) return;
    
    await createTransactionMutation.mutateAsync({
      description: txDescription.trim(),
      amount: amount.toFixed(0) + ".00",
      type: txType,
      category: txCategory,
    });
    
    setTxDescription("");
    setTxAmount("");
  };

  const handlePresetTransaction = async (preset: typeof PRESET_TRANSACTIONS[0]) => {
    const amount = Math.round(Math.random() * (preset.maxAmount - preset.minAmount) + preset.minAmount);
    await createTransactionMutation.mutateAsync({
      description: preset.description,
      amount: amount.toFixed(0) + ".00",
      type: preset.type,
      category: preset.category,
    });
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
          </View>
          <Icon name="chevron-right" size={24} color={BankColors.gray400} />
        </Pressable>

        <View style={styles.menuSection}>
          <MenuItem icon="settings" title="Impostazioni e privacy" />
          <MenuItem icon="shield" title="Sicurezza" />
          <MenuItem icon="message-circle" title="Parla con noi" />
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

            <View style={styles.consoleTabs}>
              <Pressable 
                style={[styles.consoleTab, consoleTab === "form" && styles.consoleTabActive]}
                onPress={() => setConsoleTab("form")}
              >
                <Text style={[styles.consoleTabText, consoleTab === "form" && styles.consoleTabTextActive]}>
                  Modulo Manuale
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.consoleTab, consoleTab === "preset" && styles.consoleTabActive]}
                onPress={() => setConsoleTab("preset")}
              >
                <Text style={[styles.consoleTabText, consoleTab === "preset" && styles.consoleTabTextActive]}>
                  Preset Rapidi
                </Text>
              </Pressable>
            </View>

            <ScrollView style={styles.consoleBody} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}>
              {consoleTab === "form" ? (
                <View style={styles.consoleForm}>
                  <Text style={styles.formLabel}>Descrizione</Text>
                  <TextInput
                    style={styles.formInput}
                    value={txDescription}
                    onChangeText={setTxDescription}
                    placeholder="Es: Bonifico da Mario Rossi"
                  />

                  <Text style={styles.formLabel}>Importo (EUR)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={txAmount}
                    onChangeText={setTxAmount}
                    placeholder="Es: 100"
                    keyboardType="numeric"
                  />

                  <Text style={styles.formLabel}>Tipo</Text>
                  <View style={styles.typeSelector}>
                    <Pressable 
                      style={[styles.typeBtn, txType === "expense" && styles.typeBtnActiveExpense]}
                      onPress={() => setTxType("expense")}
                    >
                      <Text style={[styles.typeBtnText, txType === "expense" && styles.typeBtnTextActive]}>Uscita</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.typeBtn, txType === "income" && styles.typeBtnActiveIncome]}
                      onPress={() => setTxType("income")}
                    >
                      <Text style={[styles.typeBtnText, txType === "income" && styles.typeBtnTextActive]}>Entrata</Text>
                    </Pressable>
                  </View>

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
                    style={[styles.submitBtn, createTransactionMutation.isPending && styles.submitBtnDisabled]}
                    onPress={handleAddTransaction}
                    disabled={createTransactionMutation.isPending}
                  >
                    {createTransactionMutation.isPending ? (
                      <ActivityIndicator color={BankColors.white} />
                    ) : (
                      <Text style={styles.submitBtnText}>Aggiungi Transazione</Text>
                    )}
                  </Pressable>

                  <View style={styles.divider} />

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
                        <Text style={styles.randomBtnText}>Genera Transazione Random</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={styles.presetList}>
                  <View style={styles.presetHeader}>
                    <View>
                      <Text style={styles.presetTitle}>Seleziona un preset per aggiungere una transazione:</Text>
                      <Text style={styles.presetSubtitle}>Tieni premuto per eliminare o disabilitare</Text>
                    </View>
                    <Pressable style={styles.addPresetBtn} onPress={openCreatePreset}>
                      <Icon name="plus" size={18} color={BankColors.white} />
                      <Text style={styles.addPresetBtnText}>Nuovo</Text>
                    </Pressable>
                  </View>
                  {allPresets.map((preset, index) => {
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
                          <Text style={[styles.presetType, preset.type === "income" ? styles.presetTypeIncome : styles.presetTypeExpense]}>
                            {preset.type === "income" ? "Entrata" : "Uscita"} - {preset.category}
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
                          <Icon name="plus-circle" size={24} color={BankColors.primary} />
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
});
