import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTextInput } from "../../components/ui/AppTextInput";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import type { Student } from "../../types";
import type { StudentWriteData } from "../../services/dataService";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type StudentFormValues = Required<StudentWriteData>;

export const emptyStudentForm: StudentFormValues = {
  name: "",
  phone: "",
  email: "",
  transmission: "manual",
  language: "en",
  practiceFocus: "",
  practiceTips: "",
};

const transmissionOptions: Array<{
  value: StudentFormValues["transmission"];
  label: string;
  icon: IoniconName;
}> = [
  { value: "manual", label: "Manual", icon: "speedometer-outline" },
  { value: "automatic", label: "Automatic", icon: "flash-outline" },
];

export function studentToFormValues(student: Student): StudentFormValues {
  return {
    name: student.name,
    phone: student.phone,
    email: student.email,
    transmission: student.transmission,
    language: student.language || "en",
    practiceFocus: student.practiceFocus || "",
    practiceTips: student.practiceTips || "",
  };
}

export function validateStudentForm(values: StudentFormValues) {
  if (!values.name.trim()) return "Enter the student's name.";
  if (!values.phone.trim()) return "Enter the student's phone number.";
  if (!values.email.trim()) return "Enter the student's email address.";
  return null;
}

export function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={22} color={c.slate900} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backButton} />
    </View>
  );
}

export function StudentFormFields({
  values,
  onChange,
}: {
  values: StudentFormValues;
  onChange: <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.form}>
      <AppTextInput
        label="Name"
        value={values.name}
        onChangeText={(value) => onChange("name", value)}
        autoCapitalize="words"
        autoCorrect={false}
        textContentType="name"
        returnKeyType="next"
        placeholder="Learner name"
      />
      <AppTextInput
        label="Phone"
        value={values.phone}
        onChangeText={(value) => onChange("phone", value)}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        placeholder="07..."
      />
      <AppTextInput
        label="Email"
        value={values.email}
        onChangeText={(value) => onChange("email", value)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        placeholder="student@email.com"
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Transmission</Text>
        <View style={styles.chipRow}>
          {transmissionOptions.map((option) => {
            const active = values.transmission === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onChange("transmission", option.value)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={active ? c.white : c.emeraldDark}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <AppTextInput
        label="Language"
        value={values.language}
        onChangeText={(value) => onChange("language", value)}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="en, pa, hi"
      />

      <AppTextInput
        label="Practice focus"
        value={values.practiceFocus}
        onChangeText={(value) => onChange("practiceFocus", value)}
        autoCapitalize="sentences"
        placeholder="Roundabouts, mirrors, clutch control..."
      />

      <AppTextInput
        label="Next lesson guidance"
        value={values.practiceTips}
        onChangeText={(value) => onChange("practiceTips", value)}
        autoCapitalize="sentences"
        multiline
        textAlignVertical="top"
        placeholder="What should they practise before the next lesson?"
        style={styles.notesInput}
      />
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  backButton: {
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
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    color: c.slate700,
    fontSize: 13,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: c.emeraldSoft,
  },
  chipActive: {
    backgroundColor: c.emerald,
  },
  chipText: {
    color: c.emeraldDark,
    fontSize: 14,
    fontWeight: "700",
  },
  chipTextActive: {
    color: c.white,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  notesInput: {
    minHeight: 112,
    paddingTop: spacing.md,
    lineHeight: 22,
  },
});
