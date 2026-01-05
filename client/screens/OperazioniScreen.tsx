import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Icon } from "@/components/Icon";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { OperazioniStackParamList } from "@/navigation/MainTabNavigator";

interface OperationItemProps {
  title: string;
  onPress?: () => void;
}

const OperationItem = ({ title, onPress }: OperationItemProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.operationItem,
      pressed && styles.operationItemPressed,
    ]}
    onPress={onPress}
  >
    <Text style={styles.operationItemText}>{title}</Text>
    <Icon name="chevron-right" size={20} color={BankColors.gray400} />
  </Pressable>
);

interface SectionHeaderProps {
  icon?: string;
  iconColor?: string;
  title: string;
}

const SectionHeader = ({ icon, iconColor, title }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    {icon ? (
      <View
        style={[
          styles.sectionIcon,
          iconColor ? { backgroundColor: iconColor } : null,
        ]}
      >
        <Icon name={icon} size={18} color={BankColors.white} />
      </View>
    ) : null}
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

type NavigationProp = NativeStackNavigationProp<OperazioniStackParamList>;

export default function OperazioniScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();

  const handleTransferPress = () => {
    navigation.navigate("Transfer");
  };

  const handleBonificoPress = () => {
    navigation.navigate("Bonifico");
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerAction}>
            <Icon name="search" size={22} color={BankColors.gray700} />
            <Text style={styles.headerActionText}>Cerca</Text>
          </Pressable>
          <Pressable style={styles.headerAction}>
            <Icon name="help-circle" size={22} color={BankColors.gray700} />
            <Text style={styles.headerActionText}>Aiuto</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Text style={styles.pageTitle}>Operazioni</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Operazioni frequenti</Text>
          <View style={styles.card}>
            <OperationItem title="Bonifico" onPress={handleBonificoPress} />
            <OperationItem title="Prelievo cardless" />
            <OperationItem
              title="Scambia denaro"
              onPress={handleTransferPress}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tutte le operazioni</Text>

          <SectionHeader
            icon="send"
            iconColor={BankColors.primary}
            title="Bonifici e giroconti"
          />
          <View style={styles.card}>
            <OperationItem title="Bonifico" onPress={handleBonificoPress} />
            <OperationItem title="Bonifico per agevolazioni fiscali" />
          </View>

          <SectionHeader
            icon="credit-card"
            iconColor="#4CAF50"
            title="BANCOMAT Pay"
          />
          <View style={styles.card}>
            <OperationItem
              title="Scambia denaro"
              onPress={handleTransferPress}
            />
            <OperationItem title="Paga in negozio" />
            <OperationItem title="Addebiti ricorrenti" />
          </View>

          <View style={styles.card}>
            <OperationItem title="Bollettino postale premarcato" />
            <OperationItem title="MAV" />
            <OperationItem title="RAV" />
            <OperationItem title="F24" />
          </View>

          <SectionHeader
            icon="smartphone"
            iconColor="#FF9800"
            title="Ricariche"
          />
          <View style={styles.card}>
            <OperationItem title="Ricarica telefonica" />
            <OperationItem title="Ricarica carta prepagata" />
          </View>

          <SectionHeader
            icon="file-text"
            iconColor="#2196F3"
            title="Pagamenti"
          />
          <View style={styles.card}>
            <OperationItem title="CBILL/pagoPA" />
            <OperationItem title="Bollo auto" />
            <OperationItem title="Pagamento utenze" />
          </View>
        </View>
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
    backgroundColor: BankColors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.lg,
  },
  headerAction: {
    alignItems: "center",
  },
  headerActionText: {
    color: BankColors.gray700,
    fontSize: 11,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: BankColors.gray900,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: BankColors.white,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray700,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BankColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  card: {
    backgroundColor: BankColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  operationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  operationItemPressed: {
    backgroundColor: BankColors.gray100,
  },
  operationItemText: {
    fontSize: 16,
    color: BankColors.gray900,
  },
});
