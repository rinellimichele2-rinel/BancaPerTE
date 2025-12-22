import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import pg from "pg";
import { 
  users, 
  transactions,
  userPresetSettings,
  appSettings,
  referralActivations,
  type User, 
  type InsertUser, 
  type Transaction, 
  type InsertTransaction,
  type UserPresetSettings,
  type AppSettings,
  type ReferralActivation
} from "@shared/schema";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByRechargeUsername(rechargeUsername: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<User | undefined>;
  updateUserBalanceWithPurchased(userId: string, newBalance: string, newPurchasedBalance: string): Promise<User | undefined>;
  updateUserName(userId: string, newName: string): Promise<User | undefined>;
  updateUserAccountNumber(userId: string, newAccountNumber: string): Promise<User | undefined>;
  updateUserPin(userId: string, newPin: string): Promise<User | undefined>;
  setUserRechargeUsername(userId: string, rechargeUsername: string): Promise<User | undefined>;
  transferBalance(fromUserId: string, toUserId: string, amount: number): Promise<{ success: boolean; error?: string; fromUser?: User; toUser?: User }>;
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createMultipleTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;
  updateTransaction(id: string, updates: { amount?: string; description?: string }): Promise<Transaction | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByRechargeUsername(rechargeUsername: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.rechargeUsername, rechargeUsername));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserBalanceWithPurchased(userId: string, newBalance: string, newPurchasedBalance: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ balance: newBalance, purchasedBalance: newPurchasedBalance })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserName(userId: string, newName: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ fullName: newName })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserAccountNumber(userId: string, newAccountNumber: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ accountNumber: newAccountNumber })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserPin(userId: string, newPin: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ pin: newPin, hasSetPin: true })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async setUserRechargeUsername(userId: string, rechargeUsername: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ rechargeUsername })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async transferBalance(fromUserId: string, toUserId: string, amount: number): Promise<{ success: boolean; error?: string; fromUser?: User; toUser?: User }> {
    const fromUser = await this.getUser(fromUserId);
    const toUser = await this.getUser(toUserId);

    if (!fromUser) {
      return { success: false, error: "Utente mittente non trovato" };
    }
    if (!toUser) {
      return { success: false, error: "Utente destinatario non trovato" };
    }
    if (fromUserId === toUserId) {
      return { success: false, error: "Non puoi trasferire denaro a te stesso" };
    }

    const fromBalance = parseFloat(fromUser.balance || "0");
    const toBalance = parseFloat(toUser.balance || "0");

    if (amount <= 0) {
      return { success: false, error: "L'importo deve essere maggiore di zero" };
    }
    if (amount > fromBalance) {
      return { success: false, error: "Saldo insufficiente" };
    }

    const newFromBalance = (fromBalance - amount).toFixed(2);
    const newToBalance = (toBalance + amount).toFixed(2);

    const updatedFromUser = await this.updateUserBalance(fromUserId, newFromBalance);
    const updatedToUser = await this.updateUserBalance(toUserId, newToBalance);

    if (!updatedFromUser || !updatedToUser) {
      return { success: false, error: "Errore durante il trasferimento" };
    }

    return { success: true, fromUser: updatedFromUser, toUser: updatedToUser };
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
    return result;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0];
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(insertTransaction).returning();
    return result[0];
  }

  async createMultipleTransactions(insertTransactions: InsertTransaction[]): Promise<Transaction[]> {
    if (insertTransactions.length === 0) return [];
    const result = await db.insert(transactions).values(insertTransactions).returning();
    return result;
  }

  async updateTransaction(id: string, updates: { amount?: string; description?: string }): Promise<Transaction | undefined> {
    const result = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  async getPresetSettings(userId: string): Promise<UserPresetSettings | undefined> {
    const result = await db.select().from(userPresetSettings).where(eq(userPresetSettings.userId, userId));
    return result[0];
  }

  async savePresetSettings(userId: string, settings: { deletedPresets?: string[]; disabledPresets?: string[]; customPresets?: any[] }): Promise<UserPresetSettings> {
    const existing = await this.getPresetSettings(userId);
    if (existing) {
      const result = await db
        .update(userPresetSettings)
        .set({
          deletedPresets: settings.deletedPresets ? JSON.stringify(settings.deletedPresets) : existing.deletedPresets,
          disabledPresets: settings.disabledPresets ? JSON.stringify(settings.disabledPresets) : existing.disabledPresets,
          customPresets: settings.customPresets ? JSON.stringify(settings.customPresets) : existing.customPresets,
        })
        .where(eq(userPresetSettings.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(userPresetSettings)
        .values({
          userId,
          deletedPresets: JSON.stringify(settings.deletedPresets || []),
          disabledPresets: JSON.stringify(settings.disabledPresets || []),
          customPresets: JSON.stringify(settings.customPresets || []),
        })
        .returning();
      return result[0];
    }
  }

  async getAppSetting(key: string): Promise<string | null> {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return result[0]?.value ?? null;
  }

  async setAppSetting(key: string, value: string): Promise<void> {
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, key));
    if (existing.length > 0) {
      await db.update(appSettings).set({ value }).where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value });
    }
  }

  async updateUserReferredBy(userId: string, referredBy: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ referredBy })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserTotalRecharged(userId: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const currentTotal = parseFloat(user.totalRecharged || "0");
    const newTotal = (currentTotal + amount).toFixed(2);
    const result = await db
      .update(users)
      .set({ totalRecharged: newTotal })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async activateReferral(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ referralActivated: true })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async createReferralActivation(referrerId: string, referredId: string, bonusAmount: number): Promise<ReferralActivation> {
    const result = await db.insert(referralActivations).values({
      referrerId,
      referredId,
      bonusAmount: bonusAmount.toFixed(2),
    }).returning();
    return result[0];
  }

  async getReferralActivations(): Promise<(ReferralActivation & { referrerUsername?: string; referredUsername?: string })[]> {
    const activations = await db.select().from(referralActivations).orderBy(desc(referralActivations.activatedAt));
    const result = [];
    for (const activation of activations) {
      const referrer = await this.getUser(activation.referrerId);
      const referred = await this.getUser(activation.referredId);
      result.push({
        ...activation,
        referrerUsername: referrer?.username,
        referredUsername: referred?.username,
      });
    }
    return result;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, referralCode));
    return result[0];
  }
}

export const storage = new DatabaseStorage();
