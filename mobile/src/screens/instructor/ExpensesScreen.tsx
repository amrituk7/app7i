import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  EXPENSE_CATEGORY_LABELS,
  addExpense,
  deleteExpense,
  getExpenses,
} from "../../services/ledgerService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Expense, ExpenseCategory } from "../../types";
import { formatGBP } from "../../utils/currency";
import { hapticTap, hapticWarning } from "../../utils/haptics";

type Nav = { goBack: () => void };
type IoniconName = ComponentProps<typeof Ionicons>["name"];

const CATEGORY_ORDER: ExpenseCategory[] = [
  "fuel",
  "insurance",
  "mot",
  "service",
  "tax",
  "adi_badge",
  "training",
  "phone",
  "marketing",
  "other",
];

const CATEGORY_ICON: Record<ExpenseCategory, IoniconName> = {
  fuel: "car-outline",
  insurance: "shield-checkmark-outline",
  mot: "construct-outline",
  service: "build-outline",
  tax: "document-text-outline",
  adi_badge: "ribbon-outline",
  training: "school-outline",
  phone: "phone-portrait-outline",
  marketing: "megaphone-outline",
  other: "ellipsis-horizontal-circle-outline",
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ExpensesScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      setExpenses(await getExpenses(user.uid, { max: 200 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load expenses.");
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

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const byCat = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount);
    }
    return { total, byCat };
  }, [expenses]);

  function confirmDelete(expense: Expense) {
    hapticWarning();
    Alert.alert(
      "Delete expense?",
      `${formatGBP(expense.amount)} — ${expense.description || EXPENSE_CATEGORY_LABELS[expense.category]}. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpense(expense.id);
              setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
            } catch (err) {
              Alert.alert("Couldn't delete", err instanceof Error ? err.message : "Try again.");
            }
          },
        },
      ],
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={c.emerald} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>BUSINESS LEDGER</Text>
          <Text style={styles.title}>Expenses</Text>
        </View>
        <Pressable
          onPress={() => {
            hapticTap();
            setAddOpen(true);
          }}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={20} color={c.white} />
        </Pressable>
      </View>

      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOTAL TRACKED</Text>
        <Text style={styles.totalValue}>{formatGBP(totals.total)}</Text>
        <Text style={styles.totalHelper}>
          {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
        </Text>
      </Card>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {loading ? null : expenses.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title="Track every business expense"
          message="Fuel, insurance, MOT, ADI badge fees — log them here so the Earnings screen can show your real profit and so your tax-year summary is accurate."
          actionLabel="Add first expense"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <View style={styles.list}>
          {expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} onLongPress={() => confirmDelete(expense)} />
          ))}
        </View>
      )}

      <Text style={styles.legalNote}>
        Long-press an entry to delete. App7i records these on your behalf — they are not submitted to HMRC. You remain responsible for your own tax filing.
      </Text>

      <AddExpenseSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={(expense) => {
          setExpenses((prev) => [expense, ...prev]);
          setAddOpen(false);
        }}
      />
    </Screen>
  );
}

function ExpenseRow({ expense, onLongPress }: { expense: Expense; onLongPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [styles.row, pressed && styles.pressedRow]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={CATEGORY_ICON[expense.category]} size={18} color={c.emeraldDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{expense.description || EXPENSE_CATEGORY_LABELS[expense.category]}</Text>
        <Text style={styles.rowMeta}>
          {EXPENSE_CATEGORY_LABELS[expense.category]} · {formatDate(expense.date)}
        </Text>
      </View>
      <Text style={styles.rowAmount}>{formatGBP(expense.amount)}</Text>
    </Pressable>
  );
}

function AddExpenseSheet({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (expense: Expense) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [category, setCategory] = useState<ExpenseCategory>("fuel");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory("fuel");
      setAmount("");
      setDescription("");
      setDate(todayIso());
    }
  }, [open]);

  async function submit() {
    if (!user?.uid) return;
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      Alert.alert("Amount required", "Enter the amount in pounds (e.g. 42.50).");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Date format", "Use YYYY-MM-DD (e.g. 2026-06-14).");
      return;
    }
    setSubmitting(true);
    try {
      const id = await addExpense({
        instructorId: user.uid,
        date,
        category,
        amount: parsed,
        description: description.trim(),
      });
      onAdded({
        id,
        instructorId: user.uid,
        date,
        category,
        amount: parsed,
        description: description.trim(),
        createdAt: Date.now(),
      });
    } catch (err) {
      Alert.alert("Couldn't save", err instanceof Error ? err.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add expense</Text>

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CATEGORY_ORDER.map((cat) => {
              const selected = cat === category;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={CATEGORY_ICON[cat]}
                    size={14}
                    color={selected ? c.white : c.emeraldDark}
                  />
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                    {EXPENSE_CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Amount (£)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={c.slate300}
            style={styles.input}
          />

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="2026-06-14"
            placeholderTextColor={c.slate300}
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Esso fuel — Hayes BP"
            placeholderTextColor={c.slate300}
            style={styles.input}
          />

          <View style={styles.sheetActions}>
            <AppButton label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <AppButton
              label={submitting ? "Saving…" : "Save expense"}
              onPress={submit}
              disabled={submitting}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    kicker: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.8,
    },
    title: {
      color: c.slate900,
      fontSize: 28,
      fontWeight: "700",
      letterSpacing: -0.5,
      marginTop: 2,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.emerald,
    },
    totalCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    totalLabel: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.6,
    },
    totalValue: {
      color: c.slate900,
      fontSize: 36,
      fontWeight: "700",
      letterSpacing: -0.8,
      marginTop: 4,
    },
    totalHelper: {
      color: c.slate500,
      fontSize: 13,
      marginTop: 2,
    },
    errorCard: {
      backgroundColor: c.redSoft,
      marginBottom: spacing.md,
    },
    errorText: { color: c.red, fontSize: 13, fontWeight: "600" },
    list: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: c.surface,
      minHeight: 56,
    },
    pressedRow: { opacity: 0.7 },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.emeraldSoft,
    },
    rowTitle: { color: c.slate900, fontSize: 15, fontWeight: "600" },
    rowMeta: { color: c.slate500, fontSize: 12, marginTop: 2 },
    rowAmount: { color: c.slate900, fontSize: 15, fontWeight: "700" },
    legalNote: {
      color: c.slate500,
      fontSize: 11,
      lineHeight: 16,
      marginTop: spacing.lg,
      textAlign: "center",
    },
    // Sheet
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.slate300,
      alignSelf: "center",
      marginBottom: spacing.md,
    },
    sheetTitle: {
      color: c.slate900,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: spacing.md,
    },
    label: {
      color: c.slate700,
      fontSize: 13,
      fontWeight: "600",
      marginTop: spacing.md,
      marginBottom: 6,
    },
    chipRow: { flexDirection: "row" },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.emeraldSoft,
      marginRight: 6,
    },
    chipActive: { backgroundColor: c.emerald },
    chipText: { color: c.emeraldDark, fontSize: 13, fontWeight: "600" },
    chipTextActive: { color: c.white },
    input: {
      height: 48,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.md,
      color: c.slate900,
      fontSize: 16,
    },
    sheetActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    pressed: { opacity: 0.7 },
  });
