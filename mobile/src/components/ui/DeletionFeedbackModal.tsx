import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useColors } from "../../theme/ThemeContext";

export type DeletionFeedback = { reason?: string; detail?: string };

const REASONS = [
  "I found a better alternative",
  "I no longer need the service",
  "The subscription is too expensive",
  "I experienced technical issues",
  "I had privacy or security concerns",
  "Other",
];

export function DeletionFeedbackModal({
  visible,
  onCancel,
  onContinue,
}: {
  visible: boolean;
  onCancel: () => void;
  onContinue: (feedback?: DeletionFeedback) => void;
}) {
  const c = useColors();
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");

  function finish(feedback?: DeletionFeedback) {
    setReason("");
    setDetail("");
    onContinue(feedback);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}> 
          <Text style={[styles.title, { color: c.slate900 }]}>Before you go</Text>
          <Text style={[styles.copy, { color: c.slate500 }]}>What made you decide to leave? This is optional and helps us improve.</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {REASONS.map((item) => {
              const selected = reason === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setReason(item)}
                  style={[styles.option, { borderColor: selected ? c.emerald : c.border, backgroundColor: selected ? c.emeraldSoft : c.surfaceMuted }]}
                >
                  <Text style={[styles.optionText, { color: c.slate900 }]}>{item}</Text>
                </Pressable>
              );
            })}
            {reason === "Other" ? (
              <TextInput
                value={detail}
                onChangeText={setDetail}
                placeholder="Tell us more (optional)"
                placeholderTextColor={c.slate500}
                maxLength={500}
                multiline
                style={[styles.input, { color: c.slate900, borderColor: c.border, backgroundColor: c.surfaceMuted }]}
              />
            ) : null}
          </ScrollView>
          <Pressable style={[styles.primary, { backgroundColor: c.red }]} onPress={() => finish(reason ? { reason, detail: detail.trim() } : undefined)}>
            <Text style={styles.primaryText}>Continue to deletion</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => finish()}>
            <Text style={[styles.secondaryText, { color: c.slate500 }]}>Skip feedback</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onCancel}>
            <Text style={[styles.secondaryText, { color: c.slate900 }]}>Keep my account</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.56)" },
  sheet: { maxHeight: "88%", padding: 20, paddingBottom: 28, borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "800" },
  copy: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  list: { marginTop: 16 },
  listContent: { gap: 8, paddingBottom: 12 },
  option: { minHeight: 48, justifyContent: "center", paddingHorizontal: 14, borderWidth: 1, borderRadius: 10 },
  optionText: { fontSize: 14, fontWeight: "600" },
  input: { minHeight: 92, padding: 12, borderWidth: 1, borderRadius: 10, textAlignVertical: "top" },
  primary: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  secondary: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 14, fontWeight: "700" },
});
