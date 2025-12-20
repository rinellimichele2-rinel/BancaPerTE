import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

export default function RechargeUsernameScreen() {
  const insets = useSafeAreaInsets();
  const { setRechargeUsername } = useAuth();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUsernameAvailability = async (value: string): Promise<boolean> => {
    if (!value.trim()) return false;
    
    setIsChecking(true);
    try {
      const response = await apiRequest("POST", "/api/check-recharge-username", { rechargeUsername: value.trim().toLowerCase() });
      const data = await response.json();
      return data.available;
    } catch {
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedUsername = username.trim().toLowerCase();
    
    if (!trimmedUsername) {
      setError("Inserisci un username");
      return;
    }

    if (trimmedUsername.length < 3) {
      setError("L'username deve essere di almeno 3 caratteri");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError("L'username puo contenere solo lettere, numeri e underscore");
      return;
    }

    setIsLoading(true);
    setError(null);

    const isAvailable = await checkUsernameAvailability(trimmedUsername);
    
    if (!isAvailable) {
      setError("Questo username e gia in uso. Scegline un altro.");
      setIsLoading(false);
      return;
    }

    const success = await setRechargeUsername(trimmedUsername);
    
    if (!success) {
      setError("Errore durante il salvataggio. Riprova.");
    }
    
    setIsLoading(false);
  };

  return (
    <LinearGradient
      colors={[BankColors.primaryLight, BankColors.primary, BankColors.primaryDark]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing["3xl"] }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>INTESA</Text>
            <View style={styles.logoIcon}>
              <Icon name="home" size={20} color={BankColors.white} />
            </View>
            <Text style={styles.logoText}>SANPAOLO</Text>
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.title}>Scegli il tuo Username di Ricarica</Text>
            <Text style={styles.subtitle}>
              Questo username verra usato per identificarti quando effettui una ricarica PayPal.
              Non sara visibile nella home.
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(text) => {
                  setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  setError(null);
                }}
                placeholder="es. mario123"
                placeholderTextColor={BankColors.gray400}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
              />
              {isChecking && (
                <ActivityIndicator 
                  size="small" 
                  color={BankColors.primary} 
                  style={styles.checkingIndicator}
                />
              )}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.buttonPressed,
                (!username.trim() || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!username.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={BankColors.primary} />
              ) : (
                <Text style={styles.submitButtonText}>Conferma</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.infoBox}>
            <Icon name="info" size={20} color={BankColors.white} />
            <Text style={styles.infoText}>
              L'username non potra essere modificato dopo la conferma.
              Potrai visualizzarlo nelle impostazioni profilo.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  logoText: {
    color: BankColors.white,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: BankColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  title: {
    color: BankColors.white,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  inputContainer: {
    width: "100%",
    position: "relative",
  },
  input: {
    width: "100%",
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: BankColors.gray900,
  },
  checkingIndicator: {
    position: "absolute",
    right: Spacing.lg,
    top: "50%",
    marginTop: -10,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(255,107,107,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
  },
  submitButton: {
    width: "100%",
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: BankColors.primary,
    fontSize: 18,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  infoText: {
    flex: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    lineHeight: 18,
  },
});
