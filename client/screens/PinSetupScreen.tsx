import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { BankColors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PIN_LENGTH = 5;

export default function PinSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { setupPin, logout } = useAuth();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNumberPress = async (num: string) => {
    const currentPin = step === "create" ? pin : confirmPin;
    if (currentPin.length >= PIN_LENGTH) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPin = currentPin + num;
    
    if (step === "create") {
      setPin(newPin);
      setError("");
      
      if (newPin.length === PIN_LENGTH) {
        setStep("confirm");
      }
    } else {
      setConfirmPin(newPin);
      setError("");
      
      if (newPin.length === PIN_LENGTH) {
        if (newPin === pin) {
          setIsLoading(true);
          const success = await setupPin(newPin);
          setIsLoading(false);
          
          if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.reset({
              index: 0,
              routes: [{ name: "Main" }],
            });
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError("Errore durante la configurazione del PIN");
            setConfirmPin("");
          }
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("I PIN non corrispondono. Riprova.");
          setPin("");
          setConfirmPin("");
          setStep("create");
        }
      }
    }
  };

  const handleDelete = () => {
    const currentPin = step === "create" ? pin : confirmPin;
    if (currentPin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (step === "create") {
        setPin(pin.slice(0, -1));
      } else {
        setConfirmPin(confirmPin.slice(0, -1));
      }
      setError("");
    }
  };

  const handleCancel = async () => {
    await logout();
    navigation.goBack();
  };

  const renderPinDots = () => {
    const currentPin = step === "create" ? pin : confirmPin;
    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentPin.length && styles.dotFilled,
              error ? styles.dotError : null,
            ]}
          >
            {index < currentPin.length ? (
              <View style={[styles.dotInner, error ? styles.dotInnerError : null]} />
            ) : (
              <Text style={styles.dotPlaceholder}>_</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const rows = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["", "0", "delete"],
    ];

    return (
      <View style={styles.keypad}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === "") {
                return <View key={keyIndex} style={styles.keyEmpty} />;
              }
              if (key === "delete") {
                return (
                  <Pressable
                    key={keyIndex}
                    style={({ pressed }) => [
                      styles.keyButton,
                      pressed && styles.keyPressed,
                    ]}
                    onPress={handleDelete}
                  >
                    <Feather name="delete" size={28} color={BankColors.gray800} />
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={keyIndex}
                  style={({ pressed }) => [
                    styles.keyButton,
                    pressed && styles.keyPressed,
                  ]}
                  onPress={() => handleNumberPress(key)}
                  disabled={isLoading}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBar} />
      </View>
      
      <View style={[styles.content, { paddingTop: insets.top + Spacing["4xl"] }]}>
        <Text style={styles.title}>
          {step === "create" ? "Crea il tuo PIN" : "Conferma il tuo PIN"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "create" 
            ? "Inserisci un PIN di 5 cifre per proteggere il tuo conto"
            : "Inserisci nuovamente il PIN per confermare"
          }
        </Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BankColors.primary} />
          </View>
        ) : (
          renderPinDots()
        )}
        
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        
        {renderKeypad()}
      </View>
      
      <Pressable
        style={[styles.cancelButton, { paddingBottom: insets.bottom + Spacing.lg }]}
        onPress={handleCancel}
      >
        <Text style={styles.cancelText}>Annulla</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankColors.white,
  },
  header: {
    height: 4,
  },
  headerBar: {
    height: 4,
    backgroundColor: BankColors.primary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "400",
    color: BankColors.gray900,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: BankColors.gray600,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  loadingContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dotFilled: {},
  dotError: {},
  dotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BankColors.gray900,
  },
  dotInnerError: {
    backgroundColor: BankColors.error,
  },
  dotPlaceholder: {
    fontSize: 28,
    color: BankColors.gray400,
    fontWeight: "300",
  },
  errorText: {
    color: BankColors.error,
    fontSize: 14,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  keypad: {
    marginTop: Spacing["2xl"],
    gap: Spacing.lg,
  },
  keypadRow: {
    flexDirection: "row",
    gap: Spacing["4xl"],
  },
  keyButton: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  keyPressed: {
    backgroundColor: BankColors.gray100,
    borderRadius: 40,
  },
  keyEmpty: {
    width: 80,
    height: 80,
  },
  keyText: {
    fontSize: 36,
    fontWeight: "300",
    color: BankColors.gray800,
  },
  cancelButton: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BankColors.gray200,
  },
  cancelText: {
    fontSize: 16,
    color: BankColors.gray900,
  },
});
