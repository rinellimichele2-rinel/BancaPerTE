import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { db } from "../../db";
import { transactions } from "../../../shared/schema";
import { eq, desc } from "drizzle-orm";

const openai = new OpenAI({
  apiKey:
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key-for-local-dev",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  relevanceScore: number;
  source: string;
  publishedAt: string;
  icon: string;
}

const FINANCIAL_NEWS_TOPICS = [
  {
    category: "Mercati",
    icon: "trending-up",
    topics: [
      "Borsa Italiana",
      "FTSE MIB",
      "mercati azionari europei",
      "Wall Street",
    ],
  },
  {
    category: "Economia",
    icon: "globe",
    topics: [
      "PIL Italia",
      "inflazione",
      "BCE tassi interesse",
      "economia europea",
    ],
  },
  {
    category: "Risparmio",
    icon: "piggy-bank",
    topics: [
      "conti deposito",
      "buoni fruttiferi",
      "investimenti sicuri",
      "rendimenti",
    ],
  },
  {
    category: "Banche",
    icon: "building",
    topics: ["banche italiane", "mutui", "prestiti", "fintech"],
  },
  {
    category: "Crypto",
    icon: "cpu",
    topics: ["Bitcoin", "criptovalute", "blockchain", "ETF crypto"],
  },
  {
    category: "Immobiliare",
    icon: "home",
    topics: ["mercato immobiliare", "mutui casa", "affitti", "prezzi case"],
  },
  {
    category: "Lavoro",
    icon: "briefcase",
    topics: ["occupazione Italia", "pensioni", "INPS", "stipendi"],
  },
  {
    category: "Fisco",
    icon: "file-text",
    topics: ["tasse", "dichiarazione redditi", "bonus fiscali", "detrazioni"],
  },
];

async function generatePersonalizedNews(
  userId: string | null,
  userBalance: number,
): Promise<NewsArticle[]> {
  let spendingCategories: string[] = [];

  if (userId) {
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(50);

    const categoryCount: Record<string, number> = {};
    userTransactions.forEach((tx) => {
      categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
    });

    spendingCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prompt = `Sei un esperto giornalista finanziario italiano. Genera 8 notizie finanziarie realistiche e attuali per un utente di una app bancaria italiana.

Data di oggi: ${dateStr}
Saldo utente: €${userBalance.toFixed(2)}
Categorie di spesa principali dell'utente: ${spendingCategories.length > 0 ? spendingCategories.join(", ") : "varie"}

Genera notizie personalizzate che siano rilevanti per questo profilo utente. Le notizie devono essere:
- Realistiche e plausibili per il mercato italiano attuale
- Variate tra diverse categorie (mercati, risparmio, economia, banche, immobiliare, lavoro)
- Alcune positive, alcune neutre
- Scritte in modo professionale ma accessibile

Rispondi SOLO con un array JSON valido (senza markdown, senza commenti). Ogni oggetto deve avere:
{
  "title": "titolo breve della notizia (max 80 caratteri)",
  "summary": "riassunto della notizia in 2-3 frasi (max 200 caratteri)",
  "category": "una tra: Mercati, Economia, Risparmio, Banche, Crypto, Immobiliare, Lavoro, Fisco",
  "relevanceScore": numero da 1 a 100 indicante rilevanza per questo utente,
  "source": "nome fonte credibile italiana (es: Il Sole 24 Ore, Milano Finanza, ANSA Economia)"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || "[]";
    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const newsItems = JSON.parse(cleanContent);

    return newsItems.map((item: any, index: number) => {
      const categoryInfo =
        FINANCIAL_NEWS_TOPICS.find((t) => t.category === item.category) ||
        FINANCIAL_NEWS_TOPICS[0];
      return {
        id: `news-${Date.now()}-${index}`,
        title: item.title,
        summary: item.summary,
        category: item.category,
        relevanceScore: item.relevanceScore,
        source: item.source,
        publishedAt: new Date(
          Date.now() - Math.random() * 24 * 60 * 60 * 1000,
        ).toISOString(),
        icon: categoryInfo.icon,
      };
    });
  } catch (error) {
    console.error("Error generating news:", error);
    return getDefaultNews();
  }
}

function getDefaultNews(): NewsArticle[] {
  const now = new Date();
  return [
    {
      id: "default-1",
      title: "FTSE MIB chiude in rialzo: banche protagoniste",
      summary:
        "La Borsa di Milano chiude positiva trainata dal comparto bancario. I titoli del settore tra i migliori della giornata.",
      category: "Mercati",
      relevanceScore: 85,
      source: "Il Sole 24 Ore",
      publishedAt: now.toISOString(),
      icon: "trending-up",
    },
    {
      id: "default-2",
      title: "BCE: tassi invariati, focus su inflazione",
      summary:
        "La Banca Centrale Europea mantiene i tassi di interesse stabili. Lagarde: 'Monitoreremo attentamente i dati sull'inflazione'.",
      category: "Economia",
      relevanceScore: 90,
      source: "ANSA Economia",
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      icon: "globe",
    },
    {
      id: "default-3",
      title: "Conti deposito: rendimenti in aumento",
      summary:
        "Le banche italiane alzano i tassi sui conti deposito. Opportunità interessanti per i risparmiatori.",
      category: "Risparmio",
      relevanceScore: 95,
      source: "Milano Finanza",
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      icon: "piggy-bank",
    },
    {
      id: "default-4",
      title: "Mercato immobiliare: prezzi stabili nel 2024",
      summary:
        "L'Osservatorio del Mercato Immobiliare conferma la stabilizzazione dei prezzi nelle principali città italiane.",
      category: "Immobiliare",
      relevanceScore: 75,
      source: "Idealista News",
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      icon: "home",
    },
  ];
}

export function registerNewsRoutes(app: Express): void {
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string | undefined;
      const balance = parseFloat(req.query.balance as string) || 1000;

      const news = await generatePersonalizedNews(userId || null, balance);

      res.json({
        news: news.sort((a, b) => b.relevanceScore - a.relevanceScore),
        generatedAt: new Date().toISOString(),
        personalized: !!userId,
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/categories", (req: Request, res: Response) => {
    res.json(
      FINANCIAL_NEWS_TOPICS.map((t) => ({
        category: t.category,
        icon: t.icon,
      })),
    );
  });
}
