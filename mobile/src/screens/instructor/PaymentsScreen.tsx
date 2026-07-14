import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pill } from "../../components/ui/Pill";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import {
  getLessonPayments,
  setLessonPaymentStatus,
} from "../../services/dataService";
import { sendStudentPaymentReminder } from "../../services/paymentService";
import type {
  LessonPayment,
  PaymentMethod,
  PaymentStatus,
} from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { formatGBP } from "../../utils/currency";

type Filter = "review" | "unpaid" | "paid" | "waived" | "all";
type Route = { params?: { lessonId?: string } };

const FILTERS: { key: Filter; label: string }[] = [
  { key: "review", label: "Review" },
  { key: "unpaid", label: "Unpaid" },
  { key: "paid", label: "Paid" },
  { key: "waived", label: "Waived" },
  { key: "all", label: "All" },
];

const METHODS: { key: Exclude<PaymentMethod, null>; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "bank", label: "Bank" },
  { key: "card", label: "Card" },
  { key: "package", label: "Package" },
];

export function PaymentsScreen({
  route,
}: {
  route?: Route;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [payments, setPayments] = useState<LessonPayment[]>([]);
  const [filter, setFilter] = useState<Filter>("review");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LessonPayment | null>(null);
  const [draftStatus, setDraftStatus] = useState<PaymentStatus>("pending");
  const [draftMethod, setDraftMethod] = useState<PaymentMethod>("cash");
  const [saving, setSaving] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const openEditor = useCallback((payment: LessonPayment) => {
    setSelected(payment);
    setDraftStatus(payment.status);
    setDraftMethod(payment.method || "cash");
  }, []);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const next = await getLessonPayments(user.uid, 250);
      setPayments(next);
      const requestedId = route?.params?.lessonId;
      if (requestedId) {
        const requested = next.find((payment) => payment.id === requestedId);
        if (requested) openEditor(requested);
      }
    } catch (err) {
      setError(toFriendlyError(err));
    }
  }, [openEditor, route?.params?.lessonId, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const counts = useMemo(() => ({
    review: payments.filter((payment) => payment.status === "pending").length,
    unpaid: payments.filter((payment) => payment.status === "unpaid").length,
    paid: payments.filter((payment) => payment.status === "paid").length,
    waived: payments.filter((payment) => payment.status === "waived").length,
  }), [payments]);

  const visible = useMemo(() => {
    if (filter === "all") return payments;
    if (filter === "review") return payments.filter((payment) => payment.status === "pending");
    return payments.filter((payment) => payment.status === filter);
  }, [filter, payments]);

  const waitingTotal = useMemo(
    () => payments
      .filter((payment) => payment.status === "pending" || payment.status === "unpaid")
      .reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );

  async function savePayment() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await setLessonPaymentStatus(
        selected.id,
        draftStatus,
        draftStatus === "paid" ? draftMethod : null,
      );
      const updated: LessonPayment = {
        ...selected,
        status: draftStatus,
        method: draftStatus === "paid" ? draftMethod : null,
      };
      setPayments((current) => current.map((payment) => (
        payment.id === selected.id ? updated : payment
      )));
      setSelected(null);
      if (draftStatus === "unpaid") {
        Alert.alert(
          "Payment marked unpaid",
          "Send the student a reminder now?",
          [
            { text: "Not now", style: "cancel" },
            { text: "Send reminder", onPress: () => void sendReminder(updated) },
          ],
        );
      }
    } catch (err) {
      Alert.alert("Payment did not save", toFriendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function sendReminder(payment: LessonPayment) {
    if (remindingId) return;
    setRemindingId(payment.id);
    try {
      const result = await sendStudentPaymentReminder(payment.id);
      const sentAt = Date.now();
      setPayments((current) => current.map((item) => (
        item.id === payment.id
          ? { ...item, reminderSentAt: sentAt, reminderCount: result.reminderCount }
          : item
      )));
      if (result.delivery === "handoff" && result.phone && result.message) {
        const target = result.phone.replace(/\s+/g, "");
        const url = `sms:${target}?body=${encodeURIComponent(result.message)}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Reminder ready", result.message);
        }
        return;
      }
      Alert.alert(
        "Reminder sent",
        result.delivery === "email"
          ? "The student received the reminder by email."
          : result.emailSent
          ? "The student received an in-app reminder and email."
          : "The student received an in-app reminder.",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/cooldown|already sent|recently/i.test(message)) {
        Alert.alert("Reminder already sent", "Wait until tomorrow before sending another reminder.");
      } else {
        Alert.alert("Reminder did not send", toFriendlyError(err));
      }
    } finally {
      setRemindingId(null);
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={c.slate900} />
        </View>
      </Screen>
    );
  }

  return (
    <>
      <Screen
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.slate900} />
        }
      >
        <View style={styles.intro}>
          <Text style={styles.kicker}>EARNINGS</Text>
          <Text style={styles.title}>Lesson payments</Text>
          <Text style={styles.copy}>
            Record what happened after each lesson. App7i does not collect student payments.
          </Text>
        </View>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.summaryRow}>
          <Summary label="To review" value={String(counts.review)} />
          <Summary label="Unpaid" value={String(counts.unpaid)} />
          <Summary label="Waiting" value={formatGBP(waitingTotal)} />
        </View>

        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filter, active && styles.filterActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <EmptyState
            iconName="checkmark-circle-outline"
            title={filter === "review" ? "Nothing to review" : `No ${filter} payments`}
            message="Lesson payment records appear here when their lesson date arrives."
          />
        ) : (
          <View style={styles.list}>
            {visible.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                reminding={remindingId === payment.id}
                onEdit={() => openEditor(payment)}
                onRemind={() => void sendReminder(payment)}
              />
            ))}
          </View>
        )}
      </Screen>

      <PaymentEditor
        payment={selected}
        status={draftStatus}
        method={draftMethod}
        saving={saving}
        onStatus={setDraftStatus}
        onMethod={setDraftMethod}
        onClose={() => !saving && setSelected(null)}
        onSave={() => void savePayment()}
      />
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function PaymentRow({
  payment,
  reminding,
  onEdit,
  onRemind,
}: {
  payment: LessonPayment;
  reminding: boolean;
  onEdit: () => void;
  onRemind: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Card style={styles.row}>
      <Pressable onPress={onEdit} style={styles.rowMain} accessibilityRole="button">
        <View style={styles.rowIcon}>
          <Ionicons name={statusIcon(payment.status)} size={18} color={c.slate900} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowName} numberOfLines={1}>{payment.studentName}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {formatDate(payment.lessonDate, payment.lessonTime)}
            {payment.method ? ` - ${methodLabel(payment.method)}` : ""}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>{formatGBP(payment.amount)}</Text>
          <Pill label={statusLabel(payment.status)} tone={statusTone(payment.status)} />
        </View>
      </Pressable>
      {payment.status === "unpaid" ? (
        <Pressable
          onPress={onRemind}
          disabled={reminding}
          style={({ pressed }) => [styles.reminderButton, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={16} color={c.slate900} />
          <Text style={styles.reminderText}>
            {reminding
              ? "Sending..."
              : payment.reminderSentAt
                ? "Send another reminder"
                : "Send reminder"}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function PaymentEditor({
  payment,
  status,
  method,
  saving,
  onStatus,
  onMethod,
  onClose,
  onSave,
}: {
  payment: LessonPayment | null;
  status: PaymentStatus;
  method: PaymentMethod;
  saving: boolean;
  onStatus: (status: PaymentStatus) => void;
  onMethod: (method: PaymentMethod) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Modal visible={Boolean(payment)} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{payment?.studentName || "Lesson payment"}</Text>
              <Text style={styles.sheetMeta}>
                {payment ? `${formatDate(payment.lessonDate, payment.lessonTime)} - ${formatGBP(payment.amount)}` : ""}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={c.slate900} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>STATUS</Text>
          <View style={styles.statusGrid}>
            {(["pending", "paid", "unpaid", "waived"] as PaymentStatus[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => onStatus(item)}
                style={[styles.statusOption, status === item && styles.statusOptionActive]}
              >
                <Ionicons
                  name={statusIcon(item)}
                  size={18}
                  color={status === item ? c.background : c.slate700}
                />
                <Text style={[styles.statusOptionText, status === item && styles.statusOptionTextActive]}>
                  {statusLabel(item)}
                </Text>
              </Pressable>
            ))}
          </View>

          {status === "paid" ? (
            <>
              <Text style={styles.fieldLabel}>HOW IT WAS PAID</Text>
              <View style={styles.methodRow}>
                {METHODS.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => onMethod(item.key)}
                    style={[styles.method, method === item.key && styles.methodActive]}
                  >
                    <Text style={[styles.methodText, method === item.key && styles.methodTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Pressable
            onPress={onSave}
            disabled={saving}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, saving && styles.disabled]}
          >
            {saving ? <ActivityIndicator color={c.background} /> : <Text style={styles.saveText}>Save payment status</Text>}
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function statusLabel(status: PaymentStatus) {
  if (status === "paid") return "Paid";
  if (status === "unpaid") return "Unpaid";
  if (status === "waived") return "Waived";
  return "Pending";
}

function statusTone(status: PaymentStatus): "success" | "warning" | "neutral" | "info" {
  if (status === "paid") return "success";
  if (status === "unpaid") return "warning";
  if (status === "waived") return "neutral";
  return "info";
}

function statusIcon(status: PaymentStatus): React.ComponentProps<typeof Ionicons>["name"] {
  if (status === "paid") return "checkmark-circle-outline";
  if (status === "unpaid") return "alert-circle-outline";
  if (status === "waived") return "remove-circle-outline";
  return "time-outline";
}

function methodLabel(method: PaymentMethod) {
  return METHODS.find((item) => item.key === method)?.label || "";
}

function formatDate(date: string, time?: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const label = Number.isNaN(parsed.getTime())
    ? date || "Date to confirm"
    : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return time ? `${label} at ${time}` : label;
}

function toFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/permission|denied/i.test(message)) return "Your session cannot update this lesson. Sign out and back in.";
  return message || "Check your connection and try again.";
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: { flex: 1, minHeight: 280, alignItems: "center", justifyContent: "center" },
  intro: { marginBottom: spacing.lg },
  kicker: { color: c.slate500, fontSize: 11, fontWeight: "700" },
  title: { color: c.slate900, fontSize: 30, lineHeight: 36, fontWeight: "700", marginTop: 3 },
  copy: { color: c.slate500, fontSize: 13, lineHeight: 19, fontWeight: "500", marginTop: 6 },
  errorCard: { backgroundColor: c.redSoft, marginBottom: spacing.md },
  errorText: { color: c.red, fontSize: 13, fontWeight: "600" },
  summaryRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  summary: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: c.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    gap: 4,
  },
  summaryLabel: { color: c.slate500, fontSize: 10, fontWeight: "700" },
  summaryValue: { color: c.slate900, fontSize: 20, fontWeight: "700" },
  filters: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: c.surfaceMuted,
    marginBottom: spacing.md,
  },
  filter: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 9 },
  filterActive: { backgroundColor: c.slate900 },
  filterText: { color: c.slate500, fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: c.background },
  list: { gap: spacing.sm },
  row: { padding: 0, overflow: "hidden" },
  rowMain: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: c.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  rowName: { color: c.slate900, fontSize: 15, fontWeight: "700" },
  rowMeta: { color: c.slate500, fontSize: 11, fontWeight: "500" },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowAmount: { color: c.slate900, fontSize: 15, fontWeight: "700" },
  reminderButton: {
    minHeight: 42,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  reminderText: { color: c.slate900, fontSize: 12, fontWeight: "700" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: c.surface,
  },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: c.slate300, alignSelf: "center", marginBottom: spacing.md },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  sheetTitle: { color: c.slate900, fontSize: 20, fontWeight: "700" },
  sheetMeta: { color: c.slate500, fontSize: 12, marginTop: 3 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.surfaceMuted, alignItems: "center", justifyContent: "center" },
  fieldLabel: { color: c.slate500, fontSize: 10, fontWeight: "700", marginBottom: spacing.sm },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  statusOption: {
    width: "48%",
    minHeight: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: c.surfaceRaised,
  },
  statusOptionActive: { backgroundColor: c.slate900, borderColor: c.slate900 },
  statusOptionText: { color: c.slate700, fontSize: 13, fontWeight: "700" },
  statusOptionTextActive: { color: c.background },
  methodRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  method: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  methodActive: { backgroundColor: c.slate900 },
  methodText: { color: c.slate500, fontSize: 11, fontWeight: "700" },
  methodTextActive: { color: c.background },
  saveButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: c.slate900,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: c.background, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
});
