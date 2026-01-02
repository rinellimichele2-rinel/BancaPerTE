import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import Svg, { Path, G, Circle as SvgCircle } from "react-native-svg";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/Icon";
import { BankColors, Spacing, BorderRadius } from "@/constants/theme";
import type { Transaction } from "@shared/schema";

type TabType = "Uscite" | "Entrate";
type PeriodType = "MONTH" | "ULTIMI 12 MESI" | "TUTTO IL 2025" | "TUTTO IL 2026";

// Italian month names
const ITALIAN_MONTHS = [
  "GEN", "FEB", "MAR", "APR", "MAG", "GIU",
  "LUG", "AGO", "SET", "OTT", "NOV", "DIC"
];

const EXPENSE_CATEGORIES = [
  { id: "Casa", color: "#FF9800", icon: "home" },
  { id: "Trasporti", color: "#4CAF50", icon: "truck" },
  { id: "Famiglia", color: "#00BCD4", icon: "users" },
  { id: "Salute e benessere", color: "#F44336", icon: "heart" },
  { id: "Tempo libero", color: "#2196F3", icon: "star" },
  { id: "Altre uscite", color: "#9C27B0", icon: "more-horizontal" },
];

const INCOME_CATEGORIES = [
  { id: "Bonifici ricevuti", color: "#8B0000", icon: "arrow-up-right" },
  { id: "Entrate varie", color: "#FFB6C1", icon: "plus" },
  { id: "Regali ricevuti", color: "#4B0082", icon: "gift" },
  { id: "Rimborsi spese e storni", color: "#6495ED", icon: "rotate-ccw" },
];

function DonutChart({ 
  data, 
  total, 
  label,
  isExpense 
}: { 
  data: { category: string; amount: number; color: string }[];
  total: number;
  label: string;
  isExpense: boolean;
}) {
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentAngle = -90;
  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.amount / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...item, startAngle, angle, percentage };
  });

  const formatAmount = (amount: number) => {
    const formatted = amount.toFixed(2).replace(".", ",");
    const parts = formatted.split(",");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${isExpense ? "-" : "+"}${intPart},${parts[1]}`;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  return (
    <View style={styles.donutContainer}>
      <View style={styles.legendContainer}>
        {(isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => {
          const item = data.find(d => d.category === cat.id);
          if (!item || item.amount === 0) return null;
          return (
            <View key={cat.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>{cat.id}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <SvgCircle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
          />
          <G>
            {segments.map((segment, index) => {
              if (segment.angle <= 0) return null;
              const endAngle = segment.startAngle + Math.min(segment.angle - 0.5, segment.angle);
              return (
                <Path
                  key={index}
                  d={describeArc(center, center, radius, segment.startAngle, endAngle)}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="butt"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutLabel}>{label}</Text>
          <Text style={[styles.donutAmount, isExpense && styles.expenseText]}>
            {formatAmount(total)}
          </Text>
          <View style={styles.infoIcon}>
            <Icon name="info" size={16} color={BankColors.gray400} />
          </View>
        </View>
      </View>
    </View>
  );
}

function CategoryRow({ 
  category, 
  amount, 
  total, 
  color, 
  icon,
  isExpense,
  onPress 
}: { 
  category: string;
  amount: number;
  total: number;
  color: string;
  icon: string;
  isExpense: boolean;
  onPress: () => void;
}) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  const formattedAmount = `${isExpense ? "-" : "+"}${amount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} \u20AC`;

  return (
    <Pressable style={styles.categoryRow} onPress={onPress}>
      <View style={styles.categoryIconContainer}>
        <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category}</Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
      <View style={styles.categoryAmountContainer}>
        <Text style={[styles.categoryAmount, isExpense && styles.expenseText]}>
          {formattedAmount}
        </Text>
        <Icon name="chevron-right" size={16} color={BankColors.gray400} />
      </View>
    </Pressable>
  );
}

export default function AnalisiScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("Uscite");
  const [activePeriod, setActivePeriod] = useState<PeriodType>("MONTH");
  
  // Get server date for Europe/Rome timezone
  const { data: serverDate } = useQuery<{ currentMonth: number; currentYear: number }>({
    queryKey: ["/api/server-date"],
  });
  
  // Month navigation state (0-indexed for easier date math)
  // Initialize once from server date, then user controls navigation
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  // Initialize month state only once when server date first loads
  React.useEffect(() => {
    if (serverDate && !hasInitialized) {
      setSelectedMonth(serverDate.currentMonth - 1);
      setSelectedYear(serverDate.currentYear);
      setHasInitialized(true);
    }
  }, [serverDate, hasInitialized]);

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", userId],
    enabled: !!userId,
  });
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
    setActivePeriod("MONTH");
  };
  
  const getMonthLabel = () => {
    return `${ITALIAN_MONTHS[selectedMonth]} ${selectedYear}`;
  };

  const { categoryData, total, totalIncome, totalExpense } = useMemo(() => {
    const now = new Date();

    let filteredTransactions = transactions.filter(t => {
      const dateValue = t.date || t.createdAt;
      if (!dateValue) return false;
      const date = new Date(dateValue);
      if (activePeriod === "MONTH") {
        // Filter by selected month and year
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      } else if (activePeriod === "ULTIMI 12 MESI") {
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return date >= oneYearAgo;
      } else if (activePeriod === "TUTTO IL 2025") {
        return date.getFullYear() === 2025;
      } else if (activePeriod === "TUTTO IL 2026") {
        return date.getFullYear() === 2026;
      }
      return true;
    });

    const isExpenseTab = activeTab === "Uscite";
    const relevantTransactions = filteredTransactions.filter(
      t => isExpenseTab ? t.type === "expense" : t.type === "income"
    );

    const categories = isExpenseTab ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const categoryMap = new Map<string, number>();

    categories.forEach(cat => categoryMap.set(cat.id, 0));

    relevantTransactions.forEach(t => {
      const amount = Math.abs(parseFloat(t.amount));
      const category = t.category || (isExpenseTab ? "Altre uscite" : "Entrate varie");
      
      let matchedCategory = categories.find(c => c.id === category);
      if (!matchedCategory) {
        matchedCategory = categories[categories.length - 1];
      }
      
      categoryMap.set(matchedCategory.id, (categoryMap.get(matchedCategory.id) || 0) + amount);
    });

    const data = categories
      .map(cat => ({
        category: cat.id,
        amount: categoryMap.get(cat.id) || 0,
        color: cat.color,
        icon: cat.icon,
      }))
      .sort((a, b) => b.amount - a.amount);

    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

    const incomeTotal = filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const expenseTotal = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    return { 
      categoryData: data, 
      total: totalAmount,
      totalIncome: incomeTotal,
      totalExpense: expenseTotal,
    };
  }, [transactions, activeTab, activePeriod, selectedMonth, selectedYear]);

  const formatCurrency = (amount: number, isExpense: boolean) => {
    const formatted = amount.toFixed(2).replace(".", ",");
    const parts = formatted.split(",");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${isExpense ? "-" : "+"}${intPart},${parts[1]} \u20AC`;
  };

  const isExpense = activeTab === "Uscite";

  // Analisi uses ONLY transaction data - no aesthetic offsets from Home
  // This ensures data comes strictly from Transaction Console and Random generations

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={BankColors.primary} />
          <Text style={styles.backText}>Indietro</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Entrate e uscite</Text>
        <Pressable style={styles.helpButton}>
          <Icon name="help-circle" size={24} color={BankColors.primary} />
          <Text style={styles.helpText}>Aiuto</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.accountHeader}>
          <Text style={styles.accountLabel}>ANALISI TRANSAZIONI</Text>
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === "Uscite" && styles.activeTab]}
            onPress={() => setActiveTab("Uscite")}
          >
            <Text style={[styles.tabText, activeTab === "Uscite" && styles.activeTabText]}>
              Uscite
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "Entrate" && styles.activeTab]}
            onPress={() => setActiveTab("Entrate")}
          >
            <Text style={[styles.tabText, activeTab === "Entrate" && styles.activeTabText]}>
              Entrate
            </Text>
          </Pressable>
        </View>

        <DonutChart
          data={categoryData}
          total={total}
          label={isExpense ? "Uscite" : "Entrate"}
          isExpense={isExpense}
        />

        <Pressable style={styles.showTrendButton}>
          <Text style={styles.showTrendText}>MOSTRA ANDAMENTO</Text>
        </Pressable>

        <View style={styles.periodContainer}>
          <Pressable style={styles.periodArrow} onPress={() => navigateMonth('prev')}>
            <Icon name="chevron-left" size={24} color={BankColors.gray600} />
          </Pressable>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScrollContent}
          >
            <Pressable
              style={[styles.periodButton, activePeriod === "MONTH" && styles.activePeriod]}
              onPress={() => setActivePeriod("MONTH")}
            >
              <Text style={[styles.periodText, activePeriod === "MONTH" && styles.activePeriodText]}>
                {getMonthLabel()}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.periodButton, activePeriod === "ULTIMI 12 MESI" && styles.activePeriod]}
              onPress={() => setActivePeriod("ULTIMI 12 MESI")}
            >
              <Text style={[styles.periodText, activePeriod === "ULTIMI 12 MESI" && styles.activePeriodText]}>
                {"ULTIMI\n12 MESI"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.periodButton, activePeriod === "TUTTO IL 2025" && styles.activePeriod]}
              onPress={() => setActivePeriod("TUTTO IL 2025")}
            >
              <Text style={[styles.periodText, activePeriod === "TUTTO IL 2025" && styles.activePeriodText]}>
                TUTTO IL 2025
              </Text>
            </Pressable>
            <Pressable
              style={[styles.periodButton, activePeriod === "TUTTO IL 2026" && styles.activePeriod]}
              onPress={() => setActivePeriod("TUTTO IL 2026")}
            >
              <Text style={[styles.periodText, activePeriod === "TUTTO IL 2026" && styles.activePeriodText]}>
                TUTTO IL 2026
              </Text>
            </Pressable>
          </ScrollView>
          <Pressable style={styles.periodArrow} onPress={() => navigateMonth('next')}>
            <Icon name="chevron-right" size={24} color={BankColors.gray600} />
          </Pressable>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{isExpense ? "Uscite" : "Entrate"}</Text>
          <Text style={[styles.totalAmount, isExpense && styles.expenseText]}>
            {formatCurrency(total, isExpense)}
          </Text>
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>
              DETTAGLIO {isExpense ? "USCITE" : "ENTRATE"}
            </Text>
            <Pressable style={styles.sortButton}>
              <Text style={styles.sortText}>Ordina per: Importo</Text>
              <Icon name="chevron-down" size={16} color={BankColors.primary} />
            </Pressable>
          </View>

          {categoryData.filter(item => item.amount > 0).map((item) => (
            <CategoryRow
              key={item.category}
              category={item.category}
              amount={item.amount}
              total={total}
              color={item.color}
              icon={item.icon}
              isExpense={isExpense}
              onPress={() => {}}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankColors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  backText: {
    color: BankColors.primary,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: BankColors.gray900,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  helpText: {
    color: BankColors.primary,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  accountHeader: {
    backgroundColor: BankColors.gray100,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  accountLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: BankColors.gray700,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: BankColors.primary,
  },
  tabText: {
    fontSize: 15,
    color: BankColors.gray500,
  },
  activeTabText: {
    color: BankColors.primary,
    fontWeight: "600",
  },
  donutContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  legendContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: BankColors.gray700,
    flex: 1,
  },
  chartContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutLabel: {
    fontSize: 14,
    color: BankColors.gray600,
  },
  donutAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: BankColors.gray900,
  },
  expenseText: {
    color: BankColors.error,
  },
  infoIcon: {
    marginTop: Spacing.xs,
  },
  showTrendButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  showTrendText: {
    color: BankColors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  periodContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  periodArrow: {
    padding: Spacing.xs,
  },
  periodScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  periodButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  activePeriod: {
    backgroundColor: BankColors.gray100,
    borderRadius: BorderRadius.sm,
  },
  periodText: {
    fontSize: 12,
    color: BankColors.gray500,
    textAlign: "center",
  },
  activePeriodText: {
    color: BankColors.gray900,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: BankColors.gray200,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "500",
    color: BankColors.gray900,
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: "600",
    color: BankColors.success,
  },
  detailSection: {
    paddingTop: Spacing.md,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray200,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: BankColors.gray600,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  sortText: {
    fontSize: 13,
    color: BankColors.primary,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankColors.gray100,
  },
  categoryIconContainer: {
    marginRight: Spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  categoryName: {
    fontSize: 15,
    color: BankColors.gray900,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: BankColors.gray200,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  categoryAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: "500",
    color: BankColors.gray900,
  },
});
