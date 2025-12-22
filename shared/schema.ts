import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  rechargeUsername: text("recharge_username").unique(),
  pin: text("pin").notNull(),
  hasSetPin: boolean("has_set_pin").notNull().default(false),
  fullName: text("full_name").notNull(),
  accountNumber: text("account_number").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  purchasedBalance: decimal("purchased_balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  realPurchasedBalance: decimal("real_purchased_balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalRecharged: decimal("total_recharged", { precision: 12, scale: 2 }).notNull().default("0.00"),
  referredBy: varchar("referred_by"),
  referralActivated: boolean("referral_activated").notNull().default(false),
  cardLastFour: text("card_last_four").notNull().default("3796"),
  displayName: text("display_name"),
  customMonthlyExpenses: decimal("custom_monthly_expenses", { precision: 12, scale: 2 }),
  customMonthlyIncome: decimal("custom_monthly_income", { precision: 12, scale: 2 }),
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockedReason: text("blocked_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  accountNumber: text("account_number"),
  isContabilizzato: boolean("is_contabilizzato").notNull().default(false),
  isSimulated: boolean("is_simulated").notNull().default(true),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
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
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// User preset settings table (for deleted/disabled defaults)
export const userPresetSettings = pgTable("user_preset_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  deletedPresets: text("deleted_presets").notNull().default("[]"),
  disabledPresets: text("disabled_presets").notNull().default("[]"),
  customPresets: text("custom_presets").notNull().default("[]"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type UserPresetSettings = typeof userPresetSettings.$inferSelect;

// User custom presets table (normalized, persistent)
export const userCustomPresets = pgTable("user_custom_presets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  type: text("type").notNull().default("expense"),
  category: text("category").notNull(),
  minAmount: integer("min_amount").notNull(),
  maxAmount: integer("max_amount").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertCustomPresetSchema = createInsertSchema(userCustomPresets).omit({
  id: true,
  createdAt: true,
});

export type UserCustomPreset = typeof userCustomPresets.$inferSelect;
export type InsertCustomPreset = z.infer<typeof insertCustomPresetSchema>;

// App settings table for admin configuration
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type AppSettings = typeof appSettings.$inferSelect;

// Referral activations tracking
export const referralActivations = pgTable("referral_activations", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredId: varchar("referred_id").notNull().references(() => users.id),
  bonusAmount: decimal("bonus_amount", { precision: 12, scale: 2 }).notNull(),
  activatedAt: timestamp("activated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type ReferralActivation = typeof referralActivations.$inferSelect;
