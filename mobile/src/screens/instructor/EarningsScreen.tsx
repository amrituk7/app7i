import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { FadeInView } from "../../components/ui/FadeInView";
import { Screen } from "../../components/ui/Screen";
import { Skeleton, SkeletonRow } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { getOpenLessonPayments, getPaidLessonPayments } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { LessonPayment } from "../../types";
import { formatGBP } from "../../utils/currency";
import {
  buildMonthlyStatements,
  buildRangeStatement,
  statementToCSV,
  statementToPDF,
  statementToPlainText,
  type MonthlyStatement,
} from "../../utils/monthlyStatements";
import { hapticTap } from "../../utils/haptics";
import { ensureStatementReminderScheduled } from "../../services/statementReminder";
import { saveStatementFile } from "../../services/statementDownload";
import {
  computeMileageAllowance,
  getExpenses,
  getMileageEntries,
  ukTaxYearBounds,
} from "../../services/ledgerService";
import type { Expense, MileageEntry } from "../../types";

type MobileNavigation = {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

type EarningsTrendPoint = {
  key: string;
  label: string;
  total: number;
  count: number;
};

// Months kept fully in-app. Anything older shows in a compact "Archive" stack
// with a stronger download prompt — once exported, the user has their own copy.
const RECENT_MONTHS_KEPT = 3;

export function EarningsScreen({ navigation }: { navigation: MobileNavigation }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [paidPayments, setPaidPayments] = useState<LessonPayment[]>([]);
  const [openPayments, setOpenPayments] = useState<LessonPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [mileageEntries, setMileageEntries] = useState<MileageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const [paid, unpaid, exp, mil] = await Promise.all([
        getPaidLessonPayments(user.uid, 200),
        getOpenLessonPayments(user.uid, 100),
        getExpenses(user.uid, { max: 200 }).catch(() => []),
        getMileageEntries(user.uid, { max: 200 }).catch(() => []),
      ]);
      setPaidPayments(paid);
      setOpenPayments(unpaid);
      setExpenses(exp);
      setMileageEntries(mil);
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading earnings. Pull down to retry."));
    }
  }, [user?.uid]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // Schedule the monthly download reminder. Runs idempotently.
    void ensureStatementReminderScheduled();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const statements = useMemo(() => buildMonthlyStatements(paidPayments), [paidPayments]);

  const currentMonth = statements.find((s) => s.isCurrent) || null;
  const lastMonth = statements.find((s) => s.monthsAgo === 1) || null;
  const recentStatements = statements.filter((s) => s.monthsAgo < RECENT_MONTHS_KEPT);
  const archiveStatements = statements.filter((s) => s.monthsAgo >= RECENT_MONTHS_KEPT);

  const unpaidTotal = useMemo(
    () => openPayments.reduce((sum, payment) => sum + payment.amount, 0),
    [openPayments],
  );

  const monthDelta = useMemo(() => {
    const current = currentMonth?.total || 0;
    const previous = lastMonth?.total || 0;
    const absolute = current - previous;
    const percent = previous > 0 ? Math.round((absolute / previous) * 100) : null;
    return { current, previous, absolute, percent };
  }, [currentMonth, lastMonth]);

  const allTimeTotal = useMemo(
    () => paidPayments.reduce((sum, payment) => sum + payment.amount, 0),
    [paidPayments],
  );

  const earningsTrend = useMemo(() => buildSixMonthTrend(statements), [statements]);
  const sixMonthReceived = earningsTrend.reduce((sum, point) => sum + point.total, 0);
  const sixMonthPaidLessons = earningsTrend.reduce((sum, point) => sum + point.count, 0);
  const averageLessonValue = sixMonthPaidLessons > 0 ? sixMonthReceived / sixMonthPaidLessons : 0;

  // Tax-year-scoped figures for the net profit summary. Mileage allowance is
  // calculated using HMRC's simplified expenses bands (45p / 25p).
  const ledgerSummary = useMemo(() => {
    const taxYear = ukTaxYearBounds();
    const inYear = <T extends { date: string }>(items: T[]) =>
      items.filter((i) => i.date >= taxYear.startIso && i.date <= taxYear.endIso);

    const yearRevenue = inYear(paidPayments.map((payment) => ({ ...payment, date: payment.lessonDate })))
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const yearExpenseTotal = inYear(expenses).reduce((sum, e) => sum + (e.amount || 0), 0);
    const yearMiles = inYear(mileageEntries).reduce((sum, m) => sum + (m.miles || 0), 0);
    const allowance = computeMileageAllowance(yearMiles);
    const netProfit = yearRevenue - yearExpenseTotal - allowance.total;
    return {
      taxYearLabel: taxYear.label,
      yearRevenue,
      yearExpenseTotal,
      yearMiles,
      mileageAllowance: allowance.total,
      netProfit,
    };
  }, [paidPayments, expenses, mileageEntries]);

  const handleShareStatement = useCallback(
    async (statement: MonthlyStatement) => {
      hapticTap();
      setExportingKey(statement.key);
      try {
        const pdfBase64 = statementToPDF(statement, user?.displayName || undefined);
        const safeMonth = statement.shortLabel.replace(/\s+/g, "_");
        const filename = `App7i_Statement_${safeMonth}.pdf`;
        const result = await saveStatementFile({
          filename,
          content: pdfBase64,
          mimeType: "application/pdf",
          base64: true,
        });

        if (result.kind === "saved") {
          Alert.alert(
            "Statement saved",
            `Saved to ${result.location}. Open it from your file manager to view the PDF.`,
          );
        } else if (result.kind === "unavailable") {
          // Native save path isn't available — fall back to share-as-text so the
          // user still gets something usable.
          const summary = statementToPlainText(statement, user?.displayName || undefined);
          const csv = statementToCSV(statement, user?.displayName || undefined);
          await Share.share(
            {
              title: `Earnings statement — ${statement.label}`,
              message: `${summary}\n\n--- CSV ---\n${csv}`,
            },
            { dialogTitle: `Share ${statement.label} statement` },
          );
        }
        // "shared" (iOS) and "cancelled" — silent, the OS sheet handled the UX.
      } catch (err) {
        Alert.alert(
          "Couldn't save statement",
          err instanceof Error ? err.message : "Try again in a moment.",
        );
      } finally {
        setExportingKey(null);
      }
    },
    [user?.displayName],
  );

  if (loading) {
    return (
      <Screen>
        <EarningsSkeleton />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emeraldDark} />
      }
    >
      {/* Bank-style header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>STATEMENT</Text>
          <Text style={styles.title}>Earnings</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate("Payments")}
          style={({ pressed }) => [styles.ledgerBtn, pressed && styles.pressed]}
          accessibilityLabel="Review lesson payments"
        >
          <Ionicons name="receipt-outline" size={18} color={c.slate900} />
          <Text style={styles.ledgerBtnText}>Payments</Text>
        </Pressable>
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {/* Hero balance panel */}
      <BalancePanel
        currentLabel={currentMonth?.label || thisMonthLabel()}
        currentTotal={monthDelta.current}
        lastLabel={lastMonth?.shortLabel || lastMonthShortLabel()}
        lastTotal={monthDelta.previous}
        delta={monthDelta.absolute}
        deltaPercent={monthDelta.percent}
        unpaidTotal={unpaidTotal}
        allTimeTotal={allTimeTotal}
      />

      <PaymentReviewPanel
        payments={openPayments}
        onOpen={() => navigation.navigate("Payments")}
      />

      <PerformancePanel
        points={earningsTrend}
        averageLessonValue={averageLessonValue}
        paidLessonCount={sixMonthPaidLessons}
        received={sixMonthReceived}
        waiting={unpaidTotal}
      />

      {/* Business ledger — expenses, mileage, net profit */}
      <LedgerPanel
        summary={ledgerSummary}
        onOpenExpenses={() => navigation.navigate("Expenses")}
        onOpenMileage={() => navigation.navigate("Mileage")}
        onDownloadTaxYear={async () => {
          if (!user?.uid) return;
          setExportingKey("tax-year");
          try {
            const taxYear = ukTaxYearBounds();
            const statement = buildRangeStatement(paidPayments, {
              label: `${taxYear.label} — Earnings`,
              shortLabel: taxYear.label,
              startIso: taxYear.startIso,
              endIso: taxYear.endIso,
            });
            const pdf = statementToPDF(statement, user.displayName || undefined);
            const safeLabel = taxYear.label.replace(/[^a-zA-Z0-9]+/g, "_");
            const result = await saveStatementFile({
              filename: `App7i_${safeLabel}_Earnings.pdf`,
              content: pdf,
              mimeType: "application/pdf",
              base64: true,
            });
            if (result.kind === "saved") {
              Alert.alert(
                "Tax year summary saved",
                `Saved to ${result.location}. Keep it for your self-assessment records.`,
              );
            }
          } catch (err) {
            Alert.alert(
              "Couldn't save",
              err instanceof Error ? err.message : "Try again in a moment.",
            );
          } finally {
            setExportingKey(null);
          }
        }}
        exporting={exportingKey === "tax-year"}
      />

      {/* Statements list */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>RECENT STATEMENTS</Text>
        <Text style={styles.sectionMeta}>
          {recentStatements.length} of {RECENT_MONTHS_KEPT} months
        </Text>
      </View>

      {recentStatements.length === 0 ? (
        <EmptyState
          iconName="wallet-outline"
          title="First lesson, first £"
          message="Mark a lesson paid and your monthly statement starts here."
          actionLabel="Book a lesson"
          onAction={() => navigation.navigate("BookLesson")}
        />
      ) : (
        <View style={styles.statementsList}>
          {recentStatements.map((statement, index) => (
            <FadeInView key={statement.key} delay={index * 60}>
              <StatementCard
                statement={statement}
                onShare={() => handleShareStatement(statement)}
                exporting={exportingKey === statement.key}
              />
            </FadeInView>
          ))}
        </View>
      )}

      {/* Archive notice */}
      {archiveStatements.length > 0 ? (
        <>
          <View style={styles.archiveBanner}>
            <View style={styles.archiveIcon}>
              <Ionicons name="archive-outline" size={18} color={c.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.archiveTitle}>
                {archiveStatements.length} older statement
                {archiveStatements.length === 1 ? "" : "s"}
              </Text>
              <Text style={styles.archiveCopy}>
                These remain available here. Download a PDF when you need a permanent copy.
              </Text>
            </View>
          </View>
          <View style={styles.statementsList}>
            {archiveStatements.map((statement, index) => (
              <FadeInView key={statement.key} delay={index * 60}>
                <ArchiveRow
                  statement={statement}
                  onShare={() => handleShareStatement(statement)}
                  exporting={exportingKey === statement.key}
                />
              </FadeInView>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function BalancePanel({
  currentLabel,
  currentTotal,
  lastLabel,
  lastTotal,
  delta,
  deltaPercent,
  unpaidTotal,
  allTimeTotal,
}: {
  currentLabel: string;
  currentTotal: number;
  lastLabel: string;
  lastTotal: number;
  delta: number;
  deltaPercent: number | null;
  unpaidTotal: number;
  allTimeTotal: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const isUp = delta > 0;
  const isFlat = delta === 0 && lastTotal === 0;

  return (
    <Card style={styles.balanceCard}>
      <View style={styles.balanceTopRow}>
        <Text style={styles.balanceLabel}>{currentLabel.toUpperCase()}</Text>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceBadgeText}>£</Text>
        </View>
      </View>
      <Text style={styles.balanceAmount}>{formatGBP(currentTotal)}</Text>

      {!isFlat ? (
        <View style={styles.balanceDeltaRow}>
          <Ionicons
            name={isUp ? "trending-up" : "trending-down"}
            size={14}
            color={isUp ? c.green : c.amber}
          />
          <Text style={[styles.balanceDeltaText, isUp ? styles.deltaUp : styles.deltaDown]}>
            {delta >= 0 ? "+" : ""}
            {formatGBP(delta)}
            {deltaPercent !== null
              ? ` (${deltaPercent > 0 ? "+" : ""}${deltaPercent}%)`
              : ""}
          </Text>
          <Text style={styles.balanceDeltaContext}> vs {lastLabel}</Text>
        </View>
      ) : (
        <Text style={styles.balanceDeltaContext}>First month of activity</Text>
      )}

      <View style={styles.balanceDivider} />

      <View style={styles.balanceFooter}>
        <View style={styles.balanceFooterCell}>
          <Text style={styles.balanceFooterLabel}>Outstanding</Text>
          <Text style={[styles.balanceFooterValue, unpaidTotal > 0 && styles.balanceFooterValueWarn]}>
            {formatGBP(unpaidTotal)}
          </Text>
        </View>
        <View style={styles.balanceFooterCell}>
          <Text style={styles.balanceFooterLabel}>All time</Text>
          <Text style={styles.balanceFooterValue}>{formatGBP(allTimeTotal)}</Text>
        </View>
      </View>
    </Card>
  );
}

function PaymentReviewPanel({
  payments,
  onOpen,
}: {
  payments: LessonPayment[];
  onOpen: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const pending = payments.filter((payment) => payment.status === "pending").length;
  const unpaid = payments.filter((payment) => payment.status === "unpaid").length;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.paymentReviewCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Open lesson payment review"
    >
      <View style={styles.paymentReviewIcon}>
        <Ionicons name="checkmark-done-outline" size={20} color={c.slate900} />
      </View>
      <View style={styles.paymentReviewCopy}>
        <Text style={styles.paymentReviewTitle}>Lesson payments</Text>
        <Text style={styles.paymentReviewBody}>
          {payments.length === 0
            ? "Everything is marked for now"
            : `${pending} to review · ${unpaid} unpaid`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.slate300} />
    </Pressable>
  );
}

function PerformancePanel({
  points,
  averageLessonValue,
  paidLessonCount,
  received,
  waiting,
}: {
  points: EarningsTrendPoint[];
  averageLessonValue: number;
  paidLessonCount: number;
  received: number;
  waiting: number;
}) {
  const styles = useThemedStyles(makeStyles);
  const max = Math.max(...points.map((point) => point.total), 0);

  return (
    <Card style={styles.performanceCard}>
      <View style={styles.performanceHeader}>
        <View>
          <Text style={styles.performanceKicker}>PERFORMANCE</Text>
          <Text style={styles.performanceTitle}>Last 6 months</Text>
        </View>
        <Text style={styles.performanceMeta}>Paid lessons</Text>
      </View>

      <View style={styles.chart} accessibilityLabel="Earnings over the last six months">
        {points.map((point) => {
          const barHeight = max > 0 ? Math.max(4, Math.round((point.total / max) * 72)) : 3;
          return (
            <View key={point.key} style={styles.chartColumn}>
              <View style={styles.chartBarTrack}>
                <View style={[styles.chartBar, { height: barHeight }]} />
              </View>
              <Text style={styles.chartLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.performanceStats}>
        <PerformanceStat label="Avg lesson" value={formatGBP(averageLessonValue)} />
        <PerformanceStat label="Paid lessons" value={String(paidLessonCount)} />
        <PerformanceStat label="Received" value={formatGBP(received)} />
        <PerformanceStat label="Waiting" value={formatGBP(waiting)} warning={waiting > 0} />
      </View>
    </Card>
  );
}

function PerformanceStat({
  label,
  value,
  warning,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.performanceStat}>
      <Text style={styles.performanceStatLabel}>{label}</Text>
      <Text style={[styles.performanceStatValue, warning && styles.performanceStatWarning]}>
        {value}
      </Text>
    </View>
  );
}

function LedgerPanel({
  summary,
  onOpenExpenses,
  onOpenMileage,
  onDownloadTaxYear,
  exporting,
}: {
  summary: {
    taxYearLabel: string;
    yearRevenue: number;
    yearExpenseTotal: number;
    yearMiles: number;
    mileageAllowance: number;
    netProfit: number;
  };
  onOpenExpenses: () => void;
  onOpenMileage: () => void;
  onDownloadTaxYear: () => void;
  exporting: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const profitNegative = summary.netProfit < 0;
  return (
    <Card style={styles.ledgerCard}>
      <View style={styles.ledgerHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ledgerKicker}>{summary.taxYearLabel.toUpperCase()} · ESTIMATED NET PROFIT</Text>
          <Text style={[styles.ledgerProfit, profitNegative && styles.ledgerProfitNeg]}>
            {formatGBP(summary.netProfit)}
          </Text>
        </View>
      </View>
      <View style={styles.ledgerBreakdown}>
        <View style={styles.ledgerLine}>
          <Text style={styles.ledgerLabel}>Revenue (paid)</Text>
          <Text style={styles.ledgerValue}>{formatGBP(summary.yearRevenue)}</Text>
        </View>
        <View style={styles.ledgerLine}>
          <Text style={styles.ledgerLabel}>Expenses tracked</Text>
          <Text style={styles.ledgerValueMuted}>{formatDeduction(summary.yearExpenseTotal)}</Text>
        </View>
        <View style={styles.ledgerLine}>
          <Text style={styles.ledgerLabel}>
            Mileage allowance ({summary.yearMiles.toLocaleString()} mi)
          </Text>
          <Text style={styles.ledgerValueMuted}>{formatDeduction(summary.mileageAllowance)}</Text>
        </View>
      </View>
      <View style={styles.ledgerActions}>
        <Pressable
          onPress={onOpenExpenses}
          style={({ pressed }) => [styles.ledgerActionBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="View expenses"
        >
          <View style={styles.ledgerActionIcon}>
            <Ionicons name="receipt-outline" size={19} color={c.emeraldDark} />
          </View>
          <Text style={styles.ledgerActionBtnText} numberOfLines={1}>
            Expenses
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenMileage}
          style={({ pressed }) => [styles.ledgerActionBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="View mileage"
        >
          <View style={styles.ledgerActionIcon}>
            <Ionicons name="speedometer-outline" size={19} color={c.emeraldDark} />
          </View>
          <Text style={styles.ledgerActionBtnText} numberOfLines={1}>
            Mileage
          </Text>
        </Pressable>
        <Pressable
          onPress={onDownloadTaxYear}
          disabled={exporting}
          style={({ pressed }) => [
            styles.ledgerActionBtn,
            pressed && !exporting && styles.pressed,
            exporting && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Download tax year PDF"
        >
          <View style={styles.ledgerActionIcon}>
            <Ionicons
              name={exporting ? "hourglass-outline" : "download-outline"}
              size={19}
              color={c.emeraldDark}
            />
          </View>
          <Text style={styles.ledgerActionBtnText} numberOfLines={1}>
            {exporting ? "Saving…" : "Tax PDF"}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.ledgerDisclaimer}>
        Estimate only. Includes HMRC simplified mileage allowance (45p / 25p). Not tax advice — verify against your bank records before filing.
      </Text>
    </Card>
  );
}

function StatementCard({
  statement,
  onShare,
  exporting,
}: {
  statement: MonthlyStatement;
  onShare: () => void;
  exporting: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Card style={styles.statementCard}>
      <View style={styles.statementHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.statementMonth}>{statement.label}</Text>
          <Text style={styles.statementMeta}>
            {statement.count} paid {statement.count === 1 ? "lesson" : "lessons"} ·{" "}
            {statement.uniqueStudents}{" "}
            {statement.uniqueStudents === 1 ? "student" : "students"}
          </Text>
        </View>
        {statement.isCurrent ? (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.statementTotal}>{formatGBP(statement.total)}</Text>

      <View style={styles.statementActions}>
        <Pressable
          onPress={onShare}
          disabled={exporting}
          style={({ pressed }) => [
            styles.downloadBtn,
            pressed && !exporting && styles.pressed,
            exporting && styles.disabled,
          ]}
        >
          <Ionicons
            name={exporting ? "hourglass-outline" : "download-outline"}
            size={16}
            color={c.emeraldDark}
          />
          <Text style={styles.downloadBtnText}>
            {exporting ? "Preparing…" : "Download statement"}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

function ArchiveRow({
  statement,
  onShare,
  exporting,
}: {
  statement: MonthlyStatement;
  onShare: () => void;
  exporting: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      onPress={exporting ? undefined : onShare}
      style={({ pressed }) => [
        styles.archiveRow,
        pressed && !exporting && styles.pressed,
      ]}
    >
      <View style={styles.archiveRowIcon}>
        <Ionicons name="document-text-outline" size={18} color={c.slate600} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.archiveRowMonth}>{statement.shortLabel}</Text>
        <Text style={styles.archiveRowMeta}>
          {statement.count} {statement.count === 1 ? "lesson" : "lessons"} ·{" "}
          {formatGBP(statement.total)}
        </Text>
      </View>
      <View style={styles.archiveAction}>
        <Ionicons
          name={exporting ? "hourglass-outline" : "download-outline"}
          size={18}
          color={c.amber}
        />
      </View>
    </Pressable>
  );
}

function EarningsSkeleton() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Skeleton width={90} height={11} borderRadius={999} style={styles.skeletonGap} />
          <Skeleton width={150} height={30} borderRadius={999} />
        </View>
        <Skeleton width={88} height={36} borderRadius={18} />
      </View>
      <Skeleton height={170} borderRadius={16} style={styles.skeletonBalance} />
      <View style={styles.skeletonList}>
        {[0, 1, 2].map((item) => (
          <SkeletonRow key={item} />
        ))}
      </View>
    </View>
  );
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

function thisMonthLabel(): string {
  return new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function lastMonthShortLabel(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function buildSixMonthTrend(statements: MonthlyStatement[], now = new Date()): EarningsTrendPoint[] {
  const byMonth = new Map(statements.map((statement) => [statement.key, statement]));
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleDateString("en-GB", { month: "short" }),
      total: byMonth.get(key)?.total || 0,
      count: byMonth.get(key)?.count || 0,
    };
  });
}

function formatDeduction(value: number): string {
  return value > 0 ? `-${formatGBP(value)}` : formatGBP(0);
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    kicker: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0,
    },
    title: {
      color: c.slate900,
      fontSize: 30,
      fontWeight: "700",
      letterSpacing: 0,
      marginTop: 2,
    },
    ledgerBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    ledgerBtnText: {
      color: c.slate900,
      fontSize: 14,
      fontWeight: "700",
    },
    errorCard: {
      backgroundColor: c.redSoft,
      marginBottom: spacing.md,
    },
    errorText: {
      color: c.red,
      fontSize: 13,
      fontWeight: "600",
    },

    // Balance hero card
    balanceCard: {
      marginBottom: spacing.lg,
      padding: spacing.lg,
      backgroundColor: c.surfaceRaised,
      borderRadius: 20,
    },
    balanceTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    balanceLabel: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0,
    },
    balanceBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    balanceBadgeText: {
      color: c.slate900,
      fontSize: 16,
      fontWeight: "700",
    },
    balanceAmount: {
      color: c.slate900,
      fontSize: 40,
      fontWeight: "700",
      letterSpacing: 0,
      lineHeight: 46,
    },
    balanceDeltaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    balanceDeltaText: {
      fontSize: 13,
      fontWeight: "600",
    },
    balanceDeltaContext: {
      color: c.slate500,
      fontSize: 12,
      fontWeight: "400",
      marginTop: 4,
    },
    deltaUp: { color: c.green },
    deltaDown: { color: c.amber },
    balanceDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: spacing.md,
    },
    balanceFooter: {
      flexDirection: "row",
      gap: spacing.lg,
    },
    balanceFooterCell: {
      flex: 1,
    },
    balanceFooterLabel: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0,
    },
    balanceFooterValue: {
      color: c.slate900,
      fontSize: 17,
      fontWeight: "600",
      marginTop: 4,
    },
    paymentReviewCard: {
      minHeight: 72,
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 16,
      backgroundColor: c.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    paymentReviewIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    paymentReviewCopy: {
      flex: 1,
      gap: 3,
    },
    paymentReviewTitle: {
      color: c.slate900,
      fontSize: 15,
      fontWeight: "700",
    },
    paymentReviewBody: {
      color: c.slate500,
      fontSize: 12,
      fontWeight: "600",
    },

    // Six-month performance
    performanceCard: {
      marginBottom: spacing.lg,
      padding: spacing.lg,
      backgroundColor: c.surfaceRaised,
    },
    performanceHeader: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    performanceKicker: {
      color: c.slate500,
      fontSize: 10,
      fontWeight: "700",
    },
    performanceTitle: {
      color: c.slate900,
      fontSize: 18,
      fontWeight: "700",
      marginTop: 3,
    },
    performanceMeta: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "600",
    },
    chart: {
      height: 110,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    chartColumn: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 6,
    },
    chartBarTrack: {
      height: 72,
      width: "100%",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    chartBar: {
      width: "58%",
      minWidth: 8,
      maxWidth: 24,
      borderRadius: 4,
      backgroundColor: c.slate900,
    },
    chartLabel: {
      color: c.slate500,
      fontSize: 10,
      fontWeight: "600",
    },
    performanceStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: spacing.md,
      rowGap: spacing.md,
    },
    performanceStat: {
      width: "50%",
      gap: 3,
    },
    performanceStatLabel: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "600",
    },
    performanceStatValue: {
      color: c.slate900,
      fontSize: 16,
      fontWeight: "700",
    },
    performanceStatWarning: {
      color: c.amber,
    },
    // Ledger panel
    ledgerCard: {
      marginBottom: spacing.lg,
      padding: spacing.lg,
      backgroundColor: c.surfaceRaised,
      borderRadius: 20,
    },
    ledgerHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    ledgerKicker: {
      color: c.slate500,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0,
    },
    ledgerProfit: {
      color: c.slate900,
      fontSize: 32,
      fontWeight: "700",
      letterSpacing: 0,
      marginTop: 4,
      lineHeight: 38,
    },
    ledgerProfitNeg: { color: c.amber },
    ledgerBreakdown: {
      gap: 6,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    ledgerLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    ledgerLabel: { color: c.slate600, fontSize: 13, flex: 1 },
    ledgerValue: { color: c.slate900, fontSize: 13, fontWeight: "600" },
    ledgerValueMuted: { color: c.slate500, fontSize: 13, fontWeight: "500" },
    ledgerActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    ledgerActionBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 14,
      backgroundColor: c.surfaceMuted,
    },
    ledgerActionIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
    },
    ledgerActionBtnText: {
      color: c.slate900,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    ledgerDisclaimer: {
      color: c.slate500,
      fontSize: 10,
      lineHeight: 14,
      marginTop: spacing.sm,
    },
    balanceFooterValueWarn: {
      color: c.amber,
    },

    // Section labels
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingHorizontal: 2,
      marginBottom: spacing.sm,
    },
    sectionLabel: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0,
    },
    sectionMeta: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "400",
    },

    // Statement cards
    statementsList: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    statementCard: {
      gap: spacing.sm,
      backgroundColor: c.surfaceRaised,
      borderRadius: 16,
    },
    statementHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    statementMonth: {
      color: c.slate900,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0,
    },
    statementMeta: {
      color: c.slate500,
      fontSize: 12,
      fontWeight: "400",
      marginTop: 2,
    },
    currentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: c.emeraldSoft,
    },
    currentBadgeText: {
      color: c.emeraldDark,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0,
    },
    statementTotal: {
      color: c.slate900,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: 0,
      marginTop: 4,
    },
    statementActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    downloadBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.surfaceMuted,
    },
    downloadBtnText: {
      color: c.slate900,
      fontSize: 13,
      fontWeight: "700",
    },

    // Archive
    archiveBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 14,
      backgroundColor: c.amberSoft,
      marginBottom: spacing.md,
    },
    archiveIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
    },
    archiveTitle: {
      color: c.amber,
      fontSize: 14,
      fontWeight: "600",
    },
    archiveCopy: {
      color: c.amber,
      fontSize: 12,
      fontWeight: "400",
      marginTop: 2,
      opacity: 0.85,
    },
    archiveRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    archiveRowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
    },
    archiveRowMonth: {
      color: c.slate900,
      fontSize: 15,
      fontWeight: "600",
    },
    archiveRowMeta: {
      color: c.slate500,
      fontSize: 12,
      fontWeight: "400",
      marginTop: 2,
    },
    archiveAction: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.amberSoft,
    },

    // Skeleton
    skeletonGap: {
      marginBottom: spacing.sm,
    },
    skeletonBalance: {
      marginBottom: spacing.lg,
    },
    skeletonList: {
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: c.surface,
    },

    pressed: {
      opacity: 0.7,
    },
    disabled: {
      opacity: 0.55,
    },
  });
