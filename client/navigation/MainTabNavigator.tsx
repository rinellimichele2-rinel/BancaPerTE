import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "@/screens/HomeScreen";
import TransactionDetailScreen from "@/screens/TransactionDetailScreen";
import AnalisiScreen from "@/screens/AnalisiScreen";
import AdvisorScreen from "@/screens/AdvisorScreen";
import NewsScreen from "@/screens/NewsScreen";
import OperazioniScreen from "@/screens/OperazioniScreen";
import CarteScreen from "@/screens/CarteScreen";
import AltroScreen from "@/screens/AltroScreen";
import { Icon } from "@/components/Icon";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { Transaction } from "@shared/schema";

export type HomeStackParamList = {
  HomeMain: undefined;
  TransactionDetail: { transaction: Transaction };
  Analisi: undefined;
  Advisor: undefined;
  News: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Operazioni: undefined;
  Carte: undefined;
  Altro: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <HomeStack.Screen name="Analisi" component={AnalisiScreen} />
      <HomeStack.Screen 
        name="Advisor" 
        component={AdvisorScreen}
        options={{
          headerShown: true,
          headerTitle: "Consulente AI",
          headerTintColor: BankColors.primary,
          headerStyle: { backgroundColor: BankColors.white },
          headerBackTitle: "Indietro",
        }}
      />
      <HomeStack.Screen 
        name="News" 
        component={NewsScreen}
        options={{
          headerShown: true,
          headerTitle: "Notizie Finanziarie",
          headerTintColor: BankColors.primary,
          headerStyle: { backgroundColor: BankColors.white },
          headerBackTitle: "Indietro",
        }}
      />
    </HomeStack.Navigator>
  );
}

function TabBarIcon({ name, color, focused, badge }: { 
  name: string; 
  color: string; 
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.tabIconContainer}>
      <Icon name={name} size={24} color={color} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: BankColors.primary,
        tabBarInactiveTintColor: BankColors.gray500,
        tabBarStyle: {
          backgroundColor: BankColors.white,
          borderTopWidth: 1,
          borderTopColor: BankColors.gray200,
          height: 60 + insets.bottom,
          paddingTop: Spacing.sm,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Operazioni"
        component={OperazioniScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.euroIconContainer}>
              <View style={[styles.euroCircle, { borderColor: color }]}>
                <Text style={[styles.euroSymbol, { color }]}>E</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Carte"
        component={CarteScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="credit-card" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Altro"
        component={AltroScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="menu" color={color} focused={focused} badge={8} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: BankColors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: BankColors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  euroIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  euroCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  euroSymbol: {
    fontSize: 14,
    fontWeight: "700",
  },
});
