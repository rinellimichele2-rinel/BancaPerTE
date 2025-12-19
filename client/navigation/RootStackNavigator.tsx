import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import WelcomeScreen from "@/screens/WelcomeScreen";
import PinEntryScreen from "@/screens/PinEntryScreen";
import PinSetupScreen from "@/screens/PinSetupScreen";
import { useAuth } from "@/lib/auth-context";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { BankColors } from "@/constants/theme";

export type RootStackParamList = {
  Welcome: undefined;
  PinEntry: undefined;
  PinSetup: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BankColors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen 
            name="PinEntry" 
            component={PinEntryScreen}
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen 
            name="PinSetup" 
            component={PinSetupScreen}
            options={{ animation: "slide_from_bottom" }}
          />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BankColors.white,
  },
});
