import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl, apiRequest } from "@/lib/query-client";

interface UserData {
  id: string;
  username: string;
  fullName: string;
  accountNumber: string;
  balance: string;
  cardLastFour: string;
}

interface AuthContextType {
  user: UserData | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string) => Promise<{ userId: string }>;
  verifyPin: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateBalance: (newBalance: string) => Promise<void>;
  updateName: (newName: string) => Promise<void>;
  updateAccountNumber: (newAccountNumber: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@banking_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { userId: storedUserId } = JSON.parse(stored);
        if (storedUserId) {
          setUserId(storedUserId);
        }
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string): Promise<{ userId: string }> => {
    const response = await apiRequest("POST", "/api/auth/login", { username });
    const data = await response.json();
    
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ 
      userId: data.userId,
      username: data.username 
    }));
    
    setUserId(data.userId);
    return { userId: data.userId };
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const response = await apiRequest("POST", "/api/auth/verify-pin", { userId, pin });
      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error("PIN verification error:", error);
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setUserId(null);
  };

  const refreshUser = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(new URL(`/api/user/${userId}`, getApiUrl()).toString());
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }, [userId]);

  const updateBalance = async (newBalance: string) => {
    if (!userId) return;
    
    try {
      await apiRequest("PUT", `/api/user/${userId}/balance`, { balance: newBalance });
      await refreshUser();
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  const updateName = async (newName: string) => {
    if (!userId) return;
    
    try {
      await apiRequest("PUT", `/api/user/${userId}/name`, { name: newName });
      await refreshUser();
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  const updateAccountNumber = async (newAccountNumber: string) => {
    if (!userId) return;
    
    try {
      await apiRequest("PUT", `/api/user/${userId}/account-number`, { accountNumber: newAccountNumber });
      await refreshUser();
    } catch (error) {
      console.error("Error updating account number:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyPin,
        logout,
        refreshUser,
        updateBalance,
        updateName,
        updateAccountNumber,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
