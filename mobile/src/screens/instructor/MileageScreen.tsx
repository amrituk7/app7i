import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
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
  addMileageEntry,
  computeMileageAllowance,
  deleteMileageEntry,
  getMileageEntries,
  ukTaxYearBounds,
} from "../../services/ledgerService";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { MileageEntry } from "../../types";
import { formatGBP } from "../../utils/currency";
import { describeFirestoreError } from "../../utils/firestoreError";
import { hapticTap, hapticWarning } from "../../utils/haptics";

type Nav = { goBack: () => void };

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MileageScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      setEntries(await getMileageEntries(user.uid, { max: 200 }));
    } catch (err) {
      setError(describeFirestoreError(err, { action: "getMileageEntries" }));
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

  const taxYear = useMemo(() => ukTaxYearBounds(), []);
  const taxYearEntries = useMemo(
    () => entries.filter((e) => e.date >= taxYear.startIso && e.date <= taxYear.endIso),
    [entries, taxYear],
  );
  const taxYearMiles = useMemo(
    () => taxYearEntries.reduce((sum, e) => sum + (e.miles || 0), 0),
    [taxYearEntries],
  );
  const allowance = useMemo(() => computeMileageAllowance(taxYearMiles), [taxYearMiles]);
  const allMiles = useMemo(() => entries.reduce((sum, e) => sum + (e.miles || 0), 0), [entries]);

  function confirmDelete(entry: MileageEntry) {
    hapticWarning();
    Alert.alert(
      "Delete mileage?",
      `${entry.miles} miles on ${formatDate(entry.date)}. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMileageEntry(entry.id);
              setEntries((prev) => prev.filter((e) => e.id !== entry.id));
            } catch (err) {
              Alert.alert("Couldn't delete", describeFirestoreError(err, { action: "deleteMileageEntry" }));
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
          <Text style={styles.title}>Mileage</Text>
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

      <Card style={styles.allowanceCard}>
        <Text style={styles.allowanceLabel}>{taxYear.label.toUpperCase()} — HMRC ALLOWANCE</Text>
        <Text style={styles.allowanceValue}>{formatGBP(allowance.total)}</Text>
        <View style={styles.allowanceBreakdown}>
          <Text style={styles.allowanceLine}>
            {allowance.band45.miles.toLocaleString()} mi @ 45p = {formatGBP(allowance.band45.amount)}
          </Text>
          {allowance.band25.miles > 0 ? (
            <Text style={styles.allowanceLine}>
              {allowance.band25.miles.toLocaleString()} mi @ 25p = {formatGBP(allowance.band25.amount)}
            </Text>
          ) : null}
        </View>
        <Text style={styles.allowanceHelp}>
          HMRC simplified mileage: 45p/mile for first 10,000 business miles per tax year, 25p/mile thereafter. {allMiles.toLocaleString()} miles total logged in App7i.
        </Text>
      </Card>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : null}

      {loading ? null : entries.length === 0 ? (
        <EmptyState
          iconName="speedometer-outline"
          title="Log every business mile"
          message="Pickup loops, lesson driving, drop-offs — all count. HMRC currently lets ADIs claim 45p/mile (first 10,000) instead of fuel + wear-and-tear."
          actionLabel="Add first trip"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              onLongPress={() => confirmDelete(entry)}
              delayLongPress={400}
              style={({ pressed }) => [styles.row, pressed && styles.pressedRow]}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="navigate-outline" size={18} color={c.emeraldDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {entry.miles} {entry.miles === 1 ? "mile" : "miles"}
                </Text>
                <Text style={styles.rowMeta}>
                  {formatDate(entry.date)}
                  {entry.description ? ` · ${entry.description}` : ""}
                </Text>
              </View>
              <Text style={styles.rowAmount}>
                {formatGBP(computeMileageAllowance(entry.miles).total)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.legalNote}>
        Long-press a trip to delete. Figures are based on HMRC's published simplified-expenses rates and are for guidance only — you remain responsible for accurate self-assessment.
      </Text>

      <AddMileageSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={(entry) => {
          setEntries((prev) => [entry, ...prev]);
          setAddOpen(false);
        }}
      />
    </Screen>
  );
}

function AddMileageSheet({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (entry: MileageEntry) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [miles, setMiles] = useState("");
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMiles("");
      setDate(todayIso());
      setDescription("");
    }
  }, [open]);

  async function submit() {
    if (!user?.uid) return;
    const parsed = parseFloat(miles.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      Alert.alert("Miles required", "Enter the trip distance in miles.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Date format", "Use YYYY-MM-DD.");
      return;
    }
    setSubmitting(true);
    try {
      const id = await addMileageEntry({
        instructorId: user.uid,
        date,
        miles: parsed,
        description: description.trim() || undefined,
      });
      onAdded({
        id,
        instructorId: user.uid,
        date,
        miles: parsed,
        description: description.trim() || undefined,
        createdAt: Date.now(),
      });
    } catch (err) {
      Alert.alert("Couldn't save", describeFirestoreError(err, { action: "addMileageEntry" }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Log mileage</Text>

          <Text style={styles.label}>Miles</Text>
          <TextInput
            value={miles}
            onChangeText={setMiles}
            keyboardType="decimal-pad"
            placeholder="e.g. 38"
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
            placeholder="e.g. 3 lessons across Hayes"
            placeholderTextColor={c.slate300}
            style={styles.input}
          />

          <View style={styles.sheetActions}>
            <AppButton label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <AppButton
              label={submitting ? "Saving…" : "Save trip"}
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
    kicker: { color: c.slate500, fontSize: 11, fontWeight: "600", letterSpacing: 0.8 },
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
    allowanceCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    allowanceLabel: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.6,
    },
    allowanceValue: {
      color: c.emerald,
      fontSize: 36,
      fontWeight: "700",
      letterSpacing: -0.8,
      marginTop: 4,
    },
    allowanceBreakdown: {
      marginTop: 8,
      gap: 4,
    },
    allowanceLine: { color: c.slate700, fontSize: 13, fontWeight: "500" },
    allowanceHelp: {
      color: c.slate500,
      fontSize: 11,
      lineHeight: 16,
      marginTop: spacing.sm,
    },
    errorCard: { backgroundColor: c.redSoft, marginBottom: spacing.md },
    errorText: { color: c.red, fontSize: 13, fontWeight: "600" },
    list: { gap: spacing.sm },
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
    rowAmount: { color: c.emerald, fontSize: 15, fontWeight: "700" },
    legalNote: {
      color: c.slate500,
      fontSize: 11,
      lineHeight: 16,
      marginTop: spacing.lg,
      textAlign: "center",
    },
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
