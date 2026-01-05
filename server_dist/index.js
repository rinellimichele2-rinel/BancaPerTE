// server/index.ts
import "dotenv/config";
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/storage.ts
import { eq as eq2, desc as desc2, like as like2 } from "drizzle-orm";

// server/db.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// shared/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createInsertSchema as createInsertSchema2,
} from "drizzle-zod";
import { v4 as uuidv4, v4 as uuidv42 } from "uuid";

// server/storage.pg.ts
import { eq, desc, like } from "drizzle-orm";

// server/db.pg.ts
import { drizzle as drizzle2 } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  pgTable,
  text as text2,
  integer as integer2,
  boolean,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

// server/replit_integrations/chat/routes.ts
import OpenAI from "openai";

// server/replit_integrations/chat/storage.ts
import { eq as eq3, desc as desc3 } from "drizzle-orm";

// server/replit_integrations/news/routes.ts
import OpenAI2 from "openai";
import { eq as eq4, desc as desc4 } from "drizzle-orm";

// server/index.ts
import * as fs from "fs";
import * as path from "path";

let __defProp = Object.defineProperty;
let __export = (target, all) => {
  for (let name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
let sqlite = new Database("sqlite.db");
let db = drizzle(sqlite);
let users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  username: text("username").notNull().unique(),
  rechargeUsername: text("recharge_username").unique(),
  pin: text("pin").notNull(),
  hasSetPin: integer("has_set_pin", { mode: "boolean" })
    .notNull()
    .default(false),
  fullName: text("full_name").notNull(),
  accountNumber: text("account_number").notNull(),
  balance: text("balance").notNull().default("0.00"),
  purchasedBalance: text("purchased_balance").notNull().default("0.00"),
  realPurchasedBalance: text("real_purchased_balance")
    .notNull()
    .default("0.00"),
  totalRecharged: text("total_recharged").notNull().default("0.00"),
  referredBy: text("referred_by"),
  referralActivated: integer("referral_activated", { mode: "boolean" })
    .notNull()
    .default(false),
  cardLastFour: text("card_last_four").notNull().default("3796"),
  displayName: text("display_name"),
  customMonthlyExpenses: text("custom_monthly_expenses"),
  customMonthlyIncome: text("custom_monthly_income"),
  isBlocked: integer("is_blocked", { mode: "boolean" })
    .notNull()
    .default(false),
  blockedReason: text("blocked_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
let transactions = sqliteTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  description: text("description").notNull(),
  amount: text("amount").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  accountNumber: text("account_number"),
  isContabilizzato: integer("is_contabilizzato", { mode: "boolean" })
    .notNull()
    .default(false),
  isSimulated: integer("is_simulated", { mode: "boolean" })
    .notNull()
    .default(true),
  date: integer("date", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
let insertUserSchema = createInsertSchema(users).pick({
  username: true,
  rechargeUsername: true,
  pin: true,
  hasSetPin: true,
  fullName: true,
  accountNumber: true,
  balance: true,
  purchasedBalance: true,
  realPurchasedBalance: true,
  cardLastFour: true,
  displayName: true,
});
let insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  description: true,
  amount: true,
  type: true,
  category: true,
  accountNumber: true,
  isContabilizzato: true,
  isSimulated: true,
  date: true,
});
let conversations = sqliteTable("conversations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => /* @__PURE__ */ new Date()),
});
let messages = sqliteTable("messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id", { mode: "number" })
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => /* @__PURE__ */ new Date()),
});
let insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});
let insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
let userPresetSettings = sqliteTable("user_preset_settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  deletedPresets: text("deleted_presets").notNull().default("[]"),
  disabledPresets: text("disabled_presets").notNull().default("[]"),
  customPresets: text("custom_presets").notNull().default("[]"),
});
let userCustomPresets = sqliteTable("user_custom_presets", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  description: text("description").notNull(),
  minAmount: integer("min_amount").notNull(),
  maxAmount: integer("max_amount").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
let appSettings = sqliteTable("app_settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});
let referralActivations = sqliteTable("referral_activations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => users.id),
  referredId: text("referred_id")
    .notNull()
    .references(() => users.id),
  bonusAmount: text("bonus_amount").notNull(),
  activatedAt: integer("activated_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
let insertCustomPresetSchema = createInsertSchema(userCustomPresets).omit({
  id: true,
  createdAt: true,
});

// shared/schema.pg.ts
let schema_pg_exports = {};
__export(schema_pg_exports, {
  appSettings: () => appSettings2,
  conversations: () => conversations2,
  insertConversationSchema: () => insertConversationSchema2,
  insertCustomPresetSchema: () => insertCustomPresetSchema2,
  insertMessageSchema: () => insertMessageSchema2,
  insertTransactionSchema: () => insertTransactionSchema2,
  insertUserSchema: () => insertUserSchema2,
  messages: () => messages2,
  referralActivations: () => referralActivations2,
  transactions: () => transactions2,
  userCustomPresets: () => userCustomPresets2,
  userPresetSettings: () => userPresetSettings2,
  users: () => users2,
});
var users2 = pgTable("users", {
  id: text2("id")
    .primaryKey()
    .$defaultFn(() => uuidv42()),
  username: text2("username").notNull().unique(),
  rechargeUsername: text2("recharge_username").unique(),
  pin: text2("pin").notNull(),
  hasSetPin: boolean("has_set_pin").notNull().default(false),
  fullName: text2("full_name").notNull(),
  accountNumber: text2("account_number").notNull(),
  balance: text2("balance").notNull().default("0.00"),
  purchasedBalance: text2("purchased_balance").notNull().default("0.00"),
  realPurchasedBalance: text2("real_purchased_balance")
    .notNull()
    .default("0.00"),
  totalRecharged: text2("total_recharged").notNull().default("0.00"),
  referredBy: text2("referred_by"),
  referralActivated: boolean("referral_activated").notNull().default(false),
  cardLastFour: text2("card_last_four").notNull().default("3796"),
  displayName: text2("display_name"),
  customMonthlyExpenses: text2("custom_monthly_expenses"),
  customMonthlyIncome: text2("custom_monthly_income"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockedReason: text2("blocked_reason"),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
var transactions2 = pgTable("transactions", {
  id: text2("id")
    .primaryKey()
    .$defaultFn(() => uuidv42()),
  userId: text2("user_id")
    .notNull()
    .references(() => users2.id),
  description: text2("description").notNull(),
  amount: text2("amount").notNull(),
  type: text2("type").notNull(),
  category: text2("category").notNull(),
  accountNumber: text2("account_number"),
  isContabilizzato: boolean("is_contabilizzato").notNull().default(false),
  isSimulated: boolean("is_simulated").notNull().default(true),
  date: timestamp("date").$defaultFn(() => /* @__PURE__ */ new Date()),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
var insertUserSchema2 = createInsertSchema2(users2).pick({
  username: true,
  rechargeUsername: true,
  pin: true,
  hasSetPin: true,
  fullName: true,
  accountNumber: true,
  balance: true,
  purchasedBalance: true,
  realPurchasedBalance: true,
  cardLastFour: true,
  displayName: true,
});
var insertTransactionSchema2 = createInsertSchema2(transactions2).pick({
  userId: true,
  description: true,
  amount: true,
  type: true,
  category: true,
  accountNumber: true,
  isContabilizzato: true,
  isSimulated: true,
  date: true,
});
var conversations2 = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text2("user_id").references(() => users2.id),
  title: text2("title").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => /* @__PURE__ */ new Date()),
});
var messages2 = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer2("conversation_id")
    .notNull()
    .references(() => conversations2.id, { onDelete: "cascade" }),
  role: text2("role").notNull(),
  content: text2("content").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => /* @__PURE__ */ new Date()),
});
var insertConversationSchema2 = createInsertSchema2(conversations2).omit({
  id: true,
  createdAt: true,
});
var insertMessageSchema2 = createInsertSchema2(messages2).omit({
  id: true,
  createdAt: true,
});
var userPresetSettings2 = pgTable("user_preset_settings", {
  id: serial("id").primaryKey(),
  userId: text2("user_id")
    .notNull()
    .references(() => users2.id),
  deletedPresets: text2("deleted_presets").notNull().default("[]"),
  disabledPresets: text2("disabled_presets").notNull().default("[]"),
  customPresets: text2("custom_presets").notNull().default("[]"),
});
var userCustomPresets2 = pgTable("user_custom_presets", {
  id: serial("id").primaryKey(),
  userId: text2("user_id")
    .notNull()
    .references(() => users2.id),
  description: text2("description").notNull(),
  minAmount: integer2("min_amount").notNull(),
  maxAmount: integer2("max_amount").notNull(),
  type: text2("type").notNull(),
  category: text2("category").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
var appSettings2 = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text2("key").notNull().unique(),
  value: text2("value").notNull(),
});
var referralActivations2 = pgTable("referral_activations", {
  id: serial("id").primaryKey(),
  referrerId: text2("referrer_id")
    .notNull()
    .references(() => users2.id),
  referredId: text2("referred_id")
    .notNull()
    .references(() => users2.id),
  bonusAmount: text2("bonus_amount").notNull(),
  activatedAt: timestamp("activated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});
var insertCustomPresetSchema2 = createInsertSchema2(userCustomPresets2).omit({
  id: true,
  createdAt: true,
});

// server/db.pg.ts
let { Pool } = pg;
let _db = null;
let _pool = null;
function getDb() {
  if (_db) return _db;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Configure a PostgreSQL database and set the env variable.",
    );
  }
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  _db = drizzle2(_pool, { schema: schema_pg_exports });
  return _db;
}
let db2 = new Proxy(
  {},
  {
    get(_target, prop) {
      const real = getDb();
      const value = real[prop];
      if (typeof value === "function") return value.bind(real);
      return value;
    },
  },
);

// server/storage.pg.ts
let PostgresStorage = class {
  async getUser(id) {
    const result = await db2.select().from(users2).where(eq(users2.id, id));
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db2
      .select()
      .from(users2)
      .where(like(users2.username, username));
    return result[0];
  }
  async getUserByRechargeUsername(rechargeUsername) {
    const result = await db2
      .select()
      .from(users2)
      .where(eq(users2.rechargeUsername, rechargeUsername));
    return result[0];
  }
  async getAllUsers() {
    const result = await db2.select().from(users2);
    return result;
  }
  async searchUsersByPartialUsername(partialUsername) {
    const result = await db2
      .select()
      .from(users2)
      .where(like(users2.username, `%${partialUsername}%`));
    return result;
  }
  async createUser(insertUser) {
    const result = await db2.insert(users2).values(insertUser).returning();
    return result[0];
  }
  async updateUserBalance(userId, newBalance) {
    const result = await db2
      .update(users2)
      .set({ balance: newBalance })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async updateUserBalanceWithPurchased(
    userId,
    newBalance,
    newPurchasedBalance,
  ) {
    const result = await db2
      .update(users2)
      .set({ balance: newBalance, purchasedBalance: newPurchasedBalance })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async updateUserAllBalances(
    userId,
    newBalance,
    newPurchasedBalance,
    newRealPurchasedBalance,
  ) {
    const result = await db2
      .update(users2)
      .set({
        balance: newBalance,
        purchasedBalance: newPurchasedBalance,
        realPurchasedBalance: newRealPurchasedBalance,
      })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async updateUserName(userId, newName) {
    const result = await db2
      .update(users2)
      .set({ fullName: newName })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async updateUserAccountNumber(userId, newAccountNumber) {
    const result = await db2
      .update(users2)
      .set({ accountNumber: newAccountNumber })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async updateUserDisplayName(userId, displayName) {
    const result = await db2
      .update(users2)
      .set({ displayName })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async updateUserMonthlyValues(userId, expenses, income) {
    const result = await db2
      .update(users2)
      .set({ customMonthlyExpenses: expenses, customMonthlyIncome: income })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async updateUserPin(userId, newPin) {
    const result = await db2
      .update(users2)
      .set({ pin: newPin, hasSetPin: true })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async setUserRechargeUsername(userId, rechargeUsername) {
    const result = await db2
      .update(users2)
      .set({ rechargeUsername })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async transferBalance(fromUserId, toUserId, amount) {
    const fromUser = await this.getUser(fromUserId);
    const toUser = await this.getUser(toUserId);
    if (!fromUser) {
      return { success: false, error: "Utente mittente non trovato" };
    }
    if (!toUser) {
      return { success: false, error: "Utente destinatario non trovato" };
    }
    if (fromUserId === toUserId) {
      return {
        success: false,
        error: "Non puoi trasferire denaro a te stesso",
      };
    }
    const fromBalance = parseFloat(fromUser.balance || "0");
    const toBalance = parseFloat(toUser.balance || "0");
    const fromPurchasedBalance = parseFloat(fromUser.purchasedBalance || "0");
    const toPurchasedBalance = parseFloat(toUser.purchasedBalance || "0");
    const fromRealPurchased = parseFloat(fromUser.realPurchasedBalance || "0");
    const toRealPurchased = parseFloat(toUser.realPurchasedBalance || "0");
    if (amount <= 0) {
      return {
        success: false,
        error: "L'importo deve essere maggiore di zero",
      };
    }
    if (amount > fromBalance) {
      return { success: false, error: "Saldo insufficiente" };
    }
    const newFromBalance = (fromBalance - amount).toFixed(2);
    const newToBalance = (toBalance + amount).toFixed(2);
    const newFromPurchased = Math.max(0, fromPurchasedBalance - amount).toFixed(
      2,
    );
    const newToPurchased = (toPurchasedBalance + amount).toFixed(2);
    const newFromRealPurchased = Math.max(
      0,
      fromRealPurchased - amount,
    ).toFixed(2);
    const newToRealPurchased = (toRealPurchased + amount).toFixed(2);
    const updatedFromUser = await this.updateUserAllBalances(
      fromUserId,
      newFromBalance,
      newFromPurchased,
      newFromRealPurchased,
    );
    const updatedToUser = await this.updateUserAllBalances(
      toUserId,
      newToBalance,
      newToPurchased,
      newToRealPurchased,
    );
    if (!updatedFromUser || !updatedToUser) {
      return { success: false, error: "Errore durante il trasferimento" };
    }
    return { success: true, fromUser: updatedFromUser, toUser: updatedToUser };
  }
  async getTransactions(userId) {
    const result = await db2
      .select()
      .from(transactions2)
      .where(eq(transactions2.userId, userId))
      .orderBy(desc(transactions2.createdAt));
    return result;
  }
  async getTransaction(id) {
    const result = await db2
      .select()
      .from(transactions2)
      .where(eq(transactions2.id, id));
    return result[0];
  }
  async createTransaction(insertTransaction) {
    const result = await db2
      .insert(transactions2)
      .values(insertTransaction)
      .returning();
    return result[0];
  }
  async createMultipleTransactions(insertTransactions) {
    if (insertTransactions.length === 0) return [];
    const result = await db2
      .insert(transactions2)
      .values(insertTransactions)
      .returning();
    return result;
  }
  async updateTransaction(id, updates) {
    const result = await db2
      .update(transactions2)
      .set(updates)
      .where(eq(transactions2.id, id))
      .returning();
    return result[0];
  }
  async deleteUser(userId) {
    try {
      const userConversations = await db2
        .select()
        .from(conversations2)
        .where(eq(conversations2.userId, userId));
      for (const conv of userConversations) {
        await db2
          .delete(messages2)
          .where(eq(messages2.conversationId, conv.id));
      }
      await db2.delete(conversations2).where(eq(conversations2.userId, userId));
      await db2.delete(transactions2).where(eq(transactions2.userId, userId));
      await db2
        .delete(userPresetSettings2)
        .where(eq(userPresetSettings2.userId, userId));
      await db2
        .delete(userCustomPresets2)
        .where(eq(userCustomPresets2.userId, userId));
      await db2.delete(users2).where(eq(users2.id, userId));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  async getPresetSettings(userId) {
    const result = await db2
      .select()
      .from(userPresetSettings2)
      .where(eq(userPresetSettings2.userId, userId));
    return result[0];
  }
  async savePresetSettings(userId, settings) {
    const existing = await this.getPresetSettings(userId);
    if (existing) {
      const result = await db2
        .update(userPresetSettings2)
        .set({
          deletedPresets: settings.deletedPresets
            ? JSON.stringify(settings.deletedPresets)
            : existing.deletedPresets,
          disabledPresets: settings.disabledPresets
            ? JSON.stringify(settings.disabledPresets)
            : existing.disabledPresets,
          customPresets: settings.customPresets
            ? JSON.stringify(settings.customPresets)
            : existing.customPresets,
        })
        .where(eq(userPresetSettings2.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await db2
        .insert(userPresetSettings2)
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
  async getAppSetting(key) {
    const result = await db2
      .select()
      .from(appSettings2)
      .where(eq(appSettings2.key, key));
    return result[0]?.value ?? null;
  }
  async setAppSetting(key, value) {
    const existing = await db2
      .select()
      .from(appSettings2)
      .where(eq(appSettings2.key, key));
    if (existing.length > 0) {
      await db2
        .update(appSettings2)
        .set({ value })
        .where(eq(appSettings2.key, key));
    } else {
      await db2.insert(appSettings2).values({ key, value });
    }
  }
  async updateUserReferredBy(userId, referredBy) {
    const result = await db2
      .update(users2)
      .set({ referredBy })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async updateUserTotalRecharged(userId, amount) {
    const user = await this.getUser(userId);
    if (!user) return void 0;
    const currentTotal = parseFloat(user.totalRecharged || "0");
    const newTotal = (currentTotal + amount).toFixed(2);
    const result = await db2
      .update(users2)
      .set({ totalRecharged: newTotal })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async activateReferral(userId) {
    const result = await db2
      .update(users2)
      .set({ referralActivated: true })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async createReferralActivation(referrerId, referredId, bonusAmount) {
    const result = await db2
      .insert(referralActivations2)
      .values({
        referrerId,
        referredId,
        bonusAmount: bonusAmount.toFixed(2),
      })
      .returning();
    return result[0];
  }
  async getReferralActivations() {
    const activations = await db2
      .select()
      .from(referralActivations2)
      .orderBy(desc(referralActivations2.activatedAt));
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
  async getUserByReferralCode(referralCode) {
    const result = await db2
      .select()
      .from(users2)
      .where(eq(users2.username, referralCode));
    return result[0];
  }
  async blockUser(userId, reason) {
    const result = await db2
      .update(users2)
      .set({ isBlocked: true, blockedReason: reason || null })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async unblockUser(userId) {
    const result = await db2
      .update(users2)
      .set({ isBlocked: false, blockedReason: null })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async setUserBalance(userId, newBalance) {
    const result = await db2
      .update(users2)
      .set({ balance: newBalance })
      .where(eq(users2.id, userId))
      .returning();
    return result[0];
  }
  async getTransferHistory() {
    const result = await db2
      .select()
      .from(transactions2)
      .where(eq(transactions2.isSimulated, false))
      .orderBy(desc(transactions2.createdAt));
    return result;
  }
  async getAllUsersSorted(sortBy) {
    if (sortBy === "balance") {
      const result = await db2
        .select()
        .from(users2)
        .orderBy(desc(users2.balance));
      return result;
    } else {
      const result = await db2
        .select()
        .from(users2)
        .orderBy(desc(users2.createdAt));
      return result;
    }
  }
  // Custom Presets CRUD
  async getCustomPresets(userId) {
    const result = await db2
      .select()
      .from(userCustomPresets2)
      .where(eq(userCustomPresets2.userId, userId))
      .orderBy(desc(userCustomPresets2.createdAt));
    return result;
  }
  async getCustomPreset(id) {
    const result = await db2
      .select()
      .from(userCustomPresets2)
      .where(eq(userCustomPresets2.id, id));
    return result[0];
  }
  async createCustomPreset(preset) {
    const result = await db2
      .insert(userCustomPresets2)
      .values(preset)
      .returning();
    return result[0];
  }
  async updateCustomPreset(id, updates) {
    const result = await db2
      .update(userCustomPresets2)
      .set(updates)
      .where(eq(userCustomPresets2.id, id))
      .returning();
    return result[0];
  }
  async deleteCustomPreset(id) {
    const result = await db2
      .delete(userCustomPresets2)
      .where(eq(userCustomPresets2.id, id))
      .returning();
    return result.length > 0;
  }
  async triggerPresetTransaction(userId, presetId) {
    const preset = await this.getCustomPreset(presetId);
    if (!preset) {
      return { success: false, error: "Preset non trovato" };
    }
    if (preset.userId !== userId) {
      return { success: false, error: "Preset non autorizzato" };
    }
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, error: "Utente non trovato" };
    }
    const amount =
      Math.floor(Math.random() * (preset.maxAmount - preset.minAmount + 1)) +
      preset.minAmount;
    const currentBalance = parseFloat(user.balance || "0");
    const currentPurchased = parseFloat(user.purchasedBalance || "0");
    const realPurchased = parseFloat(user.realPurchasedBalance || "0");
    if (preset.type === "expense") {
      if (realPurchased <= 0) {
        return {
          success: false,
          error: "Saldo Certificato esaurito. Ricarica per continuare.",
        };
      }
      if (amount > realPurchased) {
        return {
          success: false,
          error: `Saldo Certificato insufficiente. Disponibile: ${realPurchased.toFixed(0)} EUR`,
        };
      }
      const newBalance = Math.max(0, currentBalance - amount).toFixed(2);
      const newPurchased = Math.max(0, currentPurchased - amount).toFixed(2);
      const newRealPurchased = (realPurchased - amount).toFixed(2);
      const updatedUser = await this.updateUserAllBalances(
        userId,
        newBalance,
        newPurchased,
        newRealPurchased,
      );
      const transaction = await this.createTransaction({
        userId,
        description: preset.description,
        amount: (-amount).toString(),
        type: "expense",
        category: preset.category,
        isContabilizzato: true,
        isSimulated: false,
      });
      return { success: true, transaction, user: updatedUser };
    } else {
      const totalRecharged = parseFloat(user.totalRecharged || "0");
      const recoveryAvailable = Math.max(0, totalRecharged - realPurchased);
      if (recoveryAvailable <= 0) {
        return {
          success: false,
          error:
            "Saldo Certificato gi\xE0 al massimo. Non puoi aggiungere altre entrate.",
        };
      }
      const cappedAmount = Math.min(amount, recoveryAvailable);
      const newBalance = (currentBalance + cappedAmount).toFixed(2);
      const newPurchased = (currentPurchased + cappedAmount).toFixed(2);
      const newRealPurchased = (realPurchased + cappedAmount).toFixed(2);
      const updatedUser = await this.updateUserAllBalances(
        userId,
        newBalance,
        newPurchased,
        newRealPurchased,
      );
      const transaction = await this.createTransaction({
        userId,
        description: preset.description,
        amount: cappedAmount.toString(),
        type: "income",
        category: preset.category,
        isContabilizzato: true,
        isSimulated: false,
      });
      return { success: true, transaction, user: updatedUser };
    }
  }
};

// server/storage.ts
let storage = new PostgresStorage();
let chatStorage = {
  async getConversation(id) {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq3(conversations.id, id));
    return conversation;
  },
  async getAllConversations(userId) {
    if (userId) {
      return db
        .select()
        .from(conversations)
        .where(eq3(conversations.userId, userId))
        .orderBy(desc3(conversations.createdAt));
    }
    return db
      .select()
      .from(conversations)
      .orderBy(desc3(conversations.createdAt));
  },
  async createConversation(title, userId) {
    const [conversation] = await db
      .insert(conversations)
      .values({
        title,
        userId: userId || null,
      })
      .returning();
    return conversation;
  },
  async deleteConversation(id) {
    await db.delete(messages).where(eq3(messages.conversationId, id));
    await db.delete(conversations).where(eq3(conversations.id, id));
  },
  async getMessagesByConversation(conversationId) {
    return db
      .select()
      .from(messages)
      .where(eq3(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  },
  async createMessage(conversationId, role, content) {
    const [message] = await db
      .insert(messages)
      .values({ conversationId, role, content })
      .returning();
    return message;
  },
};

// server/replit_integrations/chat/routes.ts
let openai = new OpenAI({
  apiKey:
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key-for-local-dev",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
let FINANCIAL_ADVISOR_SYSTEM_PROMPT = `Sei un consulente finanziario AI personale di EquisCash. 
Il tuo nome \xE8 "Assistente EquisCash".

Le tue competenze includono:
- Analisi delle spese e suggerimenti per risparmiare
- Consigli su investimenti e risparmio
- Spiegazioni di prodotti bancari e finanziari
- Suggerimenti per budget mensili
- Consigli su prestiti, mutui e finanziamenti
- Educazione finanziaria generale

Regole importanti:
- Rispondi SEMPRE in italiano
- Sii professionale ma cordiale
- Dai consigli pratici e specifici
- Se non sei sicuro di qualcosa, suggerisci di contattare un consulente umano
- Non dare mai consigli fiscali specifici senza suggerire di consultare un commercialista
- Mantieni le risposte concise e facili da capire
- Usa esempi concreti quando possibile`;
function registerChatRoutes(app2) {
  app2.get("/api/conversations", async (req, res) => {
    try {
      const userId = req.query.userId;
      const conversations3 = await chatStorage.getAllConversations(userId);
      res.json(conversations3);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages3 = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages: messages3 });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  app2.post("/api/conversations", async (req, res) => {
    try {
      const { title, userId } = req.body;
      const conversation = await chatStorage.createConversation(
        title || "Nuova Conversazione",
        userId,
      );
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });
  app2.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });
  app2.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, userContext } = req.body;
      await chatStorage.createMessage(conversationId, "user", content);
      const messages3 =
        await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = [
        {
          role: "system",
          content:
            FINANCIAL_ADVISOR_SYSTEM_PROMPT +
            (userContext
              ? `

Contesto utente: ${userContext}`
              : ""),
        },
        ...messages3.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 1024,
      });
      const assistantResponse =
        completion.choices[0]?.message?.content ||
        "Mi scuso, non sono riuscito a elaborare una risposta.";
      const savedMessage = await chatStorage.createMessage(
        conversationId,
        "assistant",
        assistantResponse,
      );
      res.json({ message: savedMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
}
let openai2 = new OpenAI2({
  apiKey:
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key-for-local-dev",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
let FINANCIAL_NEWS_TOPICS = [
  {
    category: "Mercati",
    icon: "trending-up",
    topics: [
      "Borsa Italiana",
      "FTSE MIB",
      "mercati azionari europei",
      "Wall Street",
    ],
  },
  {
    category: "Economia",
    icon: "globe",
    topics: [
      "PIL Italia",
      "inflazione",
      "BCE tassi interesse",
      "economia europea",
    ],
  },
  {
    category: "Risparmio",
    icon: "piggy-bank",
    topics: [
      "conti deposito",
      "buoni fruttiferi",
      "investimenti sicuri",
      "rendimenti",
    ],
  },
  {
    category: "Banche",
    icon: "building",
    topics: ["banche italiane", "mutui", "prestiti", "fintech"],
  },
  {
    category: "Crypto",
    icon: "cpu",
    topics: ["Bitcoin", "criptovalute", "blockchain", "ETF crypto"],
  },
  {
    category: "Immobiliare",
    icon: "home",
    topics: ["mercato immobiliare", "mutui casa", "affitti", "prezzi case"],
  },
  {
    category: "Lavoro",
    icon: "briefcase",
    topics: ["occupazione Italia", "pensioni", "INPS", "stipendi"],
  },
  {
    category: "Fisco",
    icon: "file-text",
    topics: ["tasse", "dichiarazione redditi", "bonus fiscali", "detrazioni"],
  },
];
async function generatePersonalizedNews(userId, userBalance) {
  let spendingCategories = [];
  if (userId) {
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq4(transactions.userId, userId))
      .orderBy(desc4(transactions.date))
      .limit(50);
    const categoryCount = {};
    userTransactions.forEach((tx) => {
      categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
    });
    spendingCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
  }
  const today = /* @__PURE__ */ new Date();
  const dateStr = today.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const prompt = `Sei un esperto giornalista finanziario italiano. Genera 8 notizie finanziarie realistiche e attuali per un utente di una app bancaria italiana.

Data di oggi: ${dateStr}
Saldo utente: \u20AC${userBalance.toFixed(2)}
Categorie di spesa principali dell'utente: ${spendingCategories.length > 0 ? spendingCategories.join(", ") : "varie"}

Genera notizie personalizzate che siano rilevanti per questo profilo utente. Le notizie devono essere:
- Realistiche e plausibili per il mercato italiano attuale
- Variate tra diverse categorie (mercati, risparmio, economia, banche, immobiliare, lavoro)
- Alcune positive, alcune neutre
- Scritte in modo professionale ma accessibile

Rispondi SOLO con un array JSON valido (senza markdown, senza commenti). Ogni oggetto deve avere:
{
  "title": "titolo breve della notizia (max 80 caratteri)",
  "summary": "riassunto della notizia in 2-3 frasi (max 200 caratteri)",
  "category": "una tra: Mercati, Economia, Risparmio, Banche, Crypto, Immobiliare, Lavoro, Fisco",
  "relevanceScore": numero da 1 a 100 indicante rilevanza per questo utente,
  "source": "nome fonte credibile italiana (es: Il Sole 24 Ore, Milano Finanza, ANSA Economia)"
}`;
  try {
    const completion = await openai2.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2e3,
      temperature: 0.8,
    });
    const content = completion.choices[0]?.message?.content || "[]";
    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const newsItems = JSON.parse(cleanContent);
    return newsItems.map((item, index) => {
      const categoryInfo =
        FINANCIAL_NEWS_TOPICS.find((t) => t.category === item.category) ||
        FINANCIAL_NEWS_TOPICS[0];
      return {
        id: `news-${Date.now()}-${index}`,
        title: item.title,
        summary: item.summary,
        category: item.category,
        relevanceScore: item.relevanceScore,
        source: item.source,
        publishedAt: new Date(
          Date.now() - Math.random() * 24 * 60 * 60 * 1e3,
        ).toISOString(),
        icon: categoryInfo.icon,
      };
    });
  } catch (error) {
    console.error("Error generating news:", error);
    return getDefaultNews();
  }
}
function getDefaultNews() {
  const now = /* @__PURE__ */ new Date();
  return [
    {
      id: "default-1",
      title: "FTSE MIB chiude in rialzo: banche protagoniste",
      summary:
        "La Borsa di Milano chiude positiva trainata dal comparto bancario. I titoli del settore tra i migliori della giornata.",
      category: "Mercati",
      relevanceScore: 85,
      source: "Il Sole 24 Ore",
      publishedAt: now.toISOString(),
      icon: "trending-up",
    },
    {
      id: "default-2",
      title: "BCE: tassi invariati, focus su inflazione",
      summary:
        "La Banca Centrale Europea mantiene i tassi di interesse stabili. Lagarde: 'Monitoreremo attentamente i dati sull'inflazione'.",
      category: "Economia",
      relevanceScore: 90,
      source: "ANSA Economia",
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1e3).toISOString(),
      icon: "globe",
    },
    {
      id: "default-3",
      title: "Conti deposito: rendimenti in aumento",
      summary:
        "Le banche italiane alzano i tassi sui conti deposito. Opportunit\xE0 interessanti per i risparmiatori.",
      category: "Risparmio",
      relevanceScore: 95,
      source: "Milano Finanza",
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1e3).toISOString(),
      icon: "piggy-bank",
    },
    {
      id: "default-4",
      title: "Mercato immobiliare: prezzi stabili nel 2024",
      summary:
        "L'Osservatorio del Mercato Immobiliare conferma la stabilizzazione dei prezzi nelle principali citt\xE0 italiane.",
      category: "Immobiliare",
      relevanceScore: 75,
      source: "Idealista News",
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1e3).toISOString(),
      icon: "home",
    },
  ];
}
function registerNewsRoutes(app2) {
  app2.get("/api/news", async (req, res) => {
    try {
      const userId = req.query.userId;
      const balance = parseFloat(req.query.balance) || 1e3;
      const news = await generatePersonalizedNews(userId || null, balance);
      res.json({
        news: news.sort((a, b) => b.relevanceScore - a.relevanceScore),
        generatedAt: /* @__PURE__ */ new Date().toISOString(),
        personalized: !!userId,
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });
  app2.get("/api/news/categories", (req, res) => {
    res.json(
      FINANCIAL_NEWS_TOPICS.map((t) => ({
        category: t.category,
        icon: t.icon,
      })),
    );
  });
}

// shared/presets.ts
let DEFAULT_PRESETS = [];

// server/routes.ts
function generateRandomTransaction(
  userId,
  currentBalance,
  purchasedBalance,
  userSettings,
) {
  const now = /* @__PURE__ */ new Date();
  const isExpense = true;
  const excludeDescriptions = [
    ...userSettings.deletedPresets,
    ...userSettings.disabledPresets,
  ];
  let availablePresets = DEFAULT_PRESETS.filter((p) => {
    if (p.type !== "expense") return false;
    if (excludeDescriptions.includes(p.description)) return false;
    return true;
  });
  const customExpensePresets = userSettings.customPresets.filter(
    (p) => p.type === "expense",
  );
  availablePresets = [...availablePresets, ...customExpensePresets];
  if (availablePresets.length === 0) {
    return null;
  }
  const preset =
    availablePresets[Math.floor(Math.random() * availablePresets.length)];
  let amount;
  if (preset.fixedAmounts && preset.fixedAmounts.length > 0) {
    amount =
      preset.fixedAmounts[
        Math.floor(Math.random() * preset.fixedAmounts.length)
      ];
  } else {
    amount = Math.round(
      Math.random() * (preset.maxAmount - preset.minAmount) + preset.minAmount,
    );
  }
  const wasCapped = false;
  const cappedMessage = void 0;
  const isContabilizzato = Math.random() > 0.15;
  return {
    userId,
    description: preset.description,
    amount: amount.toFixed(0) + ".00",
    type: preset.type,
    category: preset.category,
    accountNumber: null,
    isContabilizzato,
    isSimulated: true,
    date: new Date(now),
    wasCapped,
    cappedMessage,
  };
}
async function registerRoutes(app2) {
  app2.use("/api", (req, res, next) => {
    if (req.path === "/server-date") return next();
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({
        error: "Server non configurato: DATABASE_URL mancante",
      });
    }
    next();
  });
  registerChatRoutes(app2);
  registerNewsRoutes(app2);
  app2.get("/api/server-date", (req, res) => {
    const now = /* @__PURE__ */ new Date();
    const romeFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = romeFormatter.formatToParts(now);
    const romeDateStr = `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}T${parts.find((p) => p.type === "hour")?.value}:${parts.find((p) => p.type === "minute")?.value}:${parts.find((p) => p.type === "second")?.value}`;
    return res.json({
      date: now.toISOString(),
      romeDate: romeDateStr,
      timestamp: now.getTime(),
      timezone: "Europe/Rome",
      currentMonth: parseInt(
        parts.find((p) => p.type === "month")?.value || "1",
      ),
      currentYear: parseInt(
        parts.find((p) => p.type === "year")?.value || "2026",
      ),
      currentDay: parseInt(parts.find((p) => p.type === "day")?.value || "1"),
    });
  });
  app2.post("/api/auth/login", async (req, res) => {
    const { username, referralCode } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username richiesto" });
    }
    let user = await storage.getUserByUsername(username);
    let isNewUser = false;
    if (!user) {
      const rechargeUsername =
        username
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
          .substring(0, 15) +
        "_" +
        Math.floor(Math.random() * 1e3)
          .toString()
          .padStart(3, "0");
      user = await storage.createUser({
        username,
        pin: "00000",
        hasSetPin: false,
        fullName: username.toUpperCase(),
        accountNumber: `1000/${Math.floor(Math.random() * 1e5)
          .toString()
          .padStart(8, "0")}`,
        balance: "10.00",
        purchasedBalance: "0.00",
        realPurchasedBalance: "0.00",
        cardLastFour: Math.floor(Math.random() * 1e4)
          .toString()
          .padStart(4, "0"),
        rechargeUsername,
      });
      isNewUser = true;
      if (referralCode && referralCode.trim()) {
        const referrer = await storage.getUserByReferralCode(
          referralCode.trim(),
        );
        if (referrer && referrer.id !== user.id) {
          await storage.updateUserReferredBy(user.id, referrer.id);
        }
      }
    }
    return res.json({
      userId: user.id,
      username: user.username,
      needsSetup: isNewUser || !user.hasSetPin,
    });
  });
  app2.post("/api/auth/setup-pin", async (req, res) => {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ error: "UserId e PIN richiesti" });
    }
    if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
      return res.status(400).json({ error: "Il PIN deve essere di 5 cifre" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    await storage.updateUserPin(userId, pin);
    const updatedUser = await storage.getUser(userId);
    return res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        rechargeUsername: updatedUser.rechargeUsername,
        fullName: updatedUser.fullName,
        accountNumber: updatedUser.accountNumber,
        balance: updatedUser.balance,
        purchasedBalance: updatedUser.purchasedBalance,
        cardLastFour: updatedUser.cardLastFour,
      },
    });
  });
  app2.post("/api/auth/set-recharge-username", async (req, res) => {
    const { userId, rechargeUsername } = req.body;
    if (!userId || !rechargeUsername) {
      return res
        .status(400)
        .json({ error: "UserId e username di ricarica richiesti" });
    }
    const trimmedUsername = rechargeUsername.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      return res
        .status(400)
        .json({ error: "L'username deve essere di almeno 3 caratteri" });
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({
        error: "L'username puo contenere solo lettere, numeri e underscore",
      });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    if (user.rechargeUsername) {
      return res.status(400).json({
        error:
          "L'username di ricarica e gia stato impostato e non puo essere modificato",
      });
    }
    const existingUser =
      await storage.getUserByRechargeUsername(trimmedUsername);
    if (existingUser) {
      return res.status(400).json({ error: "Questo username e gia in uso" });
    }
    await storage.setUserRechargeUsername(userId, trimmedUsername);
    return res.json({ success: true });
  });
  app2.post("/api/check-recharge-username", async (req, res) => {
    const { rechargeUsername } = req.body;
    if (!rechargeUsername) {
      return res.status(400).json({ available: false });
    }
    const trimmedUsername = rechargeUsername.trim().toLowerCase();
    const existingUser =
      await storage.getUserByRechargeUsername(trimmedUsername);
    return res.json({ available: !existingUser });
  });
  app2.post("/api/auth/verify-pin", async (req, res) => {
    const { userId, pin } = req.body;
    if (!userId || !pin) {
      return res.status(400).json({ error: "UserId e PIN richiesti" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    if (user.pin !== pin) {
      return res.status(401).json({ error: "PIN non valido" });
    }
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        rechargeUsername: user.rechargeUsername,
        fullName: user.fullName,
        displayName: user.displayName,
        accountNumber: user.accountNumber,
        balance: user.balance,
        purchasedBalance: user.purchasedBalance,
        realPurchasedBalance: user.realPurchasedBalance,
        customMonthlyExpenses: user.customMonthlyExpenses,
        customMonthlyIncome: user.customMonthlyIncome,
        cardLastFour: user.cardLastFour,
      },
    });
  });
  app2.get("/api/user/:userId", async (req, res) => {
    const { userId } = req.params;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    return res.json({
      id: user.id,
      username: user.username,
      rechargeUsername: user.rechargeUsername,
      fullName: user.fullName,
      displayName: user.displayName,
      accountNumber: user.accountNumber,
      balance: user.balance,
      purchasedBalance: user.purchasedBalance,
      realPurchasedBalance: user.realPurchasedBalance,
      customMonthlyExpenses: user.customMonthlyExpenses,
      customMonthlyIncome: user.customMonthlyIncome,
      cardLastFour: user.cardLastFour,
    });
  });
  app2.put("/api/user/:userId/balance", async (req, res) => {
    const { userId } = req.params;
    const { balance } = req.body;
    if (balance === void 0) {
      return res.status(400).json({ error: "Saldo richiesto" });
    }
    const user = await storage.updateUserBalance(userId, balance.toString());
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    return res.json({
      id: user.id,
      balance: user.balance,
    });
  });
  app2.put("/api/user/:userId/name", async (req, res) => {
    const { userId } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nome richiesto" });
    }
    const user = await storage.updateUserName(userId, name);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    return res.json({
      id: user.id,
      fullName: user.fullName,
    });
  });
  app2.put("/api/user/:userId/account-number", async (req, res) => {
    const { userId } = req.params;
    const { accountNumber } = req.body;
    if (!accountNumber) {
      return res.status(400).json({ error: "Numero conto richiesto" });
    }
    const user = await storage.updateUserAccountNumber(userId, accountNumber);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    return res.json({
      id: user.id,
      accountNumber: user.accountNumber,
    });
  });
  app2.put("/api/user/:userId/display-name", async (req, res) => {
    const { userId } = req.params;
    const { displayName } = req.body;
    const user = await storage.updateUserDisplayName(
      userId,
      displayName || null,
    );
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    return res.json({
      id: user.id,
      displayName: user.displayName,
    });
  });
  app2.put("/api/user/:userId/monthly-values", async (req, res) => {
    const { userId } = req.params;
    const { customMonthlyExpenses, customMonthlyIncome } = req.body;
    const user = await storage.updateUserMonthlyValues(
      userId,
      customMonthlyExpenses || null,
      customMonthlyIncome || null,
    );
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    return res.json({
      id: user.id,
      customMonthlyExpenses: user.customMonthlyExpenses,
      customMonthlyIncome: user.customMonthlyIncome,
    });
  });
  app2.get("/api/transactions/:userId", async (req, res) => {
    const { userId } = req.params;
    const transactions3 = await storage.getTransactions(userId);
    return res.json(transactions3);
  });
  app2.post("/api/transactions/:userId/generate-random", async (req, res) => {
    const { userId } = req.params;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    const dbCustomPresets = await storage.getCustomPresets(userId);
    const customPresetsForRandom = dbCustomPresets
      .filter((p) => p.isEnabled && p.type === "expense")
      .map((p) => ({
        description: p.description,
        type: p.type,
        category: p.category,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
        isCustom: true,
      }));
    const userSettings = {
      deletedPresets: [],
      disabledPresets: [],
      customPresets: customPresetsForRandom,
    };
    const currentBalance = parseFloat(user.balance || "0");
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    const transaction = generateRandomTransaction(
      userId,
      currentBalance,
      purchasedBalance,
      userSettings,
    );
    if (!transaction) {
      return res.json({
        transaction: null,
        newBalance: user.balance,
        message:
          "Nessun preset disponibile. Crea dei preset per generare transazioni casuali.",
      });
    }
    const { wasCapped, cappedMessage, ...transactionData } = transaction;
    const created = await storage.createTransaction(transactionData);
    const amountValue = parseFloat(transaction.amount);
    const balanceChange =
      transaction.type === "expense" ? -amountValue : amountValue;
    const newBalance =
      Math.round(currentBalance + balanceChange).toFixed(0) + ".00";
    const newPurchasedBalance = Math.max(
      0,
      purchasedBalance + balanceChange,
    ).toFixed(2);
    await storage.updateUserBalanceWithPurchased(
      userId,
      newBalance,
      newPurchasedBalance,
    );
    return res.json({
      transaction: created,
      newBalance,
      wasCapped,
      cappedMessage,
    });
  });
  app2.post("/api/transactions", async (req, res) => {
    const transaction = req.body;
    if (
      !transaction.userId ||
      !transaction.description ||
      !transaction.amount
    ) {
      return res.status(400).json({ error: "Dati transazione incompleti" });
    }
    const user = await storage.getUser(transaction.userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    const currentBalance = parseFloat(user.balance || "0");
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    const realPurchasedBalance = parseFloat(user.realPurchasedBalance || "0");
    const recoveryAvailability = Math.max(
      0,
      realPurchasedBalance - currentBalance,
    );
    let amount = Math.abs(parseFloat(transaction.amount));
    let wasCapped = false;
    if (transaction.type === "income") {
      if (recoveryAvailability <= 0) {
        return res.status(403).json({
          error: "Saldo gi\xE0 al massimo. Non puoi aggiungere altre entrate.",
          recoveryAvailability: 0,
        });
      }
      if (amount > recoveryAvailability) {
        amount = Math.floor(recoveryAvailability);
        wasCapped = true;
      }
    }
    amount = Math.floor(amount);
    if (transaction.date && typeof transaction.date === "string") {
      transaction.date = new Date(transaction.date);
    }
    transaction.amount = amount.toFixed(0) + ".00";
    transaction.isSimulated = true;
    const created = await storage.createTransaction(transaction);
    const balanceChange = transaction.type === "expense" ? -amount : amount;
    const newBalance =
      Math.floor(currentBalance + balanceChange).toFixed(0) + ".00";
    const newPurchasedBalance = Math.max(
      0,
      purchasedBalance + balanceChange,
    ).toFixed(2);
    await storage.updateUserBalanceWithPurchased(
      user.id,
      newBalance,
      newPurchasedBalance,
    );
    return res.json({
      transaction: created,
      newBalance,
      wasCapped,
      cappedMessage: wasCapped
        ? "Importo limitato al saldo reale disponibile"
        : void 0,
      recoveryAvailability: Math.max(
        0,
        realPurchasedBalance - parseFloat(newBalance),
      ),
    });
  });
  app2.post("/api/transactions/certified-expense", async (req, res) => {
    const { userId, description, amount, category } = req.body;
    if (!userId || !description || !amount) {
      return res.status(400).json({ error: "Dati mancanti" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    const expenseAmount = Math.floor(Math.abs(amount));
    if (expenseAmount <= 0) {
      return res.status(400).json({ error: "Importo non valido" });
    }
    const currentBalance = parseFloat(user.balance || "0");
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    const realPurchased = parseFloat(user.realPurchasedBalance || "0");
    if (currentBalance <= 0) {
      return res
        .status(400)
        .json({ error: "Saldo insufficiente per registrare l'uscita." });
    }
    const actualExpense = Math.min(expenseAmount, Math.floor(currentBalance));
    const newBalance = Math.max(0, currentBalance - actualExpense).toFixed(2);
    const newPurchased = Math.max(0, purchasedBalance - actualExpense).toFixed(
      2,
    );
    await storage.updateUserBalanceWithPurchased(
      userId,
      newBalance,
      newPurchased,
    );
    const updatedUser = await storage.getUser(userId);
    const transaction = await storage.createTransaction({
      userId,
      description,
      amount: (-actualExpense).toString(),
      type: "expense",
      category: category || "Altre uscite",
      isContabilizzato: true,
      isSimulated: false,
    });
    const newRecoveryMargin = Math.max(
      0,
      realPurchased - parseFloat(newBalance),
    );
    return res.json({
      success: true,
      transaction,
      user: updatedUser,
      recoveryMargin: newRecoveryMargin,
    });
  });
  app2.get("/api/transactions/:userId/expense-templates", async (req, res) => {
    const { userId } = req.params;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    const transactions3 = await storage.getTransactions(userId);
    const manualExpenses = transactions3.filter(
      (t) => t.type === "expense" && t.isSimulated === false,
    );
    const templates = /* @__PURE__ */ new Map();
    for (const tx of manualExpenses) {
      const key = tx.description;
      if (!templates.has(key)) {
        templates.set(key, {
          description: tx.description,
          category: tx.category || "Altre uscite",
          avgAmount: Math.abs(parseFloat(tx.amount || "0")),
        });
      }
    }
    return res.json({ templates: Array.from(templates.values()) });
  });
  app2.post("/api/transactions/generate-from-template", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Dati mancanti" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    const realPurchased = parseFloat(user.realPurchasedBalance || "0");
    if (realPurchased <= 0) {
      return res.status(400).json({
        error: "Saldo Certificato esaurito. Ricarica per continuare.",
      });
    }
    const transactions3 = await storage.getTransactions(userId);
    const manualExpenses = transactions3.filter(
      (t) => t.type === "expense" && t.isSimulated === false,
    );
    if (manualExpenses.length === 0) {
      return res.status(400).json({
        error:
          "Nessun modello disponibile. Crea prima delle uscite manuali nella Console.",
      });
    }
    const template =
      manualExpenses[Math.floor(Math.random() * manualExpenses.length)];
    const baseAmount = Math.abs(parseFloat(template.amount || "0"));
    const variation = 0.3;
    const minAmount = Math.max(1, Math.floor(baseAmount * (1 - variation)));
    const maxAmount = Math.floor(baseAmount * (1 + variation));
    let randomAmount =
      Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    randomAmount = Math.min(randomAmount, Math.floor(realPurchased));
    if (randomAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Saldo Certificato insufficiente." });
    }
    const currentBalance = parseFloat(user.balance || "0");
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    const newBalance = Math.max(0, currentBalance - randomAmount).toFixed(2);
    const newPurchased = Math.max(0, purchasedBalance - randomAmount).toFixed(
      2,
    );
    const newRealPurchased = (realPurchased - randomAmount).toFixed(2);
    const updatedUser = await storage.updateUserAllBalances(
      userId,
      newBalance,
      newPurchased,
      newRealPurchased,
    );
    const transaction = await storage.createTransaction({
      userId,
      description: template.description,
      amount: (-randomAmount).toString(),
      type: "expense",
      category: template.category || "Altre uscite",
      isContabilizzato: true,
      isSimulated: false,
    });
    return res.json({
      success: true,
      transaction,
      user: updatedUser,
      templateUsed: template.description,
      originalAmount: baseAmount,
      generatedAmount: randomAmount,
    });
  });
  app2.put("/api/transactions/:transactionId", async (req, res) => {
    const { transactionId } = req.params;
    const { amount, description } = req.body;
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transazione non trovata" });
    }
    const updates = {};
    if (amount !== void 0) updates.amount = amount;
    if (description !== void 0) updates.description = description;
    const updated = await storage.updateTransaction(transactionId, updates);
    return res.json(updated);
  });
  app2.get("/api/users/:userId/preset-settings", async (req, res) => {
    const { userId } = req.params;
    const settings = await storage.getPresetSettings(userId);
    if (!settings) {
      return res.json({
        deletedPresets: [],
        disabledPresets: [],
        customPresets: [],
      });
    }
    return res.json({
      deletedPresets: JSON.parse(settings.deletedPresets),
      disabledPresets: JSON.parse(settings.disabledPresets),
      customPresets: JSON.parse(settings.customPresets),
    });
  });
  app2.post("/api/users/:userId/preset-settings", async (req, res) => {
    const { userId } = req.params;
    const { deletedPresets, disabledPresets, customPresets } = req.body;
    const settings = await storage.savePresetSettings(userId, {
      deletedPresets,
      disabledPresets,
      customPresets,
    });
    return res.json({
      deletedPresets: JSON.parse(settings.deletedPresets),
      disabledPresets: JSON.parse(settings.disabledPresets),
      customPresets: JSON.parse(settings.customPresets),
    });
  });
  app2.get("/api/users/:userId/custom-presets", async (req, res) => {
    const { userId } = req.params;
    const presets = await storage.getCustomPresets(userId);
    return res.json(presets);
  });
  app2.post("/api/users/:userId/custom-presets", async (req, res) => {
    const { userId } = req.params;
    const { description, type, category, minAmount, maxAmount } = req.body;
    if (
      !description ||
      !category ||
      minAmount === void 0 ||
      maxAmount === void 0
    ) {
      return res.status(400).json({ error: "Dati mancanti" });
    }
    const preset = await storage.createCustomPreset({
      userId,
      description,
      type: type || "expense",
      category,
      minAmount: parseInt(minAmount),
      maxAmount: parseInt(maxAmount),
      isEnabled: true,
    });
    return res.json(preset);
  });
  app2.put("/api/users/:userId/custom-presets/:presetId", async (req, res) => {
    const { userId, presetId } = req.params;
    const { description, type, category, minAmount, maxAmount, isEnabled } =
      req.body;
    const existing = await storage.getCustomPreset(parseInt(presetId));
    if (!existing) {
      return res.status(404).json({ error: "Preset non trovato" });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: "Non autorizzato" });
    }
    const updated = await storage.updateCustomPreset(parseInt(presetId), {
      description,
      type,
      category,
      minAmount: minAmount !== void 0 ? parseInt(minAmount) : void 0,
      maxAmount: maxAmount !== void 0 ? parseInt(maxAmount) : void 0,
      isEnabled,
    });
    return res.json(updated);
  });
  app2.delete(
    "/api/users/:userId/custom-presets/:presetId",
    async (req, res) => {
      const { userId, presetId } = req.params;
      const existing = await storage.getCustomPreset(parseInt(presetId));
      if (!existing) {
        return res.status(404).json({ error: "Preset non trovato" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Non autorizzato" });
      }
      await storage.deleteCustomPreset(parseInt(presetId));
      return res.json({ success: true });
    },
  );
  app2.post(
    "/api/users/:userId/custom-presets/:presetId/trigger",
    async (req, res) => {
      const { userId, presetId } = req.params;
      const result = await storage.triggerPresetTransaction(
        userId,
        parseInt(presetId),
      );
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.json({
        success: true,
        transaction: result.transaction,
        user: result.user,
      });
    },
  );
  app2.get("/api/users", async (req, res) => {
    const allUsers = await storage.getAllUsers();
    const sanitizedUsers = allUsers.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      accountNumber: user.accountNumber,
      balance: user.balance,
    }));
    return res.json(sanitizedUsers);
  });
  app2.get("/api/users/list", async (req, res) => {
    const { exclude } = req.query;
    const allUsers = await storage.getAllUsers();
    const filteredUsers = allUsers
      .filter((u) => !u.isBlocked)
      .filter((u) => (exclude ? u.id !== exclude : true))
      .map((u) => ({
        id: u.id,
        username: u.rechargeUsername || u.username,
        fullName: u.fullName,
        displayName: u.displayName,
        accountNumber: u.accountNumber,
      }));
    return res.json(filteredUsers);
  });
  app2.get("/api/users/search/:username", async (req, res) => {
    const { username } = req.params;
    const { partial } = req.query;
    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: "Username richiesto" });
    }
    if (partial === "true") {
      const users3 = await storage.searchUsersByPartialUsername(
        username.trim(),
      );
      const filtered = users3
        .filter((u) => !u.isBlocked)
        .map((u) => ({
          id: u.id,
          username: u.rechargeUsername || u.username,
          fullName: u.fullName,
          displayName: u.displayName,
          accountNumber: u.accountNumber,
        }));
      return res.json(filtered);
    }
    const user = await storage.getUserByUsername(username.trim());
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    if (user.isBlocked) {
      return res
        .status(403)
        .json({ error: "Questo utente non pu\xF2 ricevere trasferimenti" });
    }
    return res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      accountNumber: user.accountNumber,
    });
  });
  app2.post("/api/transfer", async (req, res) => {
    const { fromUserId, toUserId, amount } = req.body;
    if (!fromUserId || !toUserId || amount === void 0) {
      return res.status(400).json({ success: false, error: "Dati mancanti" });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
      return res.status(400).json({
        success: false,
        error: "L'importo deve essere un numero intero positivo",
      });
    }
    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        error: "Non puoi trasferire denaro a te stesso",
      });
    }
    const fromUser = await storage.getUser(fromUserId);
    if (!fromUser) {
      return res
        .status(404)
        .json({ success: false, error: "Utente non trovato" });
    }
    const serverBalance = parseFloat(fromUser.balance || "0");
    if (amountNum > serverBalance) {
      return res
        .status(400)
        .json({ success: false, error: "Saldo insufficiente" });
    }
    const result = await storage.transferBalance(
      fromUserId,
      toUserId,
      amountNum,
    );
    if (!result.success) {
      return res.status(400).json(result);
    }
    const now = /* @__PURE__ */ new Date();
    const toUser = await storage.getUser(toUserId);
    await storage.createTransaction({
      userId: fromUserId,
      description: `Trasferimento a ${toUser?.fullName || toUser?.username || "Utente"}`,
      amount: amount.toString(),
      type: "expense",
      category: "Trasferimenti",
      accountNumber: toUser?.accountNumber || null,
      isContabilizzato: true,
      isSimulated: false,
      date: now,
    });
    await storage.createTransaction({
      userId: toUserId,
      description: `Trasferimento da ${fromUser.fullName || fromUser.username}`,
      amount: amount.toString(),
      type: "income",
      category: "Trasferimenti",
      accountNumber: fromUser.accountNumber || null,
      isContabilizzato: true,
      isSimulated: false,
      date: now,
    });
    return res.json(result);
  });
  app2.post("/api/admin/search-user", async (req, res) => {
    const { adminPassword, username } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    if (!username) {
      return res.status(400).json({ error: "Username richiesto" });
    }
    const cleanUsername = username.trim().replace(/^@/, "");
    const user = await storage.getUserByUsername(cleanUsername);
    if (!user) {
      return res
        .status(404)
        .json({ error: "Utente non trovato con questo username" });
    }
    return res.json({
      id: user.id,
      username: user.username,
      accountNumber: user.accountNumber,
      fullName: user.fullName,
      balance: user.balance,
    });
  });
  app2.post("/api/admin/topup", async (req, res) => {
    const { adminPassword, username, amount } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    if (!username || !amount) {
      return res.status(400).json({ error: "Username e importo richiesti" });
    }
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res
        .status(400)
        .json({ error: "L'importo deve essere un numero intero positivo" });
    }
    const cleanUsername = username.trim().replace(/^@/, "");
    const user = await storage.getUserByUsername(cleanUsername);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    const currentBalance = parseFloat(user.balance || "0");
    const currentPurchasedBalance = parseFloat(user.purchasedBalance || "0");
    const currentRealPurchased = parseFloat(user.realPurchasedBalance || "0");
    const previousTotalRecharged = parseFloat(user.totalRecharged || "0");
    const newBalance = (currentBalance + amountNum).toFixed(2);
    const newPurchasedBalance = (currentPurchasedBalance + amountNum).toFixed(
      2,
    );
    const newRealPurchased = (currentRealPurchased + amountNum).toFixed(2);
    await storage.updateUserAllBalances(
      user.id,
      newBalance,
      newPurchasedBalance,
      newRealPurchased,
    );
    await storage.updateUserTotalRecharged(user.id, amountNum);
    await storage.createTransaction({
      userId: user.id,
      description: "Ricarica PayPal",
      amount: amountNum.toString() + ".00",
      type: "income",
      category: "Ricariche",
      accountNumber: null,
      isContabilizzato: true,
      isSimulated: false,
      date: /* @__PURE__ */ new Date(),
    });
    const newTotalRecharged = previousTotalRecharged + amountNum;
    let referralBonusAwarded = false;
    let referrerName = "";
    if (
      previousTotalRecharged < 2 &&
      newTotalRecharged >= 2 &&
      user.referredBy &&
      !user.referralActivated
    ) {
      const referrer = await storage.getUser(user.referredBy);
      if (referrer) {
        const bonusStr = await storage.getAppSetting("referral_bonus");
        const bonusAmount = bonusStr ? parseInt(bonusStr) : 200;
        const referrerBalance = parseFloat(referrer.balance || "0");
        const referrerPurchased = parseFloat(referrer.purchasedBalance || "0");
        const referrerRealPurchased = parseFloat(
          referrer.realPurchasedBalance || "0",
        );
        const newReferrerBalance = (referrerBalance + bonusAmount).toFixed(2);
        const newReferrerPurchased = (referrerPurchased + bonusAmount).toFixed(
          2,
        );
        const newReferrerRealPurchased = (
          referrerRealPurchased + bonusAmount
        ).toFixed(2);
        await storage.updateUserAllBalances(
          referrer.id,
          newReferrerBalance,
          newReferrerPurchased,
          newReferrerRealPurchased,
        );
        await storage.createTransaction({
          userId: referrer.id,
          description: `Bonus Referral da ${user.username}`,
          amount: bonusAmount.toString() + ".00",
          type: "income",
          category: "Bonus",
          accountNumber: null,
          isContabilizzato: true,
          isSimulated: false,
          date: /* @__PURE__ */ new Date(),
        });
        await storage.createReferralActivation(
          referrer.id,
          user.id,
          bonusAmount,
        );
        await storage.activateReferral(user.id);
        referralBonusAwarded = true;
        referrerName = referrer.fullName || referrer.username;
      }
    }
    const updatedUser = await storage.getUser(user.id);
    return res.json({
      success: true,
      user: {
        fullName: updatedUser.fullName,
        rechargeUsername: updatedUser.rechargeUsername,
        newBalance: updatedUser.balance,
        purchasedBalance: updatedUser.purchasedBalance,
        totalRecharged: updatedUser.totalRecharged,
      },
      referralBonusAwarded,
      referrerName: referralBonusAwarded ? referrerName : void 0,
    });
  });
  app2.get("/api/admin/referral-settings", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"];
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    const bonusStr = await storage.getAppSetting("referral_bonus");
    return res.json({ referralBonus: bonusStr ? parseInt(bonusStr) : 200 });
  });
  app2.post("/api/admin/referral-settings", async (req, res) => {
    const { adminPassword, referralBonus } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    const bonus = parseInt(referralBonus);
    if (isNaN(bonus) || bonus < 0) {
      return res
        .status(400)
        .json({ error: "Il bonus deve essere un numero positivo" });
    }
    await storage.setAppSetting("referral_bonus", bonus.toString());
    return res.json({ success: true, referralBonus: bonus });
  });
  app2.get("/api/admin/referral-activations", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"];
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    const activations = await storage.getReferralActivations();
    return res.json(activations);
  });
  app2.get("/api/admin/users", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"];
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    const sortBy = req.query.sortBy === "balance" ? "balance" : "newest";
    const allUsers = await storage.getAllUsersSorted(sortBy);
    const sanitizedUsers = allUsers.map((user) => ({
      id: user.id,
      username: user.username,
      rechargeUsername: user.rechargeUsername,
      fullName: user.fullName,
      accountNumber: user.accountNumber,
      balance: user.balance,
      purchasedBalance: user.purchasedBalance,
      realPurchasedBalance: user.realPurchasedBalance,
      totalRecharged: user.totalRecharged,
      isBlocked: user.isBlocked,
      blockedReason: user.blockedReason,
      createdAt: user.createdAt,
    }));
    return res.json(sanitizedUsers);
  });
  app2.post("/api/admin/block-user", async (req, res) => {
    const { adminPassword, userId, reason } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    if (!userId) {
      return res.status(400).json({ error: "ID utente richiesto" });
    }
    const user = await storage.blockUser(userId, reason);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    return res.json({
      success: true,
      user: { id: user.id, username: user.username, isBlocked: user.isBlocked },
    });
  });
  app2.post("/api/admin/unblock-user", async (req, res) => {
    const { adminPassword, userId } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    if (!userId) {
      return res.status(400).json({ error: "ID utente richiesto" });
    }
    const user = await storage.unblockUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    return res.json({
      success: true,
      user: { id: user.id, username: user.username, isBlocked: user.isBlocked },
    });
  });
  app2.post("/api/admin/delete-user", async (req, res) => {
    const { adminPassword, userId } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    if (!userId) {
      return res.status(400).json({ error: "ID utente richiesto" });
    }
    const success = await storage.deleteUser(userId);
    if (!success) {
      return res
        .status(500)
        .json({ error: "Errore durante l'eliminazione dell'utente" });
    }
    return res.json({
      success: true,
      message: "Utente eliminato con successo",
    });
  });
  app2.get("/api/admin/user-transfers/:userId", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"];
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    const { userId } = req.params;
    const allTransactions = await storage.getTransactions(userId);
    const transfers = allTransactions.filter(
      (tx) => tx.category === "Trasferimenti" && tx.isSimulated === false,
    );
    transfers.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    return res.json(transfers);
  });
  app2.post("/api/admin/set-balance", async (req, res) => {
    const { adminPassword, userId, newBalance } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    if (!userId || newBalance === void 0) {
      return res
        .status(400)
        .json({ error: "ID utente e nuovo saldo richiesti" });
    }
    const balanceNum = parseFloat(newBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      return res
        .status(400)
        .json({ error: "Il saldo deve essere un numero positivo" });
    }
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    const balanceStr = balanceNum.toFixed(2);
    const updatedUser = await storage.updateUserAllBalances(
      userId,
      balanceStr,
      balanceStr,
      balanceStr,
    );
    if (!updatedUser) {
      return res
        .status(500)
        .json({ error: "Errore durante l'aggiornamento del saldo" });
    }
    return res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        balance: updatedUser.balance,
        realPurchasedBalance: updatedUser.realPurchasedBalance,
      },
    });
  });
  app2.get("/api/admin/transfers", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"];
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    const transfers = await storage.getTransferHistory();
    const enrichedTransfers = [];
    for (const transfer of transfers) {
      const user = await storage.getUser(transfer.userId);
      enrichedTransfers.push({
        ...transfer,
        username: user?.username || "Sconosciuto",
        fullName: user?.fullName || "Sconosciuto",
      });
    }
    return res.json(enrichedTransfers);
  });
  app2.post("/api/bonifico", async (req, res) => {
    const { userId, destinatario, iban, amount, causale, bonificoIstantaneo } =
      req.body;
    if (!userId || !destinatario || !iban || !amount) {
      return res.status(400).json({ error: "Dati mancanti per il bonifico" });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: "Importo non valido" });
    }
    const COMMISSION_FEE = 1;
    const totalCost = amountNum + COMMISSION_FEE;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    const activeBalance = parseFloat(user.balance || "0");
    if (totalCost > activeBalance) {
      return res.status(400).json({
        error: `Saldo Attivo insufficiente. Disponibile: ${activeBalance.toFixed(2)} EUR, Richiesto: ${totalCost.toFixed(2)} EUR`,
      });
    }
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    const realPurchasedBalance = parseFloat(user.realPurchasedBalance || "0");
    const newBalance = (activeBalance - totalCost).toFixed(2);
    const newPurchasedBalance = (purchasedBalance - totalCost).toFixed(2);
    const newRealPurchasedBalance = realPurchasedBalance.toFixed(2);
    await storage.updateUserAllBalances(
      userId,
      newBalance,
      newPurchasedBalance,
      newRealPurchasedBalance,
    );
    const now = /* @__PURE__ */ new Date();
    const italianFormatter = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedDate = italianFormatter.format(now);
    const dateForFilename = formattedDate.replace(/\//g, ".");
    const operationNumber = `INTER${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}BOSBE${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const trn = `0${Math.floor(Math.random() * 1e18)
      .toString()
      .substring(0, 18)}`;
    const transactionDescription = causale || `Bonifico a ${destinatario}`;
    await storage.createTransaction({
      userId,
      description: transactionDescription,
      amount: (-amountNum).toFixed(2),
      type: "expense",
      category: "Bonifici",
      accountNumber: iban,
      isContabilizzato: true,
      isSimulated: false,
      date: now,
    });
    await storage.createTransaction({
      userId,
      description: `Commissione bonifico`,
      amount: (-COMMISSION_FEE).toFixed(2),
      type: "expense",
      category: "Commissioni",
      accountNumber: null,
      isContabilizzato: true,
      isSimulated: false,
      date: now,
    });
    const receiptDateFormatter = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const receiptDate = receiptDateFormatter.format(now).toUpperCase();
    const receipt = {
      operationNumber,
      trn,
      date: receiptDate,
      dateExecution: dateForFilename,
      senderName: user.fullName,
      accountNumber: user.accountNumber,
      destinatario,
      iban,
      amount: amountNum,
      commission: COMMISSION_FEE,
      totalAmount: totalCost,
      causale: causale || "Bonifico",
      bonificoIstantaneo,
      banca: "EQUISBANK SPA",
      bicSwift: "BCTITMM1XXX",
    };
    return res.json({
      success: true,
      receipt,
      newBalance,
      newRealPurchasedBalance,
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}
let app = express();
let log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    if (process.env.EXPO_PUBLIC_DOMAIN) {
      origins.add(process.env.EXPO_PUBLIC_DOMAIN);
    }
    origins.add("http://localhost:8081");
    origins.add("http://localhost:5000");
    origins.add("http://127.0.0.1:8081");
    origins.add("http://127.0.0.1:5000");
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );
  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({ req, res, landingPageTemplate, appName }) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const adminTemplatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "admin.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const adminPageTemplate = fs.readFileSync(adminTemplatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path === "/admin") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(adminPageTemplate);
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`express server serving on port ${port}`);
  });
})();
