import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

const EXPENSE_TRANSACTIONS = [
  { description: "LIDL ITALIA", category: "Supermercato" },
  { description: "COOP ALLEANZA", category: "Supermercato" },
  { description: "EURONICS", category: "Elettronica" },
  { description: "ESSELUNGA", category: "Supermercato" },
  { description: "CONAD", category: "Supermercato" },
  { description: "CARREFOUR", category: "Supermercato" },
  { description: "MEDIAWORLD", category: "Elettronica" },
  { description: "UNIEURO", category: "Elettronica" },
  { description: "AMAZON EU", category: "Acquisti Online" },
  { description: "ENI STATION", category: "Carburante" },
  { description: "Q8 STATION", category: "Carburante" },
  { description: "TAMOIL", category: "Carburante" },
  { description: "RISTORANTE LA PERGOLA", category: "Ristorazione" },
  { description: "TRATTORIA DA MARIO", category: "Ristorazione" },
  { description: "FARMACIA COMUNALE", category: "Salute" },
  { description: "ENEL ENERGIA", category: "Utenze" },
  { description: "TELECOM ITALIA", category: "Utenze" },
  { description: "VODAFONE ITALIA", category: "Utenze" },
];

const INCOME_TRANSACTIONS = [
  { description: "BONIFICO DA ROSSI MARIO", category: "Bonifici" },
  { description: "BONIFICO DA BIANCHI SRL", category: "Bonifici" },
  { description: "INCASSO AFFITTO IMMOBILE", category: "Affitti" },
  { description: "INCASSO CANONE LOCAZIONE", category: "Affitti" },
  { description: "DIVIDENDI AZIONI ENEL", category: "Investimenti" },
  { description: "DIVIDENDI AZIONI ENI", category: "Investimenti" },
  { description: "DIVIDENDI AZIONI INTESA", category: "Investimenti" },
  { description: "CEDOLE TITOLI DI STATO", category: "Investimenti" },
  { description: "STIPENDIO AZIENDA SPA", category: "Stipendio" },
  { description: "RIMBORSO SPESE", category: "Rimborsi" },
  { description: "BONIFICO DA VERDI GIUSEPPE", category: "Bonifici" },
  { description: "ACCREDITO PENSIONE INPS", category: "Pensione" },
];

function generateRandomTransaction(userId: string, currentBalance: number) {
  const now = new Date();
  const isExpense = Math.random() > 0.4;
  
  const maxTransactionPercent = 0.15;
  const maxAmount = Math.max(currentBalance * maxTransactionPercent, 50);
  
  let amount: number;
  let transaction: { description: string; category: string };
  
  if (isExpense) {
    amount = -(Math.random() * Math.min(maxAmount, 200) + 5);
    transaction = EXPENSE_TRANSACTIONS[Math.floor(Math.random() * EXPENSE_TRANSACTIONS.length)];
  } else {
    amount = Math.random() * maxAmount + 10;
    transaction = INCOME_TRANSACTIONS[Math.floor(Math.random() * INCOME_TRANSACTIONS.length)];
  }
  
  const date = new Date(now);
  date.setDate(date.getDate() - Math.floor(Math.random() * 7));
  
  return {
    userId,
    description: transaction.description,
    amount: amount.toFixed(2),
    type: isExpense ? "expense" : "income",
    category: transaction.category,
    accountNumber: null,
    isContabilizzato: true,
    date,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
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
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    const currentBalance = parseFloat(user.balance || "1000");
    const transaction = generateRandomTransaction(userId, currentBalance);
    const created = await storage.createTransaction(transaction);
    
    // For expenses, subtract the amount; for income, add it
    const amountValue = parseFloat(transaction.amount);
    const balanceChange = transaction.type === "expense" ? -amountValue : amountValue;
    const newBalance = (currentBalance + balanceChange).toFixed(2);
    await storage.updateUserBalance(userId, newBalance);
    
    return res.json({ transaction: created, newBalance });
  });

  app.post("/api/transactions", async (req, res) => {
    const transaction = req.body;
    
    if (!transaction.userId || !transaction.description || !transaction.amount) {
      return res.status(400).json({ error: "Dati transazione incompleti" });
    }
    
    const created = await storage.createTransaction(transaction);
    
    return res.json(created);
  });

  const httpServer = createServer(app);

  return httpServer;
}
