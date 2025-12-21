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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";

const QuickActionButton = ({ 
  icon, 
  label, 
}: { 
  icon: string; 
  label: string; 
}) => (
  <Pressable style={({ pressed }) => [styles.quickActionBtn, pressed && styles.quickActionPressed]}>
    <Icon name={icon} size={18} color={BankColors.white} />
    <Text style={styles.quickActionLabel}>{label}</Text>
  </Pressable>
);

const MonthlyExpenseItem = ({ month, amount }: { month: string; amount: string }) => (
  <Pressable style={styles.monthlyItem}>
    <View style={styles.monthlyLeft}>
      <View style={styles.monthlyIcon}>
        <Icon name="arrow-down" size={18} color={BankColors.error} />
      </View>
      <Text style={styles.monthlyMonth}>{month}</Text>
    </View>
    <View style={styles.monthlyRight}>
      <Text style={styles.monthlyAmount}>{amount}</Text>
      <Icon name="chevron-right" size={20} color={BankColors.gray400} />
    </View>
  </Pressable>
);

const TransactionItem = ({ date, description, category, amount }: { 
  date: string; 
  description: string; 
  category: string; 
  amount: string;
}) => (
  <Pressable style={styles.transactionItem}>
    <View style={styles.transactionInfo}>
      <Text style={styles.transactionDate}>{date}</Text>
      <Text style={styles.transactionDesc}>{description}</Text>
      <Text style={styles.transactionCategory}>{category}</Text>
    </View>
    <View style={styles.transactionRight}>
      <Text style={styles.transactionAmount}>{amount}</Text>
      <Icon name="chevron-right" size={20} color={BankColors.gray400} />
    </View>
  </Pressable>
);

export default function CarteScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, updateName } = useAuth();
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <LinearGradient
          colors={[BankColors.primaryLight, BankColors.primary, BankColors.primaryDark]}
          style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
        >
          <View style={styles.headerTop}>
            <View />
            <View style={styles.headerActions}>
              <Pressable style={styles.headerAction}>
                <Icon name="search" size={22} color={BankColors.white} />
                <Text style={styles.headerActionText}>Cerca</Text>
              </Pressable>
              <Pressable style={styles.headerAction}>
                <Icon name="help-circle" size={22} color={BankColors.white} />
                <Text style={styles.headerActionText}>Aiuto</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.pageTitle}>Carte</Text>

          <View style={styles.cardSelector}>
            <Pressable style={styles.cardSelectorBtn}>
              <Text style={styles.cardSelectorText}>Carta di debito - **** {user?.cardLastFour || "3796"}</Text>
            </Pressable>
            <Pressable style={styles.cardSelectorBtn}>
              <Text style={styles.cardSelectorText}>Richiedi nuova</Text>
            </Pressable>
          </View>

          <View style={styles.cardDisplay}>
            <View style={styles.cardVisual}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardBankName}>EQUISCASH</Text>
                <Text style={styles.cardType}>XME Card Plus</Text>
              </View>
              <View style={styles.cardChip}>
                <Icon name="cpu" size={24} color={BankColors.gray600} />
                <Text style={styles.cardContactless}>)))</Text>
              </View>
              <View style={styles.cardBottom}>
                <Pressable onPress={handleEditName}>
                  <Text style={styles.cardLabel}>DEBIT</Text>
                  <Text style={styles.cardHolderName}>{user?.fullName || "COGNOME NOME"}</Text>
                  <View style={styles.cardActiveTag}>
                    <Text style={styles.cardActiveText}>ATTIVATA</Text>
                  </View>
                </Pressable>
                <View style={styles.cardLogos}>
                  <View style={styles.pagoBancomatLogo}>
                    <Text style={styles.pagoBancomatText}>PAGO{"\n"}BANCOMAT</Text>
                  </View>
                  <View style={styles.mastercardLogo}>
                    <View style={[styles.mcCircle, { backgroundColor: "#EB001B" }]} />
                    <View style={[styles.mcCircle, { backgroundColor: "#F79E1B", marginLeft: -8 }]} />
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.cardDescription}>Carta digitale e fisica</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
            contentContainerStyle={styles.quickActionsContainer}
          >
            <QuickActionButton icon="settings" label="Pagamenti digitali" />
            <QuickActionButton icon="credit-card" label="Carte virtuali" />
            <QuickActionButton icon="list" label="Dettagli carta" />
          </ScrollView>
        </LinearGradient>

        <View style={styles.disponibilitaSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Disponibilita</Text>
            <Pressable style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>Dettagli</Text>
              <Icon name="chevron-right" size={16} color={BankColors.primary} />
            </Pressable>
          </View>

          <View style={styles.disponibilitaCard}>
            <Text style={styles.disponibilitaLabel}>Disponibilita pagamenti di questo mese</Text>
            <Text style={styles.disponibilitaAmount}>3.771,69 {"\u20AC"} su 5.000,00 {"\u20AC"}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "75%" }]} />
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Limite giornaliero</Text>
              <Text style={styles.limitAmount}>2.500,00 {"\u20AC"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.usciteSection}>
          <Text style={styles.sectionTitle}>Uscite</Text>
          <View style={styles.usciteCard}>
            <MonthlyExpenseItem month="Dicembre" amount="- 1.563,58 €" />
            <MonthlyExpenseItem month="Novembre" amount="- 1.523,90 €" />
          </View>
        </View>

        <View style={styles.movimentiSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimenti</Text>
            <Pressable style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>Visualizza tutti</Text>
              <Icon name="chevron-right" size={16} color={BankColors.primary} />
            </Pressable>
          </View>

          <TransactionItem 
            date="18.12.2025" 
            description="AL SOLITO POSTO" 
            category="ALTRE" 
            amount="- 5,00 €" 
          />
          <TransactionItem 
            date="18.12.2025" 
            description="DOK" 
            category="ALTRE" 
            amount="- 16,06 €" 
          />
          <TransactionItem 
            date="18.12.2025" 
            description="AL SOLITO POSTO" 
            category="ALTRE" 
            amount="- 4,10 €" 
          />
        </View>
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
  pageTitle: {
    color: BankColors.white,
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  cardSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cardSelectorBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  cardSelectorText: {
    color: BankColors.white,
    fontSize: 13,
    fontWeight: "500",
  },
  cardDisplay: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cardVisual: {
    width: "90%",
    aspectRatio: 1.6,
    backgroundColor: "#E3F2FD",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardBankName: {
    fontSize: 12,
    fontWeight: "600",
    color: BankColors.primary,
    letterSpacing: 1,
  },
  cardType: {
    fontSize: 12,
    color: BankColors.primary,
  },
  cardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardContactless: {
    fontSize: 20,
    color: BankColors.gray600,
    transform: [{ rotate: "90deg" }],
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardLabel: {
    fontSize: 10,
    color: BankColors.gray600,
  },
  cardHolderName: {
    fontSize: 12,
    fontWeight: "600",
    color: BankColors.gray800,
  },
  cardActiveTag: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  cardActiveText: {
    color: BankColors.white,
    fontSize: 10,
    fontWeight: "600",
  },
  cardLogos: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  pagoBancomatLogo: {
    backgroundColor: "#0066B3",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pagoBancomatText: {
    color: BankColors.white,
    fontSize: 8,
    fontWeight: "600",
    textAlign: "center",
  },
  mastercardLogo: {
    flexDirection: "row",
  },
  mcCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  cardDescription: {
    color: BankColors.white,
    fontSize: 14,
    marginTop: Spacing.sm,
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
  disponibilitaSection: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
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
  disponibilitaCard: {
    backgroundColor: BankColors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  disponibilitaLabel: {
    fontSize: 14,
    color: BankColors.gray600,
    marginBottom: Spacing.xs,
  },
  disponibilitaAmount: {
    fontSize: 20,
    fontWeight: "600",
    color: BankColors.gray900,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: BankColors.gray300,
    borderRadius: 4,
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2196F3",
    borderRadius: 4,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  limitLabel: {
    fontSize: 14,
    color: BankColors.gray600,
  },
  limitAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  usciteSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  usciteCard: {
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankColors.gray200,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  monthlyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  monthlyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  monthlyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankColors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  monthlyMonth: {
    fontSize: 16,
    fontWeight: "500",
    color: BankColors.gray900,
  },
  monthlyRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  monthlyAmount: {
    fontSize: 16,
    fontWeight: "500",
    color: BankColors.gray900,
  },
  movimentiSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: BankColors.gray500,
  },
  transactionDesc: {
    fontSize: 15,
    fontWeight: "500",
    color: BankColors.gray900,
  },
  transactionCategory: {
    fontSize: 12,
    color: BankColors.gray500,
  },
  transactionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "500",
    color: BankColors.error,
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
