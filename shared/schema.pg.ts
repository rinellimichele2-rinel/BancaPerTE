import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  username: text("username").notNull().unique(),
  rechargeUsername: text("recharge_username").unique(),
  pin: text("pin").notNull(),
  hasSetPin: boolean("has_set_pin").notNull().default(false),
  fullName: text("full_name").notNull(),
  accountNumber: text("account_number").notNull(),
  balance: text("balance").notNull().default("0.00"),
  purchasedBalance: text("purchased_balance").notNull().default("0.00"),
  realPurchasedBalance: text("real_purchased_balance")
    .notNull()
    .default("0.00"),
  totalRecharged: text("total_recharged").notNull().default("0.00"),
  referredBy: text("referred_by"),
  referralActivated: boolean("referral_activated").notNull().default(false),
  cardLastFour: text("card_last_four").notNull().default("3796"),
  displayName: text("display_name"),
  customMonthlyExpenses: text("custom_monthly_expenses"),
  customMonthlyIncome: text("custom_monthly_income"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockedReason: text("blocked_reason"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const transactions = pgTable("transactions", {
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
  isContabilizzato: boolean("is_contabilizzato").notNull().default(false),
  isSimulated: boolean("is_simulated").notNull().default(true),
  date: timestamp("date").$defaultFn(() => new Date()),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const insertUserSchema = createInsertSchema(users).pick({
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

export const insertTransactionSchema = createInsertSchema(transactions).pick({
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Chat tables for AI financial advisor
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// New tables
export const userPresetSettings = pgTable("user_preset_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  deletedPresets: text("deleted_presets").notNull().default("[]"),
  disabledPresets: text("disabled_presets").notNull().default("[]"),
  customPresets: text("custom_presets").notNull().default("[]"),
});

export const userCustomPresets = pgTable("user_custom_presets", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  description: text("description").notNull(),
  minAmount: integer("min_amount").notNull(),
  maxAmount: integer("max_amount").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const referralActivations = pgTable("referral_activations", {
  id: serial("id").primaryKey(),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => users.id),
  referredId: text("referred_id")
    .notNull()
    .references(() => users.id),
  bonusAmount: text("bonus_amount").notNull(),
  activatedAt: timestamp("activated_at").$defaultFn(() => new Date()),
});

export const insertCustomPresetSchema = createInsertSchema(
  userCustomPresets,
).omit({ id: true, createdAt: true });
export type InsertCustomPreset = z.infer<typeof insertCustomPresetSchema>;
export type UserCustomPreset = typeof userCustomPresets.$inferSelect;
export type UserPresetSettings = typeof userPresetSettings.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
export type ReferralActivation = typeof referralActivations.$inferSelect;
