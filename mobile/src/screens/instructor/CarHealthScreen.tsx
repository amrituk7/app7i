import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { getCarDetails, saveCarDetails } from "../../services/dataService";
import type { CarDetails, CarFuelType } from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const FUEL_TYPES: { value: CarFuelType; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

const EMPTY_CAR: CarDetails = {
  make: "",
  model: "",
  year: "",
  registration: "",
  colour: "",
  fuelType: "petrol",
  insuranceExpiry: "",
  motExpiry: "",
  taxExpiry: "",
  adiBadgeExpiry: "",
  lastServiceDate: "",
  nextServiceDate: "",
  tyreCheckDate: "",
  brakeCheckDate: "",
  oilCheckDate: "",
  mileage: "",
  notes: "",
  serviceLog: [],
};

// Accepts the ways people actually type dates — 14/08/2026, 14-08-2026,
// 14.08.26, or ISO 2026-08-14 — and returns ISO YYYY-MM-DD ("" if unreadable).
// The status cards AND the backend MOT/insurance reminders both need ISO, but
// the edit form is free text, so UK-style input used to save fine and then
// silently show as "not set".
function parseFlexibleDate(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";

  let year = 0;
  let month = 0;
  let day = 0;

  const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  const uk = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (uk) {
    day = Number(uk[1]);
    month = Number(uk[2]);
    year = Number(uk[3]);
    if (year < 100) year += 2000;
  } else {
    return "";
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1990 || year > 2100) return "";
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysUntil(dateStr: string): number | null {
  const isoStr = parseFlexibleDate(dateStr);
  if (!isoStr) return null;
  const target = new Date(`${isoStr}T12:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12));
  return Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}

function statusKind(days: number | null): "ok" | "warn" | "expired" | "none" {
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 30) return "warn";
  return "ok";
}

function daysLabel(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)}d over`;
  if (days === 0) return "TODAY";
  return `${days}d`;
}

function statusCaption(days: number | null): string {
  if (days === null) return "not set";
  if (days < 0) return "EXPIRED";
  if (days <= 30) return "due soon";
  return "valid";
}

function formatDate(dateStr: string): string {
  const isoStr = parseFlexibleDate(dateStr);
  if (!isoStr) return dateStr || "—";
  const parts = isoStr.split("-");
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function initials(car: CarDetails | null): string {
  if (!car?.make && !car?.model) return "CAR";
  const m = car.make?.[0]?.toUpperCase() ?? "";
  const mo = car.model?.[0]?.toUpperCase() ?? "";
  return (m + mo) || "CAR";
}

// ─── Status card ─────────────────────────────────────────────────────────────

type StatusCardProps = {
  label: string;
  icon: IoniconName;
  dateStr: string;
};

function StatusCard({ label, icon, dateStr }: StatusCardProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const days = daysUntil(dateStr);
  const kind = statusKind(days);

  const palette = {
    ok:      { bg: c.emeraldSoft, accent: c.emeraldDark },
    warn:    { bg: c.amberSoft,   accent: c.amber },
    expired: { bg: c.redSoft,     accent: c.red },
    none:    { bg: c.surfaceMuted, accent: c.slate300 },
  }[kind];

  return (
    <View style={[styles.statusCard, { backgroundColor: palette.bg }]}>
      <View style={[styles.statusIconWrap, { backgroundColor: palette.accent + "22" }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>
      <Text style={[styles.statusLabel, { color: palette.accent }]}>{label}</Text>
      <Text style={[styles.statusDays, { color: palette.accent }]}>{daysLabel(days)}</Text>
      <Text style={[styles.statusCaption, { color: palette.accent }]}>{statusCaption(days)}</Text>
    </View>
  );
}

// ─── Detail row ──────────────────────────────────────────────────────────────

function DetailRow({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color={c.emeraldDark} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Field in edit form ───────────────────────────────────────────────────────

function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  multiline,
  numeric,
  autoCapitalize,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={c.slate300}
        multiline={multiline}
        keyboardType={numeric ? "numeric" : "default"}
        autoCapitalize={autoCapitalize ?? (multiline ? "sentences" : "words")}
        autoCorrect={!!multiline}
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
      />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function CarHealthScreen() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();

  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CarDetails>(EMPTY_CAR);
  const [saving, setSaving] = useState(false);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const details = await getCarDetails(user.uid);
      if (details) {
        // Auto-heal dates saved in UK format by older app versions: normalise
        // to ISO so the status cards AND backend reminders read them again.
        const healed = {
          insuranceExpiry: parseFlexibleDate(details.insuranceExpiry) || details.insuranceExpiry,
          motExpiry: parseFlexibleDate(details.motExpiry) || details.motExpiry,
          taxExpiry: parseFlexibleDate(details.taxExpiry) || details.taxExpiry,
          adiBadgeExpiry: parseFlexibleDate(details.adiBadgeExpiry) || details.adiBadgeExpiry,
          lastServiceDate: parseFlexibleDate(details.lastServiceDate) || details.lastServiceDate,
          nextServiceDate: parseFlexibleDate(details.nextServiceDate) || details.nextServiceDate,
          tyreCheckDate: parseFlexibleDate(details.tyreCheckDate) || details.tyreCheckDate,
          brakeCheckDate: parseFlexibleDate(details.brakeCheckDate) || details.brakeCheckDate,
          oilCheckDate: parseFlexibleDate(details.oilCheckDate) || details.oilCheckDate,
        };
        const changed =
          healed.insuranceExpiry !== details.insuranceExpiry ||
          healed.motExpiry !== details.motExpiry ||
          healed.taxExpiry !== details.taxExpiry ||
          healed.adiBadgeExpiry !== details.adiBadgeExpiry ||
          healed.lastServiceDate !== details.lastServiceDate ||
          healed.nextServiceDate !== details.nextServiceDate ||
          healed.tyreCheckDate !== details.tyreCheckDate ||
          healed.brakeCheckDate !== details.brakeCheckDate ||
          healed.oilCheckDate !== details.oilCheckDate;
        const next = { ...details, ...healed };
        setCar(next);
        if (changed) void saveCarDetails(user.uid, healed).catch(() => {});
      } else {
        setCar(details);
      }
    } catch {
      setError("Couldn't load car details. Pull down to retry.");
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

  const openEdit = useCallback(() => {
    setDraft(car ?? EMPTY_CAR);
    setEditing(true);
  }, [car]);

  const save = useCallback(async () => {
    if (!user?.uid) return;

    // Normalise every date to ISO; refuse the save (naming the field) when a
    // non-empty date can't be understood, instead of silently storing junk.
    const dateFields: Array<{
      key:
        | "motExpiry"
        | "insuranceExpiry"
        | "taxExpiry"
        | "adiBadgeExpiry"
        | "lastServiceDate"
        | "nextServiceDate"
        | "tyreCheckDate"
        | "brakeCheckDate"
        | "oilCheckDate";
      label: string;
    }> = [
      { key: "motExpiry", label: "MOT expiry" },
      { key: "insuranceExpiry", label: "Insurance expiry" },
      { key: "taxExpiry", label: "Road tax expiry" },
      { key: "adiBadgeExpiry", label: "ADI badge expiry" },
      { key: "lastServiceDate", label: "Last service date" },
      { key: "nextServiceDate", label: "Next service date" },
      { key: "tyreCheckDate", label: "Next tyre check" },
      { key: "brakeCheckDate", label: "Next brake check" },
      { key: "oilCheckDate", label: "Next oil check" },
    ];
    const normalized = { ...draft };
    for (const f of dateFields) {
      const raw = draft[f.key].trim();
      if (!raw) continue;
      const isoDate = parseFlexibleDate(raw);
      if (!isoDate) {
        Alert.alert(
          `Check the ${f.label.toLowerCase()}`,
          `"${raw}" isn't a date we can read. Try the format 14/08/2026.`,
        );
        return;
      }
      normalized[f.key] = isoDate;
    }

    setSaving(true);
    try {
      await saveCarDetails(user.uid, normalized);
      setCar({ ...normalized });
      setEditing(false);
    } catch {
      Alert.alert("Couldn't save", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, [user?.uid, draft]);

  const addLogEntry = useCallback(async () => {
    if (!user?.uid || !noteText.trim()) return;
    setNoteSaving(true);
    const base = car ?? EMPTY_CAR;
    const entry = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      date: todayISO(),
      text: noteText.trim(),
    };
    // Fold the legacy free-text blob into the log the first time a real entry
    // is added, so nothing the instructor wrote before is lost.
    const legacy =
      base.serviceLog.length === 0 && base.notes.trim()
        ? [{ id: "legacy", date: "", text: base.notes.trim() }]
        : [];
    const nextLog = [entry, ...base.serviceLog, ...legacy];
    try {
      await saveCarDetails(user.uid, { serviceLog: nextLog, notes: "" });
      setCar({ ...base, serviceLog: nextLog, notes: "" });
      setNoteText("");
      setNoteModalOpen(false);
    } catch {
      Alert.alert("Couldn't save note", "Check your connection and try again.");
    } finally {
      setNoteSaving(false);
    }
  }, [user?.uid, noteText, car]);

  const deleteLogEntry = useCallback(
    (entryId: string) => {
      if (!user?.uid || !car) return;
      Alert.alert("Delete this note?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const nextLog = car.serviceLog.filter((e) => e.id !== entryId);
            try {
              await saveCarDetails(user.uid, { serviceLog: nextLog });
              setCar({ ...car, serviceLog: nextLog });
            } catch {
              Alert.alert("Couldn't delete", "Check your connection and try again.");
            }
          },
        },
      ]);
    },
    [user?.uid, car],
  );

  const carName = car?.year && car?.make && car?.model
    ? `${car.year} ${car.make} ${car.model}`
    : car?.make && car?.model
      ? `${car.make} ${car.model}`
      : null;

  return (
    <>
      <Screen
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emeraldDark} />
        }
      >
        <Text style={styles.kicker}>Fleet</Text>
        <Text style={styles.title}>Car health</Text>

        {error ? (
          <View style={styles.notice}>
            <Ionicons name="warning-outline" size={18} color={c.red} />
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : null}

        {loading && !car ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={c.emeraldDark} />
          </View>
        ) : (
          <>
            {/* Identity card */}
            <View style={styles.identityCard}>
              <View style={styles.identityAvatar}>
                <Ionicons name="car-sport" size={28} color={c.emeraldDark} />
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.identityName}>
                  {carName ?? "Your teaching car"}
                </Text>
                {car?.registration ? (
                  <View style={styles.regBadge}>
                    <Text style={styles.regText}>
                      {car.registration.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                {car?.colour || car?.fuelType ? (
                  <Text style={styles.identityMeta}>
                    {[car.colour, car.fuelType ? car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1) : ""].filter(Boolean).join(" · ")}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Status cards row */}
            <View style={styles.statusRow}>
              <StatusCard label="MOT" icon="construct-outline" dateStr={car?.motExpiry ?? ""} />
              <StatusCard label="Insurance" icon="shield-checkmark-outline" dateStr={car?.insuranceExpiry ?? ""} />
              <StatusCard label="Road tax" icon="receipt-outline" dateStr={car?.taxExpiry ?? ""} />
            </View>

            <Text style={styles.groupLabel}>KEY DATES</Text>
            <View style={styles.statusRow}>
              <StatusCard label="ADI badge" icon="id-card-outline" dateStr={car?.adiBadgeExpiry ?? ""} />
              <StatusCard label="Service" icon="build-outline" dateStr={car?.nextServiceDate ?? ""} />
              <StatusCard label="Tyres" icon="disc-outline" dateStr={car?.tyreCheckDate ?? ""} />
            </View>

            {/* Car details */}
            {(car?.mileage || car?.lastServiceDate || car?.colour || car?.fuelType || car?.brakeCheckDate || car?.oilCheckDate) ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Details</Text>
                {car?.mileage ? (
                  <DetailRow
                    icon="speedometer-outline"
                    label="Current mileage"
                    value={`${Number(car.mileage).toLocaleString("en-GB")} miles`}
                  />
                ) : null}
                {car?.lastServiceDate ? (
                  <DetailRow
                    icon="build-outline"
                    label="Last service"
                    value={formatDate(car.lastServiceDate)}
                  />
                ) : null}
                {car?.fuelType ? (
                  <DetailRow
                    icon="flame-outline"
                    label="Fuel type"
                    value={car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1)}
                  />
                ) : null}
                {car?.brakeCheckDate ? (
                  <DetailRow
                    icon="warning-outline"
                    label="Next brake check"
                    value={formatDate(car.brakeCheckDate)}
                  />
                ) : null}
                {car?.oilCheckDate ? (
                  <DetailRow
                    icon="water-outline"
                    label="Next oil check"
                    value={formatDate(car.oilCheckDate)}
                  />
                ) : null}
              </View>
            ) : null}

            {/* Service log & notes */}
            <View style={styles.card}>
              <View style={styles.logHeaderRow}>
                <Text style={styles.cardTitle}>Service log & notes</Text>
                <Pressable
                  onPress={() => {
                    setNoteText("");
                    setNoteModalOpen(true);
                  }}
                  style={({ pressed }) => [styles.addNoteBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Add a note"
                >
                  <Ionicons name="add" size={16} color={c.emeraldDark} />
                  <Text style={styles.addNoteBtnText}>Add note</Text>
                </Pressable>
              </View>

              {car?.serviceLog?.length ? (
                car.serviceLog.map((entry) => (
                  <View key={entry.id} style={styles.logRow}>
                    <View style={styles.logIcon}>
                      <Ionicons name="build-outline" size={15} color={c.emeraldDark} />
                    </View>
                    <View style={styles.logCopy}>
                      <Text style={styles.logDate}>
                        {entry.date ? formatDate(entry.date) : "Earlier"}
                      </Text>
                      <Text style={styles.logText}>{entry.text}</Text>
                    </View>
                    <Pressable
                      onPress={() => deleteLogEntry(entry.id)}
                      hitSlop={8}
                      style={({ pressed }) => [styles.logDelete, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Delete note"
                    >
                      <Ionicons name="trash-outline" size={16} color={c.slate500} />
                    </Pressable>
                  </View>
                ))
              ) : car?.notes ? (
                <Text style={styles.notesText}>{car.notes}</Text>
              ) : (
                <Text style={styles.logEmpty}>
                  Keep a dated record of services, repairs and issues — tap "Add note" after each
                  garage visit.
                </Text>
              )}
            </View>

            {/* Edit button */}
            <Pressable
              onPress={openEdit}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Edit car details"
            >
              <Ionicons name="create-outline" size={18} color={c.white} />
              <Text style={styles.editButtonText}>
                {car ? "Edit car details" : "Add your car"}
              </Text>
            </Pressable>
          </>
        )}
      </Screen>

      {/* Edit modal */}
      <Modal
        visible={editing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => !saving && setEditing(false)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: c.background }]} edges={["top", "left", "right"]}>
          {/* Modal header */}
          <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
            <Pressable
              onPress={() => !saving && setEditing(false)}
              disabled={saving}
              style={({ pressed }) => [styles.modalHeaderBtn, pressed && { opacity: 0.6 }]}
              hitSlop={8}
            >
              <Text style={[styles.modalHeaderCancel, { color: c.slate500 }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: c.slate900 }]}>Car details</Text>
            <Pressable
              onPress={save}
              disabled={saving}
              style={({ pressed }) => [styles.modalHeaderBtn, pressed && { opacity: 0.6 }]}
              hitSlop={8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={c.emeraldDark} />
              ) : (
                <Text style={[styles.modalHeaderSave, { color: c.emeraldDark }]}>Save</Text>
              )}
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.formScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Car identity */}
              <Text style={[styles.sectionLabel, { color: c.slate500 }]}>CAR IDENTITY</Text>
              <View style={[styles.formCard, { backgroundColor: c.surface }]}>
                <Field
                  label="Make"
                  placeholder="e.g. Ford"
                  value={draft.make}
                  onChangeText={(v) => setDraft((d) => ({ ...d, make: v }))}
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Model"
                  placeholder="e.g. Fiesta"
                  value={draft.model}
                  onChangeText={(v) => setDraft((d) => ({ ...d, model: v }))}
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Year"
                  placeholder="e.g. 2021"
                  value={draft.year}
                  onChangeText={(v) => setDraft((d) => ({ ...d, year: v }))}
                  numeric
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Registration"
                  placeholder="e.g. AB21 CDE"
                  value={draft.registration}
                  onChangeText={(v) => setDraft((d) => ({ ...d, registration: v }))}
                  autoCapitalize="characters"
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Colour"
                  placeholder="e.g. Silver"
                  value={draft.colour}
                  onChangeText={(v) => setDraft((d) => ({ ...d, colour: v }))}
                />
              </View>

              {/* Fuel type */}
              <Text style={[styles.sectionLabel, { color: c.slate500 }]}>FUEL TYPE</Text>
              <View style={[styles.fuelRow, { backgroundColor: c.surface }]}>
                {FUEL_TYPES.map((ft) => {
                  const selected = draft.fuelType === ft.value;
                  return (
                    <Pressable
                      key={ft.value}
                      onPress={() => setDraft((d) => ({ ...d, fuelType: ft.value }))}
                      style={({ pressed }) => [
                        styles.fuelChip,
                        selected && { backgroundColor: c.emeraldSoft },
                        pressed && !selected && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.fuelChipText, { color: selected ? c.emeraldDark : c.slate500 }]}>
                        {ft.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Expiry dates */}
              <Text style={[styles.sectionLabel, { color: c.slate500 }]}>EXPIRY DATES</Text>
              <View style={[styles.formCard, { backgroundColor: c.surface }]}>
                <Field
                  label="MOT expiry"
                  hint="Day/month/year, e.g. 14/08/2026"
                  placeholder="e.g. 14/08/2026"
                  value={draft.motExpiry}
                  onChangeText={(v) => setDraft((d) => ({ ...d, motExpiry: v }))}
                  autoCapitalize="none"
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Insurance expiry"
                  hint="Day/month/year, e.g. 01/11/2026"
                  placeholder="e.g. 01/11/2026"
                  value={draft.insuranceExpiry}
                  onChangeText={(v) => setDraft((d) => ({ ...d, insuranceExpiry: v }))}
                  autoCapitalize="none"
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Road tax expiry"
                  hint="Day/month/year, e.g. 30/09/2026"
                  placeholder="e.g. 30/09/2026"
                  value={draft.taxExpiry}
                  onChangeText={(v) => setDraft((d) => ({ ...d, taxExpiry: v }))}
                  autoCapitalize="none"
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="ADI badge expiry"
                  hint="Day/month/year, e.g. 30/09/2026"
                  placeholder="e.g. 30/09/2026"
                  value={draft.adiBadgeExpiry}
                  onChangeText={(v) => setDraft((d) => ({ ...d, adiBadgeExpiry: v }))}
                  autoCapitalize="none"
                />
              </View>

              {/* Service */}
              <Text style={[styles.sectionLabel, { color: c.slate500 }]}>SERVICE & MILEAGE</Text>
              <View style={[styles.formCard, { backgroundColor: c.surface }]}>
                <Field
                  label="Last service date"
                  hint="Day/month/year, e.g. 15/12/2025"
                  placeholder="e.g. 15/12/2025"
                  value={draft.lastServiceDate}
                  onChangeText={(v) => setDraft((d) => ({ ...d, lastServiceDate: v }))}
                  autoCapitalize="none"
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Next service date"
                  hint="Day/month/year, e.g. 15/12/2026"
                  placeholder="e.g. 15/12/2026"
                  value={draft.nextServiceDate}
                  onChangeText={(v) => setDraft((d) => ({ ...d, nextServiceDate: v }))}
                  autoCapitalize="none"
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Current mileage"
                  placeholder="e.g. 38500"
                  value={draft.mileage}
                  onChangeText={(v) => setDraft((d) => ({ ...d, mileage: v }))}
                  numeric
                />
              </View>

              <Text style={[styles.sectionLabel, { color: c.slate500 }]}>VEHICLE CHECKS</Text>
              <View style={[styles.formCard, { backgroundColor: c.surface }]}>
                <Field
                  label="Next tyre check"
                  hint="Day/month/year"
                  placeholder="e.g. 15/08/2026"
                  value={draft.tyreCheckDate}
                  onChangeText={(v) => setDraft((d) => ({ ...d, tyreCheckDate: v }))}
                  autoCapitalize="none"
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Next brake check"
                  hint="Day/month/year"
                  placeholder="e.g. 15/08/2026"
                  value={draft.brakeCheckDate}
                  onChangeText={(v) => setDraft((d) => ({ ...d, brakeCheckDate: v }))}
                  autoCapitalize="none"
                />
                <View style={[styles.fieldDivider, { backgroundColor: c.border }]} />
                <Field
                  label="Next oil check"
                  hint="Day/month/year"
                  placeholder="e.g. 15/08/2026"
                  value={draft.oilCheckDate}
                  onChangeText={(v) => setDraft((d) => ({ ...d, oilCheckDate: v }))}
                  autoCapitalize="none"
                />
              </View>

              {/* Notes */}
              <Text style={[styles.sectionLabel, { color: c.slate500 }]}>SERVICE LOG & NOTES</Text>
              <View style={[styles.formCard, { backgroundColor: c.surface }]}>
                <Field
                  label="Notes"
                  placeholder="Service history, issues, repairs…"
                  value={draft.notes}
                  onChangeText={(v) => setDraft((d) => ({ ...d, notes: v }))}
                  multiline
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  flex: { flex: 1 },

  kicker: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 35,
    marginBottom: spacing.lg,
  },

  // ── Notice ──
  notice: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: c.redSoft,
  },
  noticeText: {
    flex: 1,
    color: c.red,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },

  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },

  // ── Identity card ──
  identityCard: {
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: c.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  identityAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  identityCopy: {
    flex: 1,
    gap: 4,
  },
  identityName: {
    ...typography.headline,
    color: c.slate900,
  },
  regBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: c.surfaceMuted,
  },
  regText: {
    color: c.slate900,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  identityMeta: {
    color: c.slate500,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  // ── Status row ──
  statusRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  groupLabel: {
    color: c.slate500,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  statusCard: {
    flex: 1,
    borderRadius: 20,
    padding: spacing.md,
    gap: 3,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  statusIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
    textAlign: "center",
  },
  statusDays: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  statusCaption: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.8,
  },

  // ── Detail card ──
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    color: c.slate500,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 6,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
  },
  detailCopy: {
    flex: 1,
  },
  detailLabel: {
    color: c.slate500,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  detailValue: {
    color: c.slate900,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },

  // ── Notes / service log ──
  notesText: {
    color: c.slate700,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  logHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addNoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: c.emeraldSoft,
  },
  addNoteBtnText: {
    color: c.emeraldDark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  logIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceMuted,
    marginTop: 2,
  },
  logCopy: {
    flex: 1,
    gap: 2,
  },
  logDate: {
    color: c.slate500,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  logText: {
    color: c.slate900,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  logDelete: {
    padding: 6,
    borderRadius: 8,
  },
  logEmpty: {
    color: c.slate500,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    fontStyle: "italic",
    paddingVertical: spacing.sm,
  },

  // ── Edit button ──
  editButton: {
    minHeight: 54,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: c.emerald,
  },
  editButtonText: {
    color: c.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  // ── Edit modal ──
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderBtn: {
    minWidth: 60,
  },
  modalHeaderCancel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  modalTitle: {
    ...typography.headline,
  },
  modalHeaderSave: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "right",
  },

  // ── Form ──
  formScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  formCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  fieldDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md,
  },

  // ── Field ──
  field: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  fieldLabel: {
    color: c.slate500,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 2,
  },
  fieldHint: {
    color: c.slate300,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "400",
    marginBottom: 4,
  },
  fieldInput: {
    color: c.slate900,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    paddingTop: 2,
    paddingBottom: 2,
  },
  fieldInputMulti: {
    minHeight: 80,
    textAlignVertical: "top",
    lineHeight: 21,
  },

  // ── Fuel chips ──
  fuelRow: {
    borderRadius: 18,
    flexDirection: "row",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  fuelChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fuelChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
});
