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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/lib/auth-context";
import { BankColors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { login, userId, needsSetup } = useAuth();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const handleEnter = async () => {
    if (userId) {
      navigation.navigate(needsSetup ? "PinSetup" : "PinEntry");
      return;
    }
    
    if (!username.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await login(username.trim());
      setWelcomeName(username.trim());
      setShowWelcome(true);
      setIsNewUser(result.needsSetup);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate(isNewUser ? "PinSetup" : "PinEntry");
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
              <Feather name="home" size={20} color={BankColors.white} />
            </View>
            <Text style={styles.logoText}>SANPAOLO</Text>
          </View>

          <View style={styles.centerContent}>
            {showWelcome ? (
              <>
                <Text style={styles.welcomeText}>Benvenuto {welcomeName}</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.enterButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleContinue}
                >
                  <Text style={styles.enterButtonText}>Entra</Text>
                </Pressable>
              </>
            ) : userId ? (
              <>
                <Text style={styles.welcomeText}>Bentornato</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.enterButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleEnter}
                >
                  <Text style={styles.enterButtonText}>Entra</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Inserisci il tuo nome</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nome utente"
                  placeholderTextColor={BankColors.gray400}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.enterButton,
                    pressed && styles.buttonPressed,
                    (!username.trim() || isLoading) && styles.buttonDisabled,
                  ]}
                  onPress={handleEnter}
                  disabled={!username.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={BankColors.primary} />
                  ) : (
                    <Text style={styles.enterButtonText}>Entra</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.bottomActions}>
            <View style={styles.quickActions}>
              <Pressable style={styles.quickAction}>
                <View style={styles.quickActionIcon}>
                  <Feather name="smartphone" size={24} color={BankColors.white} />
                </View>
                <Text style={styles.quickActionText}>Prelievo{"\n"}cardless</Text>
              </Pressable>
              <Pressable style={styles.quickAction}>
                <View style={styles.quickActionIcon}>
                  <Feather name="credit-card" size={24} color={BankColors.white} />
                </View>
                <Text style={styles.quickActionText}>BANCOMAT{"\n"}Pay</Text>
              </Pressable>
              <Pressable style={styles.quickAction}>
                <View style={styles.quickActionIcon}>
                  <Feather name="map-pin" size={24} color={BankColors.white} />
                </View>
                <Text style={styles.quickActionText}>Vicino a me</Text>
              </Pressable>
              <Pressable style={styles.quickAction}>
                <View style={styles.quickActionIcon}>
                  <Feather name="more-vertical" size={24} color={BankColors.white} />
                </View>
                <Text style={styles.quickActionText}>Altro</Text>
              </Pressable>
            </View>
            <View style={styles.emergencyButton}>
              <Text style={styles.emergencyText}>Emergenze</Text>
            </View>
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
    gap: Spacing.xl,
  },
  welcomeText: {
    color: BankColors.white,
    fontSize: 28,
    fontWeight: "400",
    textAlign: "center",
  },
  inputLabel: {
    color: BankColors.white,
    fontSize: 16,
    marginBottom: Spacing.sm,
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
  enterButton: {
    width: "100%",
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  enterButtonText: {
    color: BankColors.primary,
    fontSize: 18,
    fontWeight: "600",
  },
  bottomActions: {
    gap: Spacing.lg,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.lg,
  },
  quickAction: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    color: BankColors.white,
    fontSize: 11,
    textAlign: "center",
    opacity: 0.9,
  },
  emergencyButton: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  emergencyText: {
    color: BankColors.white,
    fontSize: 14,
  },
});
