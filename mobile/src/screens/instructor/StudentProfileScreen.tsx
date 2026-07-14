import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import { Share } from "react-native";
import {
  getPaidLessonPayments,
  getStudent,
  getStudentLessons,
  getStudentSkillsAggregate,
  type StudentSkillAggregate,
} from "../../services/dataService";
import { buildProgressReportText } from "../../utils/progressReport";
import { buildRangeStatement, statementToPDF } from "../../utils/monthlyStatements";
import { saveStatementFile } from "../../services/statementDownload";
import { useAuth } from "../../context/AuthContext";
import { computeTestReadiness } from "../../utils/testReadiness";
import { TestReadinessCard } from "../../components/TestReadinessCard";
import type { Lesson } from "../../types";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Student } from "../../types";
import { formatGBP } from "../../utils/currency";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type Nav = {
  goBack: () => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};

type Route = {
  params?: {
    studentId?: string;
  };
};

export function StudentProfileScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: Route;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const studentId = route.params?.studentId;
  const [downloadingStatement, setDownloadingStatement] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [skillsAggregate, setSkillsAggregate] = useState<StudentSkillAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyWarning, setHistoryWarning] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) {
      // Params not yet available — React Navigation sometimes delivers them
      // on the render after mount. Keep the loading spinner up; the effect
      // will re-fire once studentId becomes defined.
      return;
    }

    setError(null);
    setHistoryWarning(null);
    try {
      const next = await getStudent(studentId);
      if (!next) {
        setError("This student seems to have moved. Tap back and try again.");
        setStudent(null);
        return;
      }
      setStudent(next);
      // Lessons + skills feed the test-readiness checklist.
      const [lessonsResult, aggregateResult] = await Promise.allSettled([
        getStudentLessons(studentId, 50, user?.uid),
        getStudentSkillsAggregate(studentId, 50, user?.uid),
      ]);
      setRecentLessons(lessonsResult.status === "fulfilled" ? lessonsResult.value : []);
      setSkillsAggregate(aggregateResult.status === "fulfilled" ? aggregateResult.value : []);
      if (lessonsResult.status === "rejected" || aggregateResult.status === "rejected") {
        setHistoryWarning("Student opened, but some lesson history could not load. Pull down to retry.");
      }
    } catch (err) {
      setError(toFriendlyError(err, "We're having trouble loading this student. Pull down to retry."));
    }
  }, [studentId, user?.uid]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function openUrl(url: string, fallbackTitle: string) {
    Linking.openURL(url).catch(() => Alert.alert(fallbackTitle, "Check the saved contact details and try again."));
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      </Screen>
    );
  }

  if (!studentId || (loading && !student)) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={c.emerald} />
        </View>
      </Screen>
    );
  }

  if (error || !student) {
    return (
      <Screen>
        <ProfileHeader
          onBack={() => navigation.goBack()}
          onEdit={undefined}
        />
        <EmptyState
          iconName="alert-circle-outline"
          title="This student seems to have moved"
          message="Tap back to Students and open the learner again."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} />
      }
    >
      <ProfileHeader
        onBack={() => navigation.goBack()}
        onEdit={() => navigation.navigate("EditStudent", { studentId })}
      />

      {historyWarning ? <WarningNotice message={historyWarning} /> : null}

      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(student.name)}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Learner</Text>
          <Text style={styles.name}>{student.name}</Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Ionicons name="car-outline" size={14} color={c.emeraldDark} />
              <Text style={styles.pillText}>{student.transmission}</Text>
            </View>
            {student.language ? (
              <View style={styles.pill}>
                <Ionicons name="language-outline" size={14} color={c.emeraldDark} />
                <Text style={styles.pillText}>{student.language}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.infoList}>
        <InfoRow
          icon="call-outline"
          title="Phone"
          value={student.phone || "No phone saved"}
          onPress={
            student.phone
              ? () => openUrl(`tel:${student.phone.replace(/\s+/g, "")}`, "Call did not open")
              : undefined
          }
        />
        <InfoRow
          icon="mail-outline"
          title="Email"
          value={student.email || "No email saved"}
          onPress={
            student.email
              ? () => openUrl(`mailto:${student.email}`, "Email did not open")
              : undefined
          }
        />
        <InfoRow
          icon="wallet-outline"
          title="Outstanding balance"
          value={formatGBP(student.outstandingBalance)}
        />
        <InfoRow
          icon="calendar-outline"
          title="Next lesson"
          value={student.nextLesson || "Not booked"}
        />
        <InfoRow
          icon={student.uid ? "checkmark-circle-outline" : "mail-outline"}
          title="Student app"
          value={student.uid ? "Linked to their login" : `Waiting for ${student.email || "student email"} to sign up`}
        />
      </View>

      <Card style={styles.practiceCard}>
        <View style={styles.practiceHeader}>
          <View style={styles.practiceIcon}>
            <Ionicons name="sparkles-outline" size={18} color={c.emeraldDark} />
          </View>
          <View style={styles.practiceCopy}>
            <Text style={styles.practiceTitle}>Student app tips</Text>
            <Text style={styles.practiceSubtitle}>
              These appear in {student.name}'s student app.
            </Text>
          </View>
        </View>
        <Text style={styles.practiceLabel}>Focus</Text>
        <Text style={styles.practiceText}>
          {student.practiceFocus || "Add a focus area so they know what to practise next."}
        </Text>
        <Text style={styles.practiceLabel}>Instructor tips</Text>
        <Text style={styles.practiceText}>
          {student.practiceTips || "Add a short tip, homework note or confidence boost."}
        </Text>
      </Card>

      <TestReadinessCard
        readiness={computeTestReadiness(
          student,
          recentLessons,
          skillsAggregate.filter((s) => s.averageRating >= 4).length,
        )}
        onEdit={() => navigation.navigate("TestReadiness", { studentId })}
      />

      <View style={styles.actions}>
        <AppButton
          label="Student performance"
          onPress={() => navigation.navigate("ProgressTracker", { studentId })}
        />
        <AppButton
          label="Open Learning Hub"
          variant="secondary"
          onPress={() => navigation.navigate("StudentLearningHub", { studentId, studentName: student.name })}
        />
        <AppButton
          label="Edit profile and tips"
          variant="secondary"
          onPress={() => navigation.navigate("EditStudent", { studentId })}
        />
        <AppButton
          label="Book lesson"
          variant="secondary"
          onPress={() => navigation.navigate("BookLesson", { studentId })}
        />
        <AppButton
          label="Message"
          variant="secondary"
          onPress={() =>
            navigation.navigate("Conversation", {
              studentId,
              studentName: student.name,
            })
          }
        />
        <AppButton
          label="View lessons"
          variant="secondary"
          onPress={() =>
            navigation.navigate("StudentLessonsList", {
              studentId,
              studentName: student?.name,
            })
          }
        />
        <AppButton
          label="Share progress report"
          variant="secondary"
          onPress={async () => {
            try {
              const lessons = await getStudentLessons(studentId, 30, user?.uid);
              const text = buildProgressReportText(student, lessons);
              await Share.share({
                title: `Progress report — ${student?.name || "Student"}`,
                message: text,
              });
            } catch {
              // Native Share dismiss reads as throw on iOS — silent is fine.
            }
          }}
        />
        <AppButton
          label={downloadingStatement ? "Preparing PDF…" : "Download payment statement (PDF)"}
          variant="secondary"
          disabled={downloadingStatement}
          onPress={async () => {
            if (!user?.uid) return;
            setDownloadingStatement(true);
            try {
              const paid = await getPaidLessonPayments(user.uid, 500);
              const statement = buildRangeStatement(paid, {
                label: `${student.name} — Payment statement`,
                shortLabel: student.name,
                studentNameFilter: student.name,
                studentIdFilter: studentId,
              });
              if (statement.count === 0) {
                Alert.alert(
                  "Nothing to export",
                  `No paid lessons recorded for ${student.name} yet.`,
                );
                return;
              }
              const pdf = statementToPDF(statement, user.displayName || undefined);
              const safeName = student.name.replace(/[^a-zA-Z0-9]+/g, "_");
              const result = await saveStatementFile({
                filename: `App7i_${safeName}_Statement.pdf`,
                content: pdf,
                mimeType: "application/pdf",
                base64: true,
              });
              if (result.kind === "saved") {
                Alert.alert(
                  "Statement saved",
                  `Saved to ${result.location}. Share it with ${student.name} or keep for your records.`,
                );
              }
            } catch (err) {
              Alert.alert(
                "Couldn't save statement",
                err instanceof Error ? err.message : "Try again in a moment.",
              );
            } finally {
              setDownloadingStatement(false);
            }
          }}
        />
      </View>
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

function ProfileHeader({
  onBack,
  onEdit,
}: {
  onBack: () => void;
  onEdit?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={22} color={c.slate900} />
      </Pressable>
      <Text style={styles.headerTitle}>Student</Text>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
  );
}

function InfoRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: IoniconName;
  title: string;
  value: string;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
    >
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={c.emeraldDark} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={c.slate300} /> : null}
    </Pressable>
  );
}

function WarningNotice({ message }: { message: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.warningNotice}>
      <Ionicons name="warning-outline" size={18} color={c.amber} />
      <Text style={styles.warningText}>{message}</Text>
    </View>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  headerTitle: {
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  editButton: {
    minWidth: 58,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  editText: {
    color: c.emeraldDark,
    fontSize: 13,
    fontWeight: "700",
  },
  hero: {
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: c.emerald,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  avatarText: {
    color: c.emeraldDark,
    fontSize: 24,
    fontWeight: "700",
  },
  heroCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  kicker: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  name: {
    color: c.white,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: c.surface,
  },
  pillText: {
    color: c.emeraldDark,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  infoList: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  practiceCard: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  practiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  practiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  practiceCopy: {
    flex: 1,
  },
  practiceTitle: {
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  practiceSubtitle: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  practiceLabel: {
    color: c.slate500,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  practiceText: {
    color: c.slate900,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  infoRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.slate100,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.emeraldSoft,
  },
  infoCopy: {
    flex: 1,
    gap: 3,
  },
  infoTitle: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: {
    color: c.slate900,
    fontSize: 15,
    fontWeight: "600",
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  warningNotice: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: c.amberSoft,
  },
  warningText: {
    flex: 1,
    color: c.amber,
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
