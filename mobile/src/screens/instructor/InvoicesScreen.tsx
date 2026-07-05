import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListRow } from "../../components/ui/ListRow";
import { Pill } from "../../components/ui/Pill";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getLessonInvoices } from "../../services/dataService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Invoice } from "../../types";
import { formatGBP } from "../../utils/currency";

function statusTone(status: Invoice["status"]) {
  if (status === "paid") return "success";
  if (status === "overdue") return "danger";
  return "warning";
}

function statusLabel(status: Invoice["status"] | undefined): string {
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "unpaid") return "Unpaid";
  return "Pending"; // defensive fallback so the Pill never renders empty
}

const DUPLICATE_WINDOW_MS = 36 * 60 * 60 * 1000;

/** Mark consecutive same-student invoices that are <36h apart as "possibly duplicate".
 *  Helps catch manual booking mistakes (e.g. two entries on consecutive days when
 *  the rest of the series is weekly). */
function detectDuplicateIds(invoices: Invoice[]): Set<string> {
  const byStudent = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    const key = inv.studentName || "Unknown";
    (byStudent.get(key) || byStudent.set(key, []).get(key)!).push(inv);
  }
  const flagged = new Set<string>();
  byStudent.forEach((list) => {
    const sorted = [...list].sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    for (let i = 1; i < sorted.length; i++) {
      const a = new Date(`${sorted[i - 1].dueDate}T00:00:00`).getTime();
      const b = new Date(`${sorted[i].dueDate}T00:00:00`).getTime();
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const gap = Math.abs(b - a);
      if (gap > 0 && gap < DUPLICATE_WINDOW_MS) {
        flagged.add(sorted[i - 1].id);
        flagged.add(sorted[i].id);
      }
    }
  });
  return flagged;
}

export function InvoicesScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      setInvoices(await getLessonInvoices(user.uid, 100));
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading invoices. Pull down to retry."));
    }
  }, [user?.uid]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const duplicateIds = useMemo(() => detectDuplicateIds(invoices), [invoices]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <Text style={styles.title}>Invoices</Text>
      <Text style={styles.copy}>Lessons marked as invoiced in Firestore.</Text>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {invoices.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title="Invoices start with paid lessons"
          message="Mark a lesson invoiced and the student, date, amount and status appear here."
        />
      ) : (
        <Card>
          {invoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceRow}>
              <ListRow
                title={invoice.studentName}
                subtitle={`${invoice.dueDate || "No date"} · ${invoice.id}`}
                right={formatGBP(invoice.amount)}
              />
              <Pill label={invoice.status} tone={statusTone(invoice.status)} />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) {
    return "Looks like you don't have access. Sign out and back in?";
  }
  return fallback;
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  title: {
    color: c.slate900,
    fontSize: 30,
    fontWeight: "700",
  },
  copy: {
    color: c.slate500,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  invoiceRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  errorCard: {
    backgroundColor: c.redSoft,
    marginBottom: spacing.md,
  },
  errorText: {
    color: c.red,
    fontSize: 13,
    fontWeight: "700",
  },
});
