import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerNewsRoutes } from "./replit_integrations/news";
import { DEFAULT_PRESETS, type PresetTransaction } from "../shared/presets";

type UserPresetSettings = {
  deletedPresets: string[];
  disabledPresets: string[];
  customPresets: PresetTransaction[];
};

type GenerateTransactionResult = {
  userId: string;
  description: string;
  amount: string;
  type: string;
  category: string;
  accountNumber: null;
  isContabilizzato: boolean;
  isSimulated: boolean;
  date: Date;
  wasCapped?: boolean;
  cappedMessage?: string;
} | null;

function generateRandomTransaction(
  userId: string, 
  currentBalance: number,
  purchasedBalance: number,
  userSettings: UserPresetSettings
): GenerateTransactionResult {
  const now = new Date();
  
  // Random button ONLY generates expenses (uscite)
  // Income is handled separately via manual form
  const isExpense = true;
  
  const excludeDescriptions = [
    ...userSettings.deletedPresets,
    ...userSettings.disabledPresets
  ];
  
  // Only get expense presets
  let availablePresets = DEFAULT_PRESETS.filter(p => {
    if (p.type !== "expense") return false;
    if (excludeDescriptions.includes(p.description)) return false;
    return true;
  });
  
  // Add custom expense presets
  const customExpensePresets = userSettings.customPresets.filter(p => p.type === "expense");
  availablePresets = [...availablePresets, ...customExpensePresets];
  
  if (availablePresets.length === 0) {
    return null;
  }
  
  const preset = availablePresets[Math.floor(Math.random() * availablePresets.length)];
  
  let amount: number;
  if (preset.fixedAmounts && preset.fixedAmounts.length > 0) {
    amount = preset.fixedAmounts[Math.floor(Math.random() * preset.fixedAmounts.length)];
  } else {
    amount = Math.round(Math.random() * (preset.maxAmount - preset.minAmount) + preset.minAmount);
  }
  
  const wasCapped = false;
  const cappedMessage: string | undefined = undefined;
  
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Register AI chat routes for financial advisor
  registerChatRoutes(app);
  
  // Register AI-curated news feed routes
  registerNewsRoutes(app);

  // Server date endpoint for client synchronization with Europe/Rome timezone
  app.get("/api/server-date", (req, res) => {
    const now = new Date();
    // Format date in Europe/Rome timezone
    const romeFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = romeFormatter.formatToParts(now);
    const romeDateStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;
    
    return res.json({
      date: now.toISOString(),
      romeDate: romeDateStr,
      timestamp: now.getTime(),
      timezone: 'Europe/Rome',
      currentMonth: parseInt(parts.find(p => p.type === 'month')?.value || '1'),
      currentYear: parseInt(parts.find(p => p.type === 'year')?.value || '2026'),
      currentDay: parseInt(parts.find(p => p.type === 'day')?.value || '1')
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, referralCode } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Username richiesto" });
    }
    
    let user = await storage.getUserByUsername(username);
    let isNewUser = false;
    
    if (!user) {
      const rechargeUsername = username
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .substring(0, 15) + '_' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      user = await storage.createUser({
        username,
        pin: "00000",
        hasSetPin: false,
        fullName: username.toUpperCase(),
        accountNumber: `1000/${Math.floor(Math.random() * 100000).toString().padStart(8, "0")}`,
        balance: "10.00",
        purchasedBalance: "0.00",
        realPurchasedBalance: "0.00",
        cardLastFour: Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
        rechargeUsername,
      });
      isNewUser = true;
      
      // Apply referral code if provided and valid
      if (referralCode && referralCode.trim()) {
        const referrer = await storage.getUserByReferralCode(referralCode.trim());
        if (referrer && referrer.id !== user.id) {
          await storage.updateUserReferredBy(user.id, referrer.id);
        }
      }
    }
    
    return res.json({ 
      userId: user.id, 
      username: user.username,
      needsSetup: isNewUser || !user.hasSetPin
    });
  });

  app.post("/api/auth/setup-pin", async (req, res) => {
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
        id: updatedUser!.id,
        username: updatedUser!.username,
        rechargeUsername: updatedUser!.rechargeUsername,
        fullName: updatedUser!.fullName,
        accountNumber: updatedUser!.accountNumber,
        balance: updatedUser!.balance,
        purchasedBalance: updatedUser!.purchasedBalance,
        cardLastFour: updatedUser!.cardLastFour,
      }
    });
  });

  app.post("/api/auth/set-recharge-username", async (req, res) => {
    const { userId, rechargeUsername } = req.body;
    
    if (!userId || !rechargeUsername) {
      return res.status(400).json({ error: "UserId e username di ricarica richiesti" });
    }
    
    const trimmedUsername = rechargeUsername.trim().toLowerCase();
    
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ error: "L'username deve essere di almeno 3 caratteri" });
    }
    
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({ error: "L'username puo contenere solo lettere, numeri e underscore" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    if (user.rechargeUsername) {
      return res.status(400).json({ error: "L'username di ricarica e gia stato impostato e non puo essere modificato" });
    }
    
    const existingUser = await storage.getUserByRechargeUsername(trimmedUsername);
    if (existingUser) {
      return res.status(400).json({ error: "Questo username e gia in uso" });
    }
    
    await storage.setUserRechargeUsername(userId, trimmedUsername);
    
    return res.json({ success: true });
  });

  app.post("/api/check-recharge-username", async (req, res) => {
    const { rechargeUsername } = req.body;
    
    if (!rechargeUsername) {
      return res.status(400).json({ available: false });
    }
    
    const trimmedUsername = rechargeUsername.trim().toLowerCase();
    const existingUser = await storage.getUserByRechargeUsername(trimmedUsername);
    
    return res.json({ available: !existingUser });
  });

  app.post("/api/auth/verify-pin", async (req, res) => {
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
      }
    });
  });

  app.get("/api/user/:userId", async (req, res) => {
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

  app.put("/api/user/:userId/balance", async (req, res) => {
    const { userId } = req.params;
    const { balance } = req.body;
    
    if (balance === undefined) {
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

  app.put("/api/user/:userId/name", async (req, res) => {
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

  app.put("/api/user/:userId/account-number", async (req, res) => {
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

  app.put("/api/user/:userId/display-name", async (req, res) => {
    const { userId } = req.params;
    const { displayName } = req.body;
    
    const user = await storage.updateUserDisplayName(userId, displayName || null);
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    return res.json({
      id: user.id,
      displayName: user.displayName,
    });
  });

  app.put("/api/user/:userId/monthly-values", async (req, res) => {
    const { userId } = req.params;
    const { customMonthlyExpenses, customMonthlyIncome } = req.body;
    
    const user = await storage.updateUserMonthlyValues(
      userId, 
      customMonthlyExpenses || null, 
      customMonthlyIncome || null
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

  app.get("/api/transactions/:userId", async (req, res) => {
    const { userId } = req.params;
    
    const transactions = await storage.getTransactions(userId);
    
    return res.json(transactions);
  });

  app.post("/api/transactions/:userId/generate-random", async (req, res) => {
    const { userId } = req.params;
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    // Fetch custom presets from database (new normalized table)
    const dbCustomPresets = await storage.getCustomPresets(userId);
    
    // Convert DB presets to the format expected by generateRandomTransaction
    const customPresetsForRandom: PresetTransaction[] = dbCustomPresets
      .filter(p => p.isEnabled && p.type === "expense")
      .map(p => ({
        description: p.description,
        type: p.type as "expense" | "income",
        category: p.category,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
        isCustom: true,
      }));
    
    const userSettings: UserPresetSettings = {
      deletedPresets: [],
      disabledPresets: [],
      customPresets: customPresetsForRandom,
    };
    
    const currentBalance = parseFloat(user.balance || "0");
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    const transaction = generateRandomTransaction(userId, currentBalance, purchasedBalance, userSettings);
    
    if (!transaction) {
      return res.json({ 
        transaction: null, 
        newBalance: user.balance,
        message: "Nessun preset disponibile. Crea dei preset per generare transazioni casuali." 
      });
    }
    
    const { wasCapped, cappedMessage, ...transactionData } = transaction;
    const created = await storage.createTransaction(transactionData);
    
    const amountValue = parseFloat(transaction.amount);
    const balanceChange = transaction.type === "expense" ? -amountValue : amountValue;
    const newBalance = Math.round(currentBalance + balanceChange).toFixed(0) + ".00";
    
    // Also deduct from purchased balance (margine di recupero)
    const newPurchasedBalance = Math.max(0, purchasedBalance + balanceChange).toFixed(2);
    await storage.updateUserBalanceWithPurchased(userId, newBalance, newPurchasedBalance);
    
    return res.json({ 
      transaction: created, 
      newBalance,
      wasCapped,
      cappedMessage 
    });
  });

  app.post("/api/transactions", async (req, res) => {
    const transaction = req.body;
    
    if (!transaction.userId || !transaction.description || !transaction.amount) {
      return res.status(400).json({ error: "Dati transazione incompleti" });
    }
    
    const user = await storage.getUser(transaction.userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    const currentBalance = parseFloat(user.balance || "0");
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    const realPurchasedBalance = parseFloat(user.realPurchasedBalance || "0");
    
    // Recovery is capped by realPurchasedBalance (permanent admin top-ups)
    // P2P transfers permanently reduce this, fake income cannot exceed it
    const recoveryAvailability = Math.max(0, realPurchasedBalance - currentBalance);
    
    let amount = Math.abs(parseFloat(transaction.amount));
    let wasCapped = false;
    
    // Only cap income transactions - expenses are always allowed
    if (transaction.type === "income") {
      // Allow income only if there's recovery room (realPurchasedBalance > currentBalance)
      if (recoveryAvailability <= 0) {
        return res.status(403).json({ 
          error: "Saldo già al massimo. Non puoi aggiungere altre entrate.",
          recoveryAvailability: 0
        });
      }
      // Cap the income amount to available recovery (can't exceed realPurchasedBalance)
      if (amount > recoveryAvailability) {
        amount = Math.floor(recoveryAvailability);
        wasCapped = true;
      }
    }
    
    // Floor the amount for whole euros
    amount = Math.floor(amount);
    
    if (transaction.date && typeof transaction.date === 'string') {
      transaction.date = new Date(transaction.date);
    }
    
    transaction.amount = amount.toFixed(0) + ".00";
    transaction.isSimulated = true;
    
    const created = await storage.createTransaction(transaction);
    
    const balanceChange = transaction.type === "expense" ? -amount : amount;
    const newBalance = Math.floor(currentBalance + balanceChange).toFixed(0) + ".00";
    
    // Income transactions increase BOTH balance AND purchasedBalance (for justification)
    // Expenses decrease BOTH balance AND purchasedBalance
    const newPurchasedBalance = Math.max(0, purchasedBalance + balanceChange).toFixed(2);
    await storage.updateUserBalanceWithPurchased(user.id, newBalance, newPurchasedBalance);
    
    return res.json({ 
      transaction: created, 
      newBalance,
      wasCapped,
      cappedMessage: wasCapped ? "Importo limitato al saldo reale disponibile" : undefined,
      recoveryAvailability: Math.max(0, realPurchasedBalance - parseFloat(newBalance))
    });
  });

  // Console expense - deducts from display balance only, creates recovery margin
  // realPurchasedBalance stays the same, allowing recovery via Entrata
  app.post("/api/transactions/certified-expense", async (req, res) => {
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
    
    // Check if user has enough display balance
    if (currentBalance <= 0) {
      return res.status(400).json({ error: "Saldo insufficiente per registrare l'uscita." });
    }
    
    // Cap expense to current display balance
    const actualExpense = Math.min(expenseAmount, Math.floor(currentBalance));
    
    // Deduct from display balance ONLY - this creates recovery margin
    // realPurchasedBalance stays the same!
    const newBalance = Math.max(0, currentBalance - actualExpense).toFixed(2);
    const newPurchased = Math.max(0, purchasedBalance - actualExpense).toFixed(2);
    
    // Update only balance and purchasedBalance, keep realPurchasedBalance unchanged
    await storage.updateUserBalanceWithPurchased(userId, newBalance, newPurchased);
    
    // Get updated user
    const updatedUser = await storage.getUser(userId);
    
    // Create transaction (template for Help button)
    const transaction = await storage.createTransaction({
      userId,
      description,
      amount: (-actualExpense).toString(),
      type: "expense",
      category: category || "Altre uscite",
      isContabilizzato: true,
      isSimulated: false,
    });
    
    // Calculate new recovery margin
    const newRecoveryMargin = Math.max(0, realPurchased - parseFloat(newBalance));
    
    return res.json({
      success: true,
      transaction,
      user: updatedUser,
      recoveryMargin: newRecoveryMargin,
    });
  });

  // Get manual expense templates (for Help button)
  app.get("/api/transactions/:userId/expense-templates", async (req, res) => {
    const { userId } = req.params;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    // Get all manual expense transactions (isSimulated=false, type="expense")
    const transactions = await storage.getTransactions(userId);
    const manualExpenses = transactions.filter(
      (t: { type: string; isSimulated: boolean }) => t.type === "expense" && t.isSimulated === false
    );
    
    // Extract unique descriptions with their categories
    const templates = new Map<string, { description: string; category: string; avgAmount: number }>();
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

  // Generate random expense from manual templates (Help button)
  app.post("/api/transactions/generate-from-template", async (req, res) => {
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
      return res.status(400).json({ error: "Saldo Certificato esaurito. Ricarica per continuare." });
    }
    
    // Get manual expense transactions as templates
    const transactions = await storage.getTransactions(userId);
    const manualExpenses = transactions.filter(
      (t: { type: string; isSimulated: boolean }) => t.type === "expense" && t.isSimulated === false
    );
    
    if (manualExpenses.length === 0) {
      return res.status(400).json({ 
        error: "Nessun modello disponibile. Crea prima delle uscite manuali nella Console." 
      });
    }
    
    // Pick a random template
    const template = manualExpenses[Math.floor(Math.random() * manualExpenses.length)];
    const baseAmount = Math.abs(parseFloat(template.amount || "0"));
    
    // Generate random amount: ±30% of original, minimum 1 EUR
    const variation = 0.3;
    const minAmount = Math.max(1, Math.floor(baseAmount * (1 - variation)));
    const maxAmount = Math.floor(baseAmount * (1 + variation));
    let randomAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    
    // Cap to available certified balance
    randomAmount = Math.min(randomAmount, Math.floor(realPurchased));
    
    if (randomAmount <= 0) {
      return res.status(400).json({ error: "Saldo Certificato insufficiente." });
    }
    
    // Deduct from all balances
    const currentBalance = parseFloat(user.balance || "0");
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    
    const newBalance = Math.max(0, currentBalance - randomAmount).toFixed(2);
    const newPurchased = Math.max(0, purchasedBalance - randomAmount).toFixed(2);
    const newRealPurchased = (realPurchased - randomAmount).toFixed(2);
    
    // Update all three balances atomically
    const updatedUser = await storage.updateUserAllBalances(userId, newBalance, newPurchased, newRealPurchased);
    
    // Create REAL transaction (not simulated) with slight description variation
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

  app.put("/api/transactions/:transactionId", async (req, res) => {
    const { transactionId } = req.params;
    const { amount, description } = req.body;
    
    const transaction = await storage.getTransaction(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transazione non trovata" });
    }
    
    const updates: { amount?: string; description?: string } = {};
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description;
    
    const updated = await storage.updateTransaction(transactionId, updates);
    
    // Security: Editing transactions does NOT modify the user's balance
    // Balance can only be changed by admin top-ups or transfers
    
    return res.json(updated);
  });

  // Get user preset settings
  app.get("/api/users/:userId/preset-settings", async (req, res) => {
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

  // Save user preset settings
  app.post("/api/users/:userId/preset-settings", async (req, res) => {
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

  // Custom presets API - database-backed persistent storage
  app.get("/api/users/:userId/custom-presets", async (req, res) => {
    const { userId } = req.params;
    const presets = await storage.getCustomPresets(userId);
    return res.json(presets);
  });

  app.post("/api/users/:userId/custom-presets", async (req, res) => {
    const { userId } = req.params;
    const { description, type, category, minAmount, maxAmount } = req.body;

    if (!description || !category || minAmount === undefined || maxAmount === undefined) {
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

  app.put("/api/users/:userId/custom-presets/:presetId", async (req, res) => {
    const { userId, presetId } = req.params;
    const { description, type, category, minAmount, maxAmount, isEnabled } = req.body;

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
      minAmount: minAmount !== undefined ? parseInt(minAmount) : undefined,
      maxAmount: maxAmount !== undefined ? parseInt(maxAmount) : undefined,
      isEnabled,
    });

    return res.json(updated);
  });

  app.delete("/api/users/:userId/custom-presets/:presetId", async (req, res) => {
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
  });

  app.post("/api/users/:userId/custom-presets/:presetId/trigger", async (req, res) => {
    const { userId, presetId } = req.params;

    const result = await storage.triggerPresetTransaction(userId, parseInt(presetId));
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      transaction: result.transaction,
      user: result.user,
    });
  });

  // Get all users for money transfer feature
  app.get("/api/users", async (req, res) => {
    const allUsers = await storage.getAllUsers();
    // Return sanitized user data (no PIN)
    const sanitizedUsers = allUsers.map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      accountNumber: user.accountNumber,
      balance: user.balance,
    }));
    return res.json(sanitizedUsers);
  });

  // List all users for transfer (excluding blocked users)
  app.get("/api/users/list", async (req, res) => {
    const { exclude } = req.query;
    const allUsers = await storage.getAllUsers();
    
    // Filter out blocked users and optionally exclude the requesting user
    // Use rechargeUsername for display (has the _XXX suffix) for consistency with admin panel
    const filteredUsers = allUsers
      .filter(u => !u.isBlocked)
      .filter(u => exclude ? u.id !== exclude : true)
      .map(u => ({
        id: u.id,
        username: u.rechargeUsername || u.username,
        fullName: u.fullName,
        displayName: u.displayName,
        accountNumber: u.accountNumber,
      }));
    
    return res.json(filteredUsers);
  });

  // Search user by username (for transfers) - supports partial matching
  app.get("/api/users/search/:username", async (req, res) => {
    const { username } = req.params;
    const { partial } = req.query;
    
    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: "Username richiesto" });
    }
    
    // If partial=true, search for partial matches
    if (partial === "true") {
      const users = await storage.searchUsersByPartialUsername(username.trim());
      const filtered = users
        .filter(u => !u.isBlocked)
        .map(u => ({
          id: u.id,
          username: u.rechargeUsername || u.username,
          fullName: u.fullName,
          displayName: u.displayName,
          accountNumber: u.accountNumber,
        }));
      return res.json(filtered);
    }
    
    // Exact match
    const user = await storage.getUserByUsername(username.trim());
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ error: "Questo utente non può ricevere trasferimenti" });
    }
    
    // Return sanitized user data (no PIN, no sensitive info)
    return res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      accountNumber: user.accountNumber,
    });
  });

  // Transfer balance between users
  app.post("/api/transfer", async (req, res) => {
    const { fromUserId, toUserId, amount } = req.body;
    
    if (!fromUserId || !toUserId || amount === undefined) {
      return res.status(400).json({ success: false, error: "Dati mancanti" });
    }

    // Server-side validation - never trust client data
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) {
      return res.status(400).json({ success: false, error: "L'importo deve essere un numero intero positivo" });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ success: false, error: "Non puoi trasferire denaro a te stesso" });
    }

    // Always fetch the authoritative balance from the database (anti-cheat)
    const fromUser = await storage.getUser(fromUserId);
    if (!fromUser) {
      return res.status(404).json({ success: false, error: "Utente non trovato" });
    }

    const serverBalance = parseFloat(fromUser.balance || "0");
    if (amountNum > serverBalance) {
      return res.status(400).json({ success: false, error: "Saldo insufficiente" });
    }

    const result = await storage.transferBalance(fromUserId, toUserId, amountNum);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Create transaction records for both users
    const now = new Date();
    const toUser = await storage.getUser(toUserId);
    
    // Outgoing transaction for sender (real, not simulated)
    await storage.createTransaction({
      userId: fromUserId,
      description: `Trasferimento a ${toUser?.fullName || toUser?.username || 'Utente'}`,
      amount: amount.toString(),
      type: "expense",
      category: "Trasferimenti",
      accountNumber: toUser?.accountNumber || null,
      isContabilizzato: true,
      isSimulated: false,
      date: now,
    });

    // Incoming transaction for receiver (real, not simulated)
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

  // Admin: Search user by @username (login username)
  app.post("/api/admin/search-user", async (req, res) => {
    const { adminPassword, username } = req.body;
    
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    
    if (!username) {
      return res.status(400).json({ error: "Username richiesto" });
    }
    
    // Remove @ prefix if present and trim (case-insensitive search via ilike)
    const cleanUsername = username.trim().replace(/^@/, '');
    const user = await storage.getUserByUsername(cleanUsername);
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato con questo username" });
    }
    
    return res.json({
      id: user.id,
      username: user.username,
      accountNumber: user.accountNumber,
      fullName: user.fullName,
      balance: user.balance,
    });
  });

  // Admin: Add balance to user (top-up)
  app.post("/api/admin/topup", async (req, res) => {
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
      return res.status(400).json({ error: "L'importo deve essere un numero intero positivo" });
    }
    
    // Remove @ prefix if present and trim (case-insensitive search via ilike)
    const cleanUsername = username.trim().replace(/^@/, '');
    const user = await storage.getUserByUsername(cleanUsername);
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    const currentBalance = parseFloat(user.balance || "0");
    const currentPurchasedBalance = parseFloat(user.purchasedBalance || "0");
    const currentRealPurchased = parseFloat(user.realPurchasedBalance || "0");
    const previousTotalRecharged = parseFloat(user.totalRecharged || "0");
    const newBalance = (currentBalance + amountNum).toFixed(2);
    const newPurchasedBalance = (currentPurchasedBalance + amountNum).toFixed(2);
    const newRealPurchased = (currentRealPurchased + amountNum).toFixed(2);
    
    await storage.updateUserAllBalances(user.id, newBalance, newPurchasedBalance, newRealPurchased);
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
      date: new Date(),
    });
    
    // Check if user just crossed €2 threshold and has a referrer
    const newTotalRecharged = previousTotalRecharged + amountNum;
    let referralBonusAwarded = false;
    let referrerName = "";
    
    if (previousTotalRecharged < 2 && newTotalRecharged >= 2 && user.referredBy && !user.referralActivated) {
      const referrer = await storage.getUser(user.referredBy);
      if (referrer) {
        // Get bonus amount from settings (default 200)
        const bonusStr = await storage.getAppSetting("referral_bonus");
        const bonusAmount = bonusStr ? parseInt(bonusStr) : 200;
        
        // Award bonus to referrer (real money, increases all balances)
        const referrerBalance = parseFloat(referrer.balance || "0");
        const referrerPurchased = parseFloat(referrer.purchasedBalance || "0");
        const referrerRealPurchased = parseFloat(referrer.realPurchasedBalance || "0");
        const newReferrerBalance = (referrerBalance + bonusAmount).toFixed(2);
        const newReferrerPurchased = (referrerPurchased + bonusAmount).toFixed(2);
        const newReferrerRealPurchased = (referrerRealPurchased + bonusAmount).toFixed(2);
        
        await storage.updateUserAllBalances(referrer.id, newReferrerBalance, newReferrerPurchased, newReferrerRealPurchased);
        
        // Create bonus transaction for referrer
        await storage.createTransaction({
          userId: referrer.id,
          description: `Bonus Referral da ${user.username}`,
          amount: bonusAmount.toString() + ".00",
          type: "income",
          category: "Bonus",
          accountNumber: null,
          isContabilizzato: true,
          isSimulated: false,
          date: new Date(),
        });
        
        // Record the activation
        await storage.createReferralActivation(referrer.id, user.id, bonusAmount);
        await storage.activateReferral(user.id);
        
        referralBonusAwarded = true;
        referrerName = referrer.fullName || referrer.username;
      }
    }
    
    const updatedUser = await storage.getUser(user.id);
    
    return res.json({
      success: true,
      user: {
        fullName: updatedUser!.fullName,
        rechargeUsername: updatedUser!.rechargeUsername,
        newBalance: updatedUser!.balance,
        purchasedBalance: updatedUser!.purchasedBalance,
        totalRecharged: updatedUser!.totalRecharged,
      },
      referralBonusAwarded,
      referrerName: referralBonusAwarded ? referrerName : undefined,
    });
  });

  // Admin: Get referral bonus setting
  app.get("/api/admin/referral-settings", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"] as string;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    
    const bonusStr = await storage.getAppSetting("referral_bonus");
    return res.json({ referralBonus: bonusStr ? parseInt(bonusStr) : 200 });
  });

  // Admin: Update referral bonus setting
  app.post("/api/admin/referral-settings", async (req, res) => {
    const { adminPassword, referralBonus } = req.body;
    
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    
    const bonus = parseInt(referralBonus);
    if (isNaN(bonus) || bonus < 0) {
      return res.status(400).json({ error: "Il bonus deve essere un numero positivo" });
    }
    
    await storage.setAppSetting("referral_bonus", bonus.toString());
    return res.json({ success: true, referralBonus: bonus });
  });

  // Admin: Get all referral activations
  app.get("/api/admin/referral-activations", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"] as string;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    
    const activations = await storage.getReferralActivations();
    return res.json(activations);
  });

  // Admin: Get users sorted
  app.get("/api/admin/users", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"] as string;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    
    const sortBy = (req.query.sortBy as string) === 'balance' ? 'balance' : 'newest';
    const allUsers = await storage.getAllUsersSorted(sortBy);
    
    const sanitizedUsers = allUsers.map(user => ({
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

  // Admin: Block user
  app.post("/api/admin/block-user", async (req, res) => {
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
    
    return res.json({ success: true, user: { id: user.id, username: user.username, isBlocked: user.isBlocked } });
  });

  // Admin: Unblock user
  app.post("/api/admin/unblock-user", async (req, res) => {
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
    
    return res.json({ success: true, user: { id: user.id, username: user.username, isBlocked: user.isBlocked } });
  });

  // Admin: Delete user (for duplicate registrations)
  app.post("/api/admin/delete-user", async (req, res) => {
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
      return res.status(500).json({ error: "Errore durante l'eliminazione dell'utente" });
    }
    
    return res.json({ success: true, message: "Utente eliminato con successo" });
  });

  // Admin: Get user P2P transfers only (real transfers where user is sender or receiver)
  app.get("/api/admin/user-transfers/:userId", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"] as string;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    
    const { userId } = req.params;
    const allTransactions = await storage.getTransactions(userId);
    
    // Filter only real P2P transfers (category = "Trasferimenti" and isSimulated = false)
    const transfers = allTransactions.filter(tx => 
      tx.category === "Trasferimenti" && tx.isSimulated === false
    );
    
    // Sort by date descending (newest first)
    transfers.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return res.json(transfers);
  });

  // Admin: Set certified balance (realPurchasedBalance) - updates all three balance fields
  app.post("/api/admin/set-balance", async (req, res) => {
    const { adminPassword, userId, newBalance } = req.body;
    
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    
    if (!userId || newBalance === undefined) {
      return res.status(400).json({ error: "ID utente e nuovo saldo richiesti" });
    }
    
    const balanceNum = parseFloat(newBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      return res.status(400).json({ error: "Il saldo deve essere un numero positivo" });
    }
    
    // Verify user exists before updating
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    // Update all three balances to maintain consistency (Saldo Certificato)
    const balanceStr = balanceNum.toFixed(2);
    const updatedUser = await storage.updateUserAllBalances(userId, balanceStr, balanceStr, balanceStr);
    
    if (!updatedUser) {
      return res.status(500).json({ error: "Errore durante l'aggiornamento del saldo" });
    }
    
    return res.json({ 
      success: true, 
      user: { 
        id: updatedUser.id, 
        username: updatedUser.username, 
        balance: updatedUser.balance,
        realPurchasedBalance: updatedUser.realPurchasedBalance 
      } 
    });
  });

  // Admin: Get transfer history (real transactions only)
  app.get("/api/admin/transfers", async (req, res) => {
    const adminPassword = req.headers["x-admin-password"] as string;
    const validPassword = process.env.ADMIN_PASSWORD;
    if (!validPassword || adminPassword !== validPassword) {
      return res.status(401).json({ error: "Password admin non valida" });
    }
    
    const transfers = await storage.getTransferHistory();
    
    // Enrich with user info
    const enrichedTransfers = [];
    for (const transfer of transfers) {
      const user = await storage.getUser(transfer.userId);
      enrichedTransfers.push({
        ...transfer,
        username: user?.username || 'Sconosciuto',
        fullName: user?.fullName || 'Sconosciuto',
      });
    }
    
    return res.json(enrichedTransfers);
  });

  // Bonifico endpoint - creates real transaction with commission
  app.post("/api/bonifico", async (req, res) => {
    const { userId, destinatario, iban, amount, causale, bonificoIstantaneo } = req.body;
    
    if (!userId || !destinatario || !iban || !amount) {
      return res.status(400).json({ error: "Dati mancanti per il bonifico" });
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: "Importo non valido" });
    }
    
    const COMMISSION_FEE = 1.0;
    const totalCost = amountNum + COMMISSION_FEE;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    // Server-side validation against Saldo Attivo (balance)
    const activeBalance = parseFloat(user.balance || "0");
    if (totalCost > activeBalance) {
      return res.status(400).json({ 
        error: `Saldo Attivo insufficiente. Disponibile: ${activeBalance.toFixed(2)} EUR, Richiesto: ${totalCost.toFixed(2)} EUR` 
      });
    }
    
    // Deduct only from Saldo Attivo (balance)
    // realPurchasedBalance (Saldo Certificato) stays unchanged - same as Transaction Console behavior
    const purchasedBalance = parseFloat(user.purchasedBalance || "0");
    const realPurchasedBalance = parseFloat(user.realPurchasedBalance || "0");
    
    const newBalance = (activeBalance - totalCost).toFixed(2);
    // purchasedBalance tracks display, may go negative if needed
    const newPurchasedBalance = (purchasedBalance - totalCost).toFixed(2);
    // realPurchasedBalance (Saldo Certificato) remains unchanged
    const newRealPurchasedBalance = realPurchasedBalance.toFixed(2);
    
    // Update user balances - Saldo Certificato stays the same
    await storage.updateUserAllBalances(userId, newBalance, newPurchasedBalance, newRealPurchasedBalance);
    
    // Generate unique operation number
    const now = new Date();
    const italianFormatter = new Intl.DateTimeFormat('it-IT', { 
      timeZone: 'Europe/Rome',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedDate = italianFormatter.format(now);
    const dateForFilename = formattedDate.replace(/\//g, '.');
    
    const operationNumber = `INTER${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}BOSBE${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const trn = `0${Math.floor(Math.random() * 1000000000000000000).toString().substring(0, 18)}`;
    
    // Create transaction record for the bonifico amount only
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
    
    // Create separate commission transaction record
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
    
    // Format date for receipt
    const receiptDateFormatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const receiptDate = receiptDateFormatter.format(now).toUpperCase();
    
    // Generate receipt data
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
      newRealPurchasedBalance 
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
