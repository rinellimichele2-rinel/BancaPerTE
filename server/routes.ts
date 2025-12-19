import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerNewsRoutes } from "./replit_integrations/news";

const EXPENSE_TRANSACTIONS = [
  { description: "Dok Via Giosue' Carducci 32", category: "Generi alimentari e supermercato", minAmount: 3, maxAmount: 20 },
  { description: "Coop Superstore C.da Bosche", category: "Generi alimentari e supermercato", minAmount: 5, maxAmount: 20 },
  { description: "Coop Superstore Melfi", category: "Generi alimentari e supermercato", minAmount: 5, maxAmount: 15 },
  { description: "Pv185ep Via Foggia Melfi 85", category: "Generi alimentari e supermercato", minAmount: 8, maxAmount: 40 },
  { description: "Morano Srl Via Foggia", category: "Generi alimentari e supermercato", minAmount: 9, maxAmount: 25 },
  { description: "Penny Market S.r.l.", category: "Generi alimentari e supermercato", minAmount: 20, maxAmount: 130 },
  { description: "Lidl 1972", category: "Generi alimentari e supermercato", minAmount: 10, maxAmount: 50 },
  { description: "Md Ripacandida S.spiano Del", category: "Generi alimentari e supermercato", minAmount: 15, maxAmount: 35 },
  { description: "Iper Molfetta", category: "Generi alimentari e supermercato", minAmount: 1, maxAmount: 15 },
  { description: "Despar Largo Finlandia Bari", category: "Generi alimentari e supermercato", minAmount: 10, maxAmount: 20 },
  { description: "Supermercato Despar Via For", category: "Generi alimentari e supermercato", minAmount: 3, maxAmount: 20 },
  { description: "Al Solito Posto Via San Lor", category: "Tabaccai e simili", minAmount: 4, maxAmount: 10 },
  { description: "Coretti Francesco Molfetta", category: "Tabaccai e simili", minAmount: 3, maxAmount: 8 },
  { description: "Fama S.r.l.s. Contrada Bosc", category: "Ristoranti e bar", minAmount: 4, maxAmount: 10 },
  { description: "Pizzeria Del Borgo Via Colu", category: "Ristoranti e bar", minAmount: 8, maxAmount: 15 },
  { description: "Metro' Pizzeria Via Roma 14", category: "Ristoranti e bar", minAmount: 10, maxAmount: 20 },
  { description: "Red Note S.r.l.s.", category: "Ristoranti e bar", minAmount: 15, maxAmount: 30 },
  { description: "SumUp *Room Food Rapolla", category: "Ristoranti e bar", minAmount: 10, maxAmount: 40 },
  { description: "Chapeau Le Gourmet Gr Rac A", category: "Ristoranti e bar", minAmount: 15, maxAmount: 30 },
  { description: "Ccoffee Shop Srl Via Olive", category: "Ristoranti e bar", minAmount: 1, maxAmount: 8 },
  { description: "Mc Donald's C/o Centro Comm", category: "Ristoranti e bar", minAmount: 10, maxAmount: 30 },
  { description: "Cup&go Ss407 Basentana Potenza", category: "Ristoranti e bar", minAmount: 3, maxAmount: 8 },
  { description: "La Rustica Srls Strada Stat", category: "Ristoranti e bar", minAmount: 6, maxAmount: 15 },
  { description: "Kikyo Sushi Via Della Mecca", category: "Ristoranti e bar", minAmount: 25, maxAmount: 50 },
  { description: "Caffe' Del Viale Di Mo Via", category: "Ristoranti e bar", minAmount: 3, maxAmount: 10 },
  { description: "Maglione Pizzeriasarni Cc Gran Foggia", category: "Ristoranti e bar", minAmount: 2, maxAmount: 15 },
  { description: "Coil Barile Strada Statale", category: "Carburanti", minAmount: 10, maxAmount: 30 },
  { description: "40653 Rapolla Pz Via Barl", category: "Carburanti", minAmount: 10, maxAmount: 20 },
  { description: "Stazione Di Servizio F Cont", category: "Carburanti", minAmount: 20, maxAmount: 40 },
  { description: "Eni 54761", category: "Carburanti", minAmount: 15, maxAmount: 25 },
  { description: "Stazione Di Servizio Toi Ss", category: "Carburanti", minAmount: 15, maxAmount: 25 },
  { description: "Pv8812", category: "Carburanti", minAmount: 10, maxAmount: 20 },
  { description: "Eni08758", category: "Carburanti", minAmount: 10, maxAmount: 15 },
  { description: "Pepco 220140 Melfi Melfi", category: "Casa varie", minAmount: 2, maxAmount: 10 },
  { description: "Linea Risparmio Self Rapolla", category: "Casa varie", minAmount: 1, maxAmount: 5 },
  { description: "Colorificio Ferramenta L Vi", category: "Manutenzione casa", minAmount: 10, maxAmount: 20 },
  { description: "Okasa Shop Via Potenza Dc S", category: "Casa varie", minAmount: 3, maxAmount: 10 },
  { description: "Estyle S.r.l. Viale Del Bas", category: "Cura della persona", minAmount: 10, maxAmount: 40 },
  { description: "Ditta Vincenzo Navazio & Fi", category: "Tempo libero varie", minAmount: 50, maxAmount: 120 },
  { description: "RH *cnfans.com London", category: "Tempo libero varie", minAmount: 7, maxAmount: 15 },
  { description: "C.w. S.r.l.s.", category: "Tempo libero varie", minAmount: 2, maxAmount: 10 },
  { description: "Radino Francesca Melfi", category: "Tempo libero varie", minAmount: 5, maxAmount: 10 },
  { description: "Ovs", category: "Abbigliamento e accessori", minAmount: 5, maxAmount: 50 },
  { description: "House Store Via Alcide De G", category: "Abbigliamento e accessori", minAmount: 3, maxAmount: 20 },
  { description: "Lycamobile S R L Roma", category: "Cellulare", minAmount: 10, maxAmount: 15 },
  { description: "Autoservizi Moretti Srl Melfi", category: "Trasporti, noleggi, taxi e parcheggi", minAmount: 2, maxAmount: 5 },
  { description: "Alibaba.com Luxembourg", category: "Acquisti Online", minAmount: 10, maxAmount: 50 },
  { description: "Paypal *alipayeu", category: "Acquisti Online", minAmount: 20, maxAmount: 60 },
  { description: "Prelievo BANCOMAT Altre Banche Italia E Sepa", category: "Prelievi", minAmount: 0, maxAmount: 0, fixedAmounts: [20, 50, 100, 200, 500] },
  { description: "Prelievo Sportello Banca Del Gruppo", category: "Prelievi", minAmount: 0, maxAmount: 0, fixedAmounts: [20, 50, 100, 200, 500, 1000] },
  { description: "Comm.prelievo Bancocard Banche Italia E Sepa", category: "Imposte, bolli e commissioni", minAmount: 2, maxAmount: 2 },
  { description: "Commissione Disposizione Di Bonifico", category: "Imposte, bolli e commissioni", minAmount: 1, maxAmount: 1 },
  { description: "Canone Mensile Totale La Mia Scelta", category: "Altre uscite", minAmount: 7, maxAmount: 8 },
  { description: "Bonifico Disposto A Favore Di Raffaele Pianta", category: "Pagamento affitti", minAmount: 250, maxAmount: 350 },
];

const INCOME_TRANSACTIONS = [
  { description: "Bonifico Istantaneo Disposto Da LAURENZIELLO GIOVINA", category: "Bonifici ricevuti", minAmount: 15, maxAmount: 200 },
  { description: "Bonifico Disposto Da INPS", category: "Bonifici ricevuti", minAmount: 30, maxAmount: 650 },
  { description: "Bonifico Disposto Da CAMMAROTA DONATO C. S.N.C.", category: "Bonifici ricevuti", minAmount: 300, maxAmount: 600 },
  { description: "Bonifico Istantaneo Disposto Da A.P.S.E.M. CLUB PUNTO SPORT CAFFE'", category: "Bonifici ricevuti", minAmount: 50, maxAmount: 100 },
  { description: "Bonifico Disposto Da Mangopay", category: "Bonifici ricevuti", minAmount: 30, maxAmount: 50 },
  { description: "Bonifico Disposto Da Gbo Italy SpA", category: "Bonifici ricevuti", minAmount: 40, maxAmount: 60 },
];

function generateRandomTransaction(userId: string, currentBalance: number, excludeDescriptions: string[] = []) {
  const now = new Date();
  const isExpense = Math.random() > 0.30;
  
  let transactions = isExpense ? EXPENSE_TRANSACTIONS : INCOME_TRANSACTIONS;
  
  if (excludeDescriptions.length > 0) {
    transactions = transactions.filter(t => !excludeDescriptions.includes(t.description));
  }
  
  if (transactions.length === 0) {
    transactions = isExpense ? EXPENSE_TRANSACTIONS : INCOME_TRANSACTIONS;
  }
  
  let transaction: { description: string; category: string; minAmount: number; maxAmount: number; fixedAmounts?: number[] };
  transaction = transactions[Math.floor(Math.random() * transactions.length)];
  
  let amount: number;
  if (transaction.fixedAmounts && transaction.fixedAmounts.length > 0) {
    amount = transaction.fixedAmounts[Math.floor(Math.random() * transaction.fixedAmounts.length)];
  } else {
    amount = Math.round(Math.random() * (transaction.maxAmount - transaction.minAmount) + transaction.minAmount);
  }
  
  const date = new Date(now);
  
  const isContabilizzato = Math.random() > 0.15;
  
  return {
    userId,
    description: transaction.description,
    amount: amount.toFixed(0) + ".00",
    type: isExpense ? "expense" : "income",
    category: transaction.category,
    accountNumber: null,
    isContabilizzato,
    date,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register AI chat routes for financial advisor
  registerChatRoutes(app);
  
  // Register AI-curated news feed routes
  registerNewsRoutes(app);

  // Server date endpoint for client synchronization
  app.get("/api/server-date", (req, res) => {
    const now = new Date();
    return res.json({
      date: now.toISOString(),
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Username richiesto" });
    }
    
    let user = await storage.getUserByUsername(username);
    let isNewUser = false;
    
    if (!user) {
      user = await storage.createUser({
        username,
        pin: "00000",
        hasSetPin: false,
        fullName: username.toUpperCase(),
        accountNumber: `1000/${Math.floor(Math.random() * 100000).toString().padStart(8, "0")}`,
        balance: "1000.00",
        cardLastFour: Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      });
      isNewUser = true;
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
    
    return res.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        accountNumber: user.accountNumber,
        balance: user.balance,
        cardLastFour: user.cardLastFour,
      }
    });
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
        fullName: user.fullName,
        accountNumber: user.accountNumber,
        balance: user.balance,
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
      fullName: user.fullName,
      accountNumber: user.accountNumber,
      balance: user.balance,
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

  app.get("/api/transactions/:userId", async (req, res) => {
    const { userId } = req.params;
    
    const transactions = await storage.getTransactions(userId);
    
    return res.json(transactions);
  });

  app.post("/api/transactions/:userId/generate-random", async (req, res) => {
    const { userId } = req.params;
    const { excludeDescriptions = [] } = req.body || {};
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    const currentBalance = parseFloat(user.balance || "1000");
    const transaction = generateRandomTransaction(userId, currentBalance, excludeDescriptions);
    const created = await storage.createTransaction(transaction);
    
    // For expenses, subtract the amount; for income, add it
    const amountValue = parseFloat(transaction.amount);
    const balanceChange = transaction.type === "expense" ? -amountValue : amountValue;
    const newBalance = Math.round(currentBalance + balanceChange).toFixed(0) + ".00";
    await storage.updateUserBalance(userId, newBalance);
    
    return res.json({ transaction: created, newBalance });
  });

  app.post("/api/transactions", async (req, res) => {
    const transaction = req.body;
    
    if (!transaction.userId || !transaction.description || !transaction.amount) {
      return res.status(400).json({ error: "Dati transazione incompleti" });
    }
    
    // Convert date string to Date object if provided
    if (transaction.date && typeof transaction.date === 'string') {
      transaction.date = new Date(transaction.date);
    }
    
    const created = await storage.createTransaction(transaction);
    
    return res.json(created);
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
    
    // Outgoing transaction for sender
    await storage.createTransaction({
      userId: fromUserId,
      description: `Trasferimento a ${toUser?.fullName || toUser?.username || 'Utente'}`,
      amount: amount.toString(),
      type: "expense",
      category: "Trasferimenti",
      accountNumber: toUser?.accountNumber || null,
      isContabilizzato: true,
      date: now,
    });

    // Incoming transaction for receiver
    await storage.createTransaction({
      userId: toUserId,
      description: `Trasferimento da ${fromUser.fullName || fromUser.username}`,
      amount: amount.toString(),
      type: "income",
      category: "Trasferimenti",
      accountNumber: fromUser.accountNumber || null,
      isContabilizzato: true,
      date: now,
    });

    return res.json(result);
  });

  const httpServer = createServer(app);

  return httpServer;
}
