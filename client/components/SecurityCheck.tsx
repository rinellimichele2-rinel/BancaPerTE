import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import * as Device from "expo-device";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import { Icon } from "@/components/Icon";

interface SecurityCheckProps {
  children: React.ReactNode;
}

export function SecurityCheck({ children }: SecurityCheckProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  useEffect(() => {
    checkDeviceSecurity();
  }, []);

  const checkDeviceSecurity = async () => {
    try {
      const isEmulator = !Device.isDevice;
      const isRootedIndicators = await detectRootIndicators();

      if (isRootedIndicators && !isEmulator) {
        setShowWarning(true);
      }
    } catch (error) {
      console.log("Security check error:", error);
    }
  };

  const detectRootIndicators = async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      return false;
    }

    if (Platform.OS === "android") {
      const deviceName = Device.deviceName?.toLowerCase() || "";
      const modelName = Device.modelName?.toLowerCase() || "";
      const brand = Device.brand?.toLowerCase() || "";

      const suspiciousPatterns = [
        "rooted",
        "magisk",
        "supersu",
        "kingroot",
        "test-keys",
        "custom",
        "lineage",
        "cyanogen",
      ];

      const combinedInfo = `${deviceName} ${modelName} ${brand}`;

      for (const pattern of suspiciousPatterns) {
        if (combinedInfo.includes(pattern)) {
          return true;
        }
      }
    }

    if (Platform.OS === "ios") {
      const osName = Device.osName?.toLowerCase() || "";
      const deviceName = Device.deviceName?.toLowerCase() || "";

      const jailbreakIndicators = [
        "jailbroken",
        "cydia",
        "sileo",
        "unc0ver",
        "checkra1n",
      ];

      const combinedInfo = `${osName} ${deviceName}`;

      for (const indicator of jailbreakIndicators) {
        if (combinedInfo.includes(indicator)) {
          return true;
        }
      }
    }

    return false;
  };

  const handleDismiss = () => {
    setWarningDismissed(true);
    setShowWarning(false);
  };

  if (showWarning && !warningDismissed) {
    return (
      <View style={styles.container}>
        {children}
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.warningCard}>
              <View style={styles.iconContainer}>
                <Icon
                  name="alert-triangle"
                  size={48}
                  color={BankColors.error}
                />
              </View>
              <Text style={styles.title}>Avviso di Sicurezza</Text>
              <Text style={styles.message}>
                Abbiamo rilevato che il tuo dispositivo potrebbe essere stato
                modificato (root/jailbreak).
              </Text>
              <Text style={styles.submessage}>
                Per la tua sicurezza, alcune funzionalita potrebbero essere
                limitate. Ti consigliamo di utilizzare un dispositivo non
                modificato.
              </Text>
              <Pressable style={styles.button} onPress={handleDismiss}>
                <Text style={styles.buttonText}>Ho capito, continua</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  warningCard: {
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: BankColors.gray900,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: BankColors.gray700,
    textAlign: "center",
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  submessage: {
    fontSize: 13,
    color: BankColors.gray500,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  button: {
    backgroundColor: BankColors.error,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    width: "100%",
  },
  buttonText: {
    color: BankColors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
