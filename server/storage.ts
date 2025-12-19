import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import pg from "pg";
import { 
  users, 
  transactions, 
  type User, 
  type InsertUser, 
  type Transaction, 
  type InsertTransaction 
} from "@shared/schema";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<User | undefined>;
  updateUserName(userId: string, newName: string): Promise<User | undefined>;
  updateUserAccountNumber(userId: string, newAccountNumber: string): Promise<User | undefined>;
  updateUserPin(userId: string, newPin: string): Promise<User | undefined>;
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
}

export const storage = new DatabaseStorage();
