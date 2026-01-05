import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

export const users = sqliteTable("users", {
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
    () => new Date(),
  ),
});

export const transactions = sqliteTable("transactions", {
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
  date: integer("date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
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
export const conversations = sqliteTable("conversations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const messages = sqliteTable("messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id", { mode: "number" })
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
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

export const userPresetSettings = sqliteTable("user_preset_settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  deletedPresets: text("deleted_presets").notNull().default("[]"),
  disabledPresets: text("disabled_presets").notNull().default("[]"),
  customPresets: text("custom_presets").notNull().default("[]"),
});

export const userCustomPresets = sqliteTable("user_custom_presets", {
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
    () => new Date(),
  ),
});

export const appSettings = sqliteTable("app_settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const referralActivations = sqliteTable("referral_activations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => users.id),
  referredId: text("referred_id")
    .notNull()
    .references(() => users.id),
  bonusAmount: text("bonus_amount").notNull(),
  activatedAt: integer("activated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const insertCustomPresetSchema = createInsertSchema(
  userCustomPresets,
).omit({ id: true, createdAt: true });
export type InsertCustomPreset = z.infer<typeof insertCustomPresetSchema>;
export type UserCustomPreset = typeof userCustomPresets.$inferSelect;
export type UserPresetSettings = typeof userPresetSettings.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
export type ReferralActivation = typeof referralActivations.$inferSelect;
