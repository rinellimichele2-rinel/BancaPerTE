import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

const TRANSACTION_DESCRIPTIONS = [
  "Pagamento Tramite Pos",
  "Bonifico Ricevuto",
  "Prelievo ATM",
  "Ricarica Telefonica",
  "Pagamento Utenze",
  "Acquisto Online",
  "Ristorante",
  "Supermercato",
  "Farmacia",
  "Carburante",
  "Abbonamento",
  "Assicurazione",
  "Affitto",
  "Stipendio",
  "Rimborso",
];

const TRANSACTION_CATEGORIES = [
  "Pagamenti",
  "Trasporti",
  "Casa",
  "Tempo libero",
  "Salute e benessere",
  "Altre uscite",
  "Famiglia",
];

function generateRandomTransactions(userId: string, count: number = 5) {
  const transactions = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const isExpense = Math.random() > 0.3;
    const amount = isExpense 
      ? -(Math.random() * 100 + 1).toFixed(2)
      : (Math.random() * 500 + 10).toFixed(2);
    
    const description = TRANSACTION_DESCRIPTIONS[Math.floor(Math.random() * TRANSACTION_DESCRIPTIONS.length)];
    const category = TRANSACTION_CATEGORIES[Math.floor(Math.random() * TRANSACTION_CATEGORIES.length)];
    
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    transactions.push({
      userId,
      description,
      amount: amount.toString(),
      type: isExpense ? "expense" : "income",
      category,
      accountNumber: `Conto 1000/00002521`,
      isContabilizzato: Math.random() > 0.5,
      date,
    });
  }
  
  return transactions;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Username richiesto" });
    }
    
    let user = await storage.getUserByUsername(username);
    
    if (!user) {
      user = await storage.createUser({
        username,
        pin: "12345",
        fullName: username.toUpperCase(),
        accountNumber: `1000/${Math.floor(Math.random() * 100000).toString().padStart(8, "0")}`,
        balance: "1000.00",
        cardLastFour: Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
      });
    }
    
    return res.json({ userId: user.id, username: user.username });
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

  app.get("/api/transactions/:userId", async (req, res) => {
    const { userId } = req.params;
    
    const transactions = await storage.getTransactions(userId);
    
    return res.json(transactions);
  });

  app.post("/api/transactions/:userId/generate-random", async (req, res) => {
    const { userId } = req.params;
    const { count = 5 } = req.body;
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    
    const randomTransactions = generateRandomTransactions(userId, count);
    const created = await storage.createMultipleTransactions(randomTransactions);
    
    return res.json(created);
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
