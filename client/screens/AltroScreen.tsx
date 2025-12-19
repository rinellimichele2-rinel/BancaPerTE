import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Icon } from "@/components/Icon";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/auth-context";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

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
  const { user, logout, updateName } = useAuth();
  const [showEditName, setShowEditName] = useState(false);
  const [newName, setNewName] = useState("");

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
          <MenuItem icon="info" title="Informazioni" />
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
});
