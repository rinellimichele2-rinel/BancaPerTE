import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";
import { getApiUrl } from "@/lib/query-client";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";

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

interface NewsResponse {
  news: NewsArticle[];
  generatedAt: string;
  personalized: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Mercati: "#10B981",
  Economia: "#3B82F6",
  Risparmio: "#F59E0B",
  Banche: "#6366F1",
  Crypto: "#8B5CF6",
  Immobiliare: "#EC4899",
  Lavoro: "#14B8A6",
  Fisco: "#EF4444",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 60) {
    return `${diffMins} min fa`;
  } else if (diffHours < 24) {
    return `${diffHours} ore fa`;
  } else {
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  }
}

function NewsCard({ article }: { article: NewsArticle }) {
  const categoryColor = CATEGORY_COLORS[article.category] || BankColors.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.newsCard,
        pressed && styles.newsCardPressed,
      ]}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={styles.newsHeader}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryColor + "20" },
          ]}
        >
          <Icon name={article.icon} size={14} color={categoryColor} />
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {article.category}
          </Text>
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(article.publishedAt)}</Text>
      </View>

      <Text style={styles.newsTitle}>{article.title}</Text>
      <Text style={styles.newsSummary}>{article.summary}</Text>

      <View style={styles.newsFooter}>
        <Text style={styles.newsSource}>{article.source}</Text>
        <View style={styles.relevanceContainer}>
          <Icon name="target" size={12} color={BankColors.gray400} />
          <Text style={styles.relevanceText}>
            {article.relevanceScore}% rilevante
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const { userId, user } = useAuth();

  const { data, isLoading, isRefetching, refetch } = useQuery<NewsResponse>({
    queryKey: ["/api/news", userId],
    queryFn: async () => {
      const balance = user?.balance ? parseFloat(user.balance) : 1000;
      const url = `${getApiUrl()}/api/news?userId=${userId || ""}&balance=${balance}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refetch();
  }, [refetch]);

  const news = data?.news || [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={BankColors.primary}
          />
        }
      >
        {data?.personalized ? (
          <View style={styles.personalizedBanner}>
            <Icon name="sparkles" size={16} color={BankColors.primary} />
            <Text style={styles.personalizedText}>
              Notizie personalizzate in base alle tue abitudini finanziarie
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BankColors.primary} />
            <Text style={styles.loadingText}>
              Caricamento notizie personalizzate...
            </Text>
          </View>
        ) : news.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={48} color={BankColors.gray400} />
            <Text style={styles.emptyText}>Nessuna notizia disponibile</Text>
            <Pressable style={styles.refreshButton} onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>Riprova</Text>
            </Pressable>
          </View>
        ) : (
          news.map((article) => <NewsCard key={article.id} article={article} />)
        )}

        {data?.generatedAt ? (
          <Text style={styles.generatedAt}>
            Aggiornato:{" "}
            {new Date(data.generatedAt).toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankColors.gray100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  personalizedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankColors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  personalizedText: {
    flex: 1,
    fontSize: 13,
    color: BankColors.primary,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: BankColors.gray500,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: BankColors.gray500,
  },
  refreshButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: BankColors.primary,
    borderRadius: BorderRadius.md,
  },
  refreshButtonText: {
    color: BankColors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  newsCard: {
    backgroundColor: BankColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BankColors.gray200,
  },
  newsCardPressed: {
    backgroundColor: BankColors.gray50,
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeAgo: {
    fontSize: 12,
    color: BankColors.gray500,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BankColors.gray900,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  newsSummary: {
    fontSize: 14,
    color: BankColors.gray600,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  newsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newsSource: {
    fontSize: 12,
    color: BankColors.gray500,
    fontStyle: "italic",
  },
  relevanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  relevanceText: {
    fontSize: 11,
    color: BankColors.gray400,
  },
  generatedAt: {
    textAlign: "center",
    fontSize: 12,
    color: BankColors.gray400,
    marginTop: Spacing.lg,
  },
});
