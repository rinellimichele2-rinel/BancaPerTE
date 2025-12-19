import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  pin: text("pin").notNull(),
  hasSetPin: boolean("has_set_pin").notNull().default(false),
  fullName: text("full_name").notNull(),
  accountNumber: text("account_number").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  cardLastFour: text("card_last_four").notNull().default("3796"),
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
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  pin: true,
  hasSetPin: true,
  fullName: true,
  accountNumber: true,
  balance: true,
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
  date: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
