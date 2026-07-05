import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { createStudent } from "../../services/dataService";
import { describeFirestoreError } from "../../utils/firestoreError";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import {
  BackHeader,
  emptyStudentForm,
  StudentFormFields,
  type StudentFormValues,
  validateStudentForm,
} from "./StudentFormParts";

type Nav = {
  goBack: () => void;
};

export function AddStudentScreen({ navigation }: { navigation: Nav }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [values, setValues] = useState<StudentFormValues>(emptyStudentForm);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    const validationError = validateStudentForm(values);
    if (validationError) {
      Alert.alert("Missing details", validationError);
      return;
    }
    if (!user?.uid) {
      Alert.alert("Not signed in", "Sign in again before adding a student.");
      return;
    }

    setSaving(true);
    try {
      await createStudent(values);
      navigation.goBack();
      Alert.alert(
        "Student added",
        `${values.name.trim()} can now sign up with ${values.email.trim().toLowerCase()} and the student app will link automatically.`,
      );
    } catch (err) {
      Alert.alert(
        "Save did not go through",
        describeFirestoreError(err, {
          action: "createStudent",
          mayBeUnverified: !user?.emailVerified,
        }),
      );
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.kicker}>New learner</Text>
          <Text style={styles.title}>Add / invite student</Text>
          <Text style={styles.copy}>
            Use the same email they will sign in with. App7i links their student app automatically, then shows lessons, tips, notes and progress.
          </Text>

          <StudentFormFields values={values} onChange={updateField} />
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label={saving ? "Saving..." : "Save student"}
            disabled={saving}
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
  footer: {
    paddingTop: spacing.md,
    backgroundColor: c.background,
  },
});
