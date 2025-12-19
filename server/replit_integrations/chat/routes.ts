import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const FINANCIAL_ADVISOR_SYSTEM_PROMPT = `Sei un consulente finanziario AI personale della banca Intesa Sanpaolo. 
Il tuo nome è "Assistente Intesa".

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

export function registerChatRoutes(app: Express): void {
  // Get all conversations for a user
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const conversations = await chatStorage.getAllConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title, userId } = req.body;
      const conversation = await chatStorage.createConversation(title || "Nuova Conversazione", userId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (non-streaming for mobile compatibility)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, userContext } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: FINANCIAL_ADVISOR_SYSTEM_PROMPT + (userContext ? `\n\nContesto utente: ${userContext}` : "") },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Get response from OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 1024,
      });

      const assistantResponse = completion.choices[0]?.message?.content || "Mi scuso, non sono riuscito a elaborare una risposta.";

      // Save assistant message
      const savedMessage = await chatStorage.createMessage(conversationId, "assistant", assistantResponse);

      res.json({ message: savedMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
}
