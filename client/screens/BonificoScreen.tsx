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
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/Icon";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";

const COMMISSION_FEE = 1.0;

export default function BonificoScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [destinatario, setDestinatario] = useState("");
  const [iban, setIban] = useState("");
  const [importo, setImporto] = useState("");
  const [causale, setCausale] = useState("");
  const [bonificoIstantaneo, setBonificoIstantaneo] = useState(false);
  const [operazioneRicorrente, setOperazioneRicorrente] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const activeBalance = parseFloat(user?.balance || "0");
  const accountNumber = user?.accountNumber || "N/A";
  const fullName = user?.fullName || "Utente";

  const formatItalianNumber = (num: number) => {
    return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseItalianNumber = (str: string): number => {
    const normalized = str.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized) || 0;
  };

  const validateStep1 = () => {
    if (!destinatario.trim()) {
      Alert.alert("Errore", "Inserisci il nome del destinatario");
      return false;
    }
    if (destinatario.length < 3 || destinatario.length > 70) {
      Alert.alert("Errore", "Il destinatario deve avere tra 3 e 70 caratteri");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!iban.trim()) {
      Alert.alert("Errore", "Inserisci l'IBAN del beneficiario");
      return false;
    }
    const ibanClean = iban.replace(/\s/g, "").toUpperCase();
    if (ibanClean.length < 15 || ibanClean.length > 34) {
      Alert.alert("Errore", "IBAN non valido. Verifica il formato.");
      return false;
    }
    if (!/^[A-Z]{2}[0-9A-Z]+$/.test(ibanClean)) {
      Alert.alert("Errore", "L'IBAN deve iniziare con 2 lettere seguite da caratteri alfanumerici");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const amount = parseItalianNumber(importo);
    if (!importo.trim() || amount <= 0) {
      Alert.alert("Errore", "Inserisci un importo valido maggiore di zero");
      return false;
    }
    
    const totalCost = amount + COMMISSION_FEE;
    if (totalCost > activeBalance) {
      Alert.alert(
        "Saldo Insufficiente",
        `Il tuo Saldo Attivo è ${formatItalianNumber(activeBalance)} EUR.\n\nImporto: ${formatItalianNumber(amount)} EUR\nCommissione: ${formatItalianNumber(COMMISSION_FEE)} EUR\nTotale: ${formatItalianNumber(totalCost)} EUR\n\nFondi insufficienti per completare l'operazione.`
      );
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    try {
      if (currentStep === 1 && validateStep1()) {
        setCurrentStep(2);
      } else if (currentStep === 2 && validateStep2()) {
        setCurrentStep(3);
      } else if (currentStep === 3 && validateStep3()) {
        handleConfirmTransfer();
      }
    } catch (error: any) {
      Alert.alert("Errore", error.message || "Si è verificato un errore");
    }
  };

  const isButtonEnabled = () => {
    if (currentStep === 1) return destinatario.trim().length > 0;
    if (currentStep === 2) return iban.trim().length >= 15;
    if (currentStep === 3) {
      const amount = parseItalianNumber(importo);
      return amount > 0 && (amount + COMMISSION_FEE) <= activeBalance;
    }
    return false;
  };

  const handleConfirmTransfer = () => {
    const amount = parseItalianNumber(importo);
    const totalCost = amount + COMMISSION_FEE;
    
    Alert.alert(
      "Conferma Bonifico",
      `Stai per effettuare un bonifico:\n\nDestinatario: ${destinatario}\nIBAN: ${iban.toUpperCase()}\nImporto: ${formatItalianNumber(amount)} EUR\nCommissione: ${formatItalianNumber(COMMISSION_FEE)} EUR\nTotale operazione: ${formatItalianNumber(totalCost)} EUR\n\nConfermi l'operazione?`,
      [
        { text: "Annulla", style: "cancel" },
        { text: "Conferma", onPress: executeTransfer },
      ]
    );
  };

  const executeTransfer = async () => {
    setIsProcessing(true);
    const amount = parseItalianNumber(importo);
    
    try {
      const response = await apiRequest("POST", "/api/bonifico", {
        userId: user?.id,
        destinatario: destinatario.trim(),
        iban: iban.replace(/\s/g, "").toUpperCase(),
        amount,
        causale: causale.trim() || "Bonifico",
        bonificoIstantaneo,
      });

      const data = await response.json();
      
      if (data.success) {
        setReceiptData(data.receipt);
        setIsSuccess(true);
        await refreshUser();
        await queryClient.invalidateQueries({ queryKey: ["/api/transactions", user?.id] });
        await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      } else {
        Alert.alert("Errore", data.error || "Errore durante l'operazione");
      }
    } catch (error: any) {
      Alert.alert("Errore", error.message || "Errore di connessione");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{currentStep} di 3</Text>
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <Text style={styles.stepTitle}>Compila bonifico</Text>
      
      <View style={styles.securityNote}>
        <Icon name="check-circle" size={20} color={BankColors.gray600} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={styles.securityText}>
            L'operazione verrà eseguita secondo elevati standard di sicurezza.{" "}
            <Text style={styles.detailsLink}>Dettagli</Text>
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Intestato a</Text>
      <View style={styles.senderCard}>
        <Text style={styles.senderSubtitle}>Conto</Text>
        <Text style={styles.senderInfo}>Conto - {accountNumber} - {fullName.toUpperCase()}</Text>
        <Text style={styles.balanceInfo}>Saldo disponibile (Attivo): {formatItalianNumber(activeBalance)} EUR</Text>
      </View>

      <View style={styles.checkboxRow}>
        <View style={styles.checkbox}>
          <Icon name="square" size={20} color={BankColors.gray400} />
        </View>
        <Text style={styles.checkboxLabel}>Sto effettuando un bonifico per conto di un'altra persona</Text>
      </View>

      <Text style={styles.sectionLabel}>Beneficiario</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={destinatario}
          onChangeText={setDestinatario}
          placeholder="Destinatario*"
          placeholderTextColor={BankColors.gray400}
          maxLength={70}
        />
        <Pressable style={styles.rubricaButton}>
          <Icon name="book" size={18} color={BankColors.primary} />
          <Text style={styles.rubricaText}>Rubrica</Text>
        </Pressable>
        <Icon name="help-circle" size={20} color={BankColors.gray400} />
      </View>
      <Text style={styles.helperText}>Min: 3 Max: 70 caratteri. Ammessi caratteri alfanumerici e i caratteri speciali ,.'()+:?/-"&lt;</Text>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <View style={styles.selectedRecipient}>
        <Text style={styles.recipientLabel}>Destinatario</Text>
        <Text style={styles.recipientName}>{destinatario}</Text>
      </View>

      <View style={styles.checkboxRowActive}>
        <Icon name="check-square" size={20} color={BankColors.primary} />
        <Text style={styles.checkboxLabel}>Aggiungi in rubrica</Text>
      </View>

      <Text style={styles.sectionLabel}>Scegli come procedere</Text>
      <View style={styles.methodButtons}>
        <Pressable style={[styles.methodButton, styles.methodButtonActive]}>
          <Icon name="dollar-sign" size={24} color={BankColors.white} />
          <Text style={styles.methodButtonTextActive}>IBAN</Text>
        </Pressable>
        <Pressable style={styles.methodButton}>
          <Icon name="database" size={24} color={BankColors.gray600} />
          <Text style={styles.methodButtonText}>Numero di conto</Text>
        </Pressable>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={iban}
          onChangeText={(text) => setIban(text.toUpperCase())}
          placeholder="IBAN*"
          placeholderTextColor={BankColors.gray400}
          autoCapitalize="characters"
          maxLength={34}
        />
      </View>
      <Text style={styles.helperText}>
        Numero variabile di caratteri alfanumerici. I primi 2 caratteri sono lettere e rappresentano la sigla della nazione
      </Text>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Beneficiario</Text>
        <Text style={styles.summaryValue}>{destinatario}</Text>
        <Text style={styles.summaryLabel}>IBAN</Text>
        <Text style={styles.summaryValue}>{iban.toUpperCase()}</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={importo}
          onChangeText={setImporto}
          placeholder="Importo*"
          placeholderTextColor={BankColors.gray400}
          keyboardType="decimal-pad"
        />
        <Text style={styles.currencyLabel}>EUR</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={causale}
          onChangeText={setCausale}
          placeholder="Causale (opzionale)"
          placeholderTextColor={BankColors.gray400}
          maxLength={140}
        />
      </View>

      <View style={styles.dividerContainer}>
        <Text style={styles.dividerLabel}>Divisa*</Text>
        <View style={styles.dividerValue}>
          <Text style={styles.dividerValueText}>EUR - EURO</Text>
          <Icon name="chevron-down" size={20} color={BankColors.gray600} />
        </View>
      </View>

      <View style={styles.optionRow}>
        <View style={styles.optionInfo}>
          <Icon name="zap" size={20} color={BankColors.gray500} />
          <View style={{ marginLeft: Spacing.md, flex: 1 }}>
            <Text style={styles.optionTitle}>Bonifico istantaneo</Text>
            <Text style={styles.optionDescription}>
              La banca del beneficiario ti permette di attivare questa modalità
            </Text>
          </View>
        </View>
        <Switch
          value={bonificoIstantaneo}
          onValueChange={setBonificoIstantaneo}
          trackColor={{ false: BankColors.gray300, true: BankColors.primary }}
        />
      </View>

      <View style={styles.optionRow}>
        <View style={styles.optionInfo}>
          <Icon name="calendar" size={20} color={BankColors.gray500} />
          <View style={{ marginLeft: Spacing.md, flex: 1 }}>
            <Text style={styles.optionTitle}>Operazione ricorrente</Text>
            <Text style={styles.optionDescription}>
              Ti permette di impostare un pagamento automatico con frequenza temporale
            </Text>
          </View>
        </View>
        <Switch
          value={operazioneRicorrente}
          onValueChange={setOperazioneRicorrente}
          trackColor={{ false: BankColors.gray300, true: BankColors.primary }}
        />
      </View>

      <View style={styles.costSummary}>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Importo bonifico</Text>
          <Text style={styles.costValue}>{formatItalianNumber(parseItalianNumber(importo) || 0)} EUR</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Commissioni</Text>
          <Text style={styles.costValue}>{formatItalianNumber(COMMISSION_FEE)} EUR</Text>
        </View>
        <View style={[styles.costRow, styles.costRowTotal]}>
          <Text style={styles.costLabelTotal}>Totale operazione</Text>
          <Text style={styles.costValueTotal}>{formatItalianNumber((parseItalianNumber(importo) || 0) + COMMISSION_FEE)} EUR</Text>
        </View>
      </View>

      <View style={styles.balanceNote}>
        <Text style={styles.balanceNoteLabel}>Saldo disponibile (Attivo)</Text>
        <Text style={[styles.balanceNoteValue, (parseItalianNumber(importo) + COMMISSION_FEE) > activeBalance && styles.balanceNoteValueError]}>
          {formatItalianNumber(activeBalance)} EUR
        </Text>
      </View>

      {(parseItalianNumber(importo) + COMMISSION_FEE) > activeBalance && parseItalianNumber(importo) > 0 ? (
        <View style={styles.insufficientFundsWarning}>
          <Icon name="alert-circle" size={18} color={BankColors.error} />
          <Text style={styles.insufficientFundsText}>Saldo insufficiente per questa operazione</Text>
        </View>
      ) : null}
    </ScrollView>
  );

  const renderSuccess = () => (
    <View style={[styles.successContainer, { paddingTop: insets.top + 60 }]}>
      <View style={styles.successIcon}>
        <Icon name="check" size={48} color={BankColors.white} />
      </View>
      <Text style={styles.successTitle}>Bonifico Eseguito</Text>
      <Text style={styles.successSubtitle}>L'operazione è stata completata con successo</Text>

      {receiptData ? (
        <View style={styles.receiptCard}>
          <Text style={styles.receiptDate}>{receiptData.date}</Text>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Nome documento</Text>
            <Text style={styles.receiptValue}>Bonifico - {receiptData.destinatario}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Importo</Text>
            <Text style={styles.receiptValue}>{formatItalianNumber(receiptData.amount)} EUR</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Stato</Text>
            <Text style={[styles.receiptValue, { color: BankColors.success }]}>Eseguito</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Rapporto</Text>
            <Text style={styles.receiptValue}>Conto {receiptData.accountNumber}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Ordinante</Text>
            <Text style={styles.receiptValue}>{receiptData.senderName}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>IBAN Beneficiario</Text>
            <Text style={styles.receiptValue}>{receiptData.iban}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Commissioni</Text>
            <Text style={styles.receiptValue}>{formatItalianNumber(COMMISSION_FEE)} EUR</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Totale operazione</Text>
            <Text style={styles.receiptValue}>{formatItalianNumber(receiptData.amount + COMMISSION_FEE)} EUR</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.receiptActions}>
        <Pressable style={styles.receiptActionButton}>
          <Icon name="file-text" size={24} color={BankColors.primary} />
          <Text style={styles.receiptActionText}>Apri PDF</Text>
        </Pressable>
        <Pressable style={styles.receiptActionButton}>
          <Icon name="share-2" size={24} color={BankColors.primary} />
          <Text style={styles.receiptActionText}>Condividi PDF</Text>
        </Pressable>
      </View>

      <Pressable style={styles.doneButton} onPress={() => navigation.goBack()}>
        <Text style={styles.doneButtonText}>Chiudi</Text>
      </Pressable>
    </View>
  );

  if (isSuccess) {
    return (
      <View style={styles.container}>
        {renderSuccess()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable style={styles.headerButton} onPress={handleBack}>
          <Text style={styles.headerButtonText}>{currentStep === 1 ? "Annulla" : "Indietro"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Bonifico</Text>
        <Pressable style={styles.headerButton}>
          <Icon name="help-circle" size={22} color={BankColors.primary} />
          <Text style={styles.headerButtonText}>Aiuto</Text>
        </Pressable>
      </View>

      {renderProgressBar()}

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={[
            styles.continueButton, 
            isButtonEnabled() && styles.continueButtonActive,
            isProcessing && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={BankColors.white} />
          ) : (
            <Text style={[styles.continueButtonText, isButtonEnabled() && styles.continueButtonTextActive]}>Continua</Text>
          )}
        </Pressable>
        <Text style={styles.nextStepText}>
          Prossimo step: {currentStep === 1 ? "IBAN" : currentStep === 2 ? "importo" : "conferma"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankColors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: BankColors.white,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerButtonText: {
    color: BankColors.primary,
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: BankColors.gray200,
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: BankColors.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: BankColors.gray500,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: BankColors.gray900,
    marginBottom: Spacing.lg,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: BankColors.gray50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  securityText: {
    fontSize: 14,
    color: BankColors.gray600,
    lineHeight: 20,
  },
  detailsLink: {
    color: BankColors.primary,
    textDecorationLine: "underline",
  },
  sectionLabel: {
    fontSize: 24,
    fontWeight: "600",
    color: BankColors.gray900,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  senderCard: {
    backgroundColor: BankColors.gray50,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  senderSubtitle: {
    fontSize: 13,
    color: BankColors.gray500,
    marginBottom: 4,
  },
  senderInfo: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray900,
    marginBottom: 8,
  },
  balanceInfo: {
    fontSize: 14,
    color: BankColors.gray600,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  checkboxRowActive: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  checkbox: {
    marginRight: Spacing.sm,
  },
  checkboxLabel: {
    fontSize: 14,
    color: BankColors.gray700,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray300,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: BankColors.gray900,
    padding: 0,
  },
  rubricaButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    gap: 4,
  },
  rubricaText: {
    color: BankColors.primary,
    fontSize: 13,
  },
  helperText: {
    fontSize: 12,
    color: BankColors.gray500,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  selectedRecipient: {
    backgroundColor: BankColors.gray50,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  recipientLabel: {
    fontSize: 13,
    color: BankColors.gray500,
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  methodButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  methodButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankColors.gray300,
    gap: Spacing.sm,
  },
  methodButtonActive: {
    backgroundColor: BankColors.gray900,
    borderColor: BankColors.gray900,
  },
  methodButtonText: {
    fontSize: 13,
    color: BankColors.gray600,
    textAlign: "center",
  },
  methodButtonTextActive: {
    fontSize: 13,
    color: BankColors.white,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: BankColors.gray50,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    fontSize: 12,
    color: BankColors.gray500,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    color: BankColors.gray900,
    marginBottom: Spacing.md,
  },
  currencyLabel: {
    fontSize: 16,
    color: BankColors.gray600,
  },
  dividerContainer: {
    borderWidth: 1,
    borderColor: BankColors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  dividerLabel: {
    fontSize: 12,
    color: BankColors.gray500,
    marginBottom: 4,
  },
  dividerValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dividerValueText: {
    fontSize: 16,
    color: BankColors.gray900,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: Spacing.md,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: BankColors.gray900,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: BankColors.gray500,
    lineHeight: 18,
  },
  costSummary: {
    marginTop: Spacing.xl,
    backgroundColor: BankColors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  costRowTotal: {
    borderTopWidth: 1,
    borderTopColor: BankColors.gray300,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  costLabel: {
    fontSize: 14,
    color: BankColors.gray600,
  },
  costValue: {
    fontSize: 14,
    color: BankColors.gray900,
  },
  costLabelTotal: {
    fontSize: 15,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  costValueTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: BankColors.gray900,
  },
  balanceNote: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  balanceNoteLabel: {
    fontSize: 14,
    color: BankColors.gray600,
  },
  balanceNoteValue: {
    fontSize: 14,
    fontWeight: "600",
    color: BankColors.success,
  },
  balanceNoteValueError: {
    color: BankColors.error,
  },
  insufficientFundsWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  insufficientFundsText: {
    fontSize: 14,
    color: BankColors.error,
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: BankColors.white,
    borderTopWidth: 1,
    borderTopColor: BankColors.gray200,
  },
  continueButton: {
    backgroundColor: BankColors.gray300,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  continueButtonActive: {
    backgroundColor: BankColors.success,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray700,
  },
  continueButtonTextActive: {
    color: BankColors.white,
  },
  nextStepText: {
    fontSize: 13,
    color: BankColors.gray500,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BankColors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: BankColors.gray900,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: 15,
    color: BankColors.gray600,
    marginBottom: Spacing.xl,
  },
  receiptCard: {
    backgroundColor: BankColors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.lg,
  },
  receiptDate: {
    fontSize: 14,
    color: BankColors.gray500,
    marginBottom: Spacing.md,
  },
  receiptRow: {
    marginBottom: Spacing.md,
  },
  receiptLabel: {
    fontSize: 12,
    color: BankColors.gray500,
    marginBottom: 2,
  },
  receiptValue: {
    fontSize: 14,
    color: BankColors.gray900,
  },
  receiptActions: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  receiptActionButton: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  receiptActionText: {
    fontSize: 13,
    color: BankColors.primary,
  },
  doneButton: {
    backgroundColor: BankColors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl * 2,
    borderRadius: BorderRadius.md,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.white,
  },
});
