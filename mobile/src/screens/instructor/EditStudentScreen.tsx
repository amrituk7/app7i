import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Screen } from "../../components/ui/Screen";
import {
  deleteStudent,
  getStudent,
  updateStudent,
} from "../../services/dataService";
import { useAuth } from "../../context/AuthContext";
import { describeFirestoreError } from "../../utils/firestoreError";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Student } from "../../types";
import {
  BackHeader,
  emptyStudentForm,
  StudentFormFields,
  studentToFormValues,
  type StudentFormValues,
  validateStudentForm,
} from "./StudentFormParts";

type Nav = {
  goBack: () => void;
};

type Route = {
  params?: {
    studentId?: string;
  };
};

export function EditStudentScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: Route;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const studentId = route.params?.studentId;
  const { user } = useAuth();
  const mayBeUnverified = !user?.emailVerified;
  const [student, setStudent] = useState<Student | null>(null);
  const [values, setValues] = useState<StudentFormValues>(emptyStudentForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) {
      setError("This student seems to have moved. Tap back and try again.");
      return;
    }

    setError(null);
    try {
      const next = await getStudent(studentId);
      if (!next) {
        setError("This student seems to have moved. Tap back and try again.");
        return;
      }
      setStudent(next);
      setValues(studentToFormValues(next));
    } catch (err) {
      setError(describeFirestoreError(err, { action: "loadStudent", mayBeUnverified }));
    }
  }, [studentId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  function updateField<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!studentId) return;
    const validationError = validateStudentForm(values);
    if (validationError) {
      Alert.alert("Missing details", validationError);
      return;
    }

    setSaving(true);
    try {
      await updateStudent(studentId, values);
      navigation.goBack();
      Alert.alert("Student updated", `${values.name.trim()} has been saved.`);
    } catch (err) {
      Alert.alert(
        "Save did not go through",
        describeFirestoreError(err, { action: "updateStudent", mayBeUnverified }),
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!studentId || !student) return;
    Alert.alert(
      "Delete student?",
      `This removes ${student.name}'s learner record from your students list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: runDelete,
        },
      ],
    );
  }

  async function runDelete() {
    if (!studentId) return;
    setDeleting(true);
    try {
      await deleteStudent(studentId);
      navigation.goBack();
      Alert.alert("Student deleted", "The learner record has been removed.");
    } catch (err) {
      Alert.alert(
        "Delete did not go through",
        describeFirestoreError(err, { action: "deleteStudent", mayBeUnverified }),
      );
    } finally {
      setDeleting(false);
    }
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

  if (error || !student) {
    return (
      <Screen>
        <BackHeader onBack={() => navigation.goBack()} title="Student" />
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
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <BackHeader onBack={() => navigation.goBack()} title="Student" />
          <Text style={styles.kicker}>Learner profile</Text>
          <Text style={styles.title}>Edit student</Text>
          <Text style={styles.copy}>
            Keep contact details accurate and add the tips they will see in the student app.
          </Text>

          <StudentFormFields values={values} onChange={updateField} />

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger zone</Text>
            <Text style={styles.dangerCopy}>
              Deleting a student removes the learner record. Existing lessons may still need separate cleanup.
            </Text>
            <AppButton
              label={deleting ? "Deleting..." : "Delete student"}
              variant="danger"
              disabled={saving || deleting}
              onPress={confirmDelete}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label={saving ? "Saving..." : "Save changes"}
            disabled={saving || deleting}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}


const makeStyles = (c: ColorPalette) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  kicker: {
    color: c.emerald,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: c.slate900,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  copy: {
    color: c.slate500,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  dangerZone: {
    borderRadius: 24,
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: c.surface,
  },
  dangerTitle: {
    color: c.red,
    fontSize: 15,
    fontWeight: "700",
  },
  dangerCopy: {
    color: c.slate500,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  footer: {
    paddingTop: spacing.md,
    backgroundColor: c.background,
  },
});
