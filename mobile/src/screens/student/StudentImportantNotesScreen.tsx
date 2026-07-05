import { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui/Card";
import { Screen } from "../../components/ui/Screen";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Note = {
  id: number;
  title: string;
  icon: string;
  accentKey: keyof ColorPalette;
  content: string[];
};

const NOTES: Note[] = [
  {
    id: 1,
    title: "Legal responsibilities",
    icon: "⚖️",
    accentKey: "amber",
    content: [
      "You must hold a valid provisional or full driving licence.",
      "Your vehicle must be taxed, insured, and have a valid MOT (if over 3 years old).",
      "You must display L plates (or D plates in Wales) when learning.",
      "You cannot drive on motorways with a provisional licence (unless with an approved instructor in a dual-control car).",
      "You must report any medical conditions that could affect your driving to the DVLA.",
      "You are responsible for ensuring your vehicle is roadworthy before every journey.",
    ],
  },
  {
    id: 2,
    title: "Safety checks (FLOWER)",
    icon: "🌸",
    accentKey: "emerald",
    content: [
      "F — Fuel: enough fuel for your journey.",
      "L — Lights: headlights, brake lights and indicators all working.",
      "O — Oil: between min and max on dipstick.",
      "W — Water: coolant and windscreen washer fluid.",
      "E — Electrics: battery, horn, warning lights.",
      "R — Rubber: tyre pressure, tread depth (min 1.6mm), condition.",
    ],
  },
  {
    id: 3,
    title: "Cockpit checks",
    icon: "🪑",
    accentKey: "blue",
    content: [
      "Adjust your seat so you can reach all controls comfortably.",
      "Adjust head restraint to the middle of your head.",
      "Adjust mirrors: interior mirror first, then door mirrors.",
      "Ensure doors are properly closed.",
      "Fasten seatbelt and ensure all passengers have done the same.",
      "Check handbrake is on and gear is in neutral (or Park for automatic).",
    ],
  },
  {
    id: 4,
    title: "Security",
    icon: "🔒",
    accentKey: "red",
    content: [
      "Always lock your vehicle when leaving it unattended.",
      "Never leave valuables visible inside the car.",
      "Park in well-lit areas when possible.",
      "Use steering wheel locks or other security devices.",
      "Keep your keys safe and never leave them in the ignition.",
      "Be aware of your surroundings when getting in or out of your vehicle.",
    ],
  },
  {
    id: 5,
    title: "Controls and instruments",
    icon: "🎛️",
    accentKey: "emeraldDark",
    content: [
      "Steering wheel: use the 'pull-push' method for smooth control.",
      "Accelerator: press gently for smooth acceleration.",
      "Brake: apply progressively, not suddenly.",
      "Clutch: use smoothly to prevent stalling (manual only).",
      "Gears: match gear to speed and road conditions.",
      "Handbrake: use when stationary to secure the vehicle.",
      "Indicators: signal in good time before any manoeuvre.",
      "Dashboard: know your warning lights and what they mean.",
    ],
  },
  {
    id: 6,
    title: "Moving away and stopping",
    icon: "🚗",
    accentKey: "green",
    content: [
      "Moving Away Routine (POM): Prepare — Observe — Move.",
      "Prepare: clutch down, select first gear, set gas, find biting point.",
      "Observe: check mirrors (centre, right), check blind spot.",
      "Move: release handbrake, steer gently away from kerb.",
      "Stopping Routine (MSM): Mirror — Signal — Manoeuvre.",
      "Check mirrors early, signal if necessary, brake progressively.",
      "Secure the car: handbrake on, neutral gear, cancel signal.",
    ],
  },
  {
    id: 7,
    title: "Safe positioning",
    icon: "🛣️",
    accentKey: "amber",
    content: [
      "Normal driving: keep to the left unless overtaking.",
      "One-way streets: position in the correct lane early.",
      "Roundabouts: left lane for left/straight, right lane for right.",
      "Turning left: position close to the left kerb.",
      "Turning right: position just left of centre of the road.",
      "Pedestrian crossings: stop before the white line.",
      "Junctions: position according to the road markings.",
    ],
  },
];

export function StudentImportantNotesScreen() {
  const [openId, setOpenId] = useState<number | null>(NOTES[0]?.id ?? null);
  const styles = useThemedStyles(makeStyles);
  const c = useColors();

  function toggle(id: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <Screen>
      <Text style={styles.kicker}>Reference</Text>
      <Text style={styles.title}>Important notes</Text>
      <Text style={styles.copy}>
        Quick refreshers for safe, confident, exam-ready driving.
      </Text>

      <View style={styles.list}>
        {NOTES.map((note) => {
          const open = openId === note.id;
          const accent = c[note.accentKey] as string;
          return (
            <Card key={note.id} style={styles.section}>
              <Pressable
                onPress={() => toggle(note.id)}
                style={styles.sectionHeader}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <View style={[styles.accent, { backgroundColor: accent + "22" }]}>
                  <Text style={styles.accentEmoji}>{note.icon}</Text>
                </View>
                <Text style={styles.sectionTitle}>{note.title}</Text>
                <Ionicons
                  name={open ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={c.slate500}
                />
              </Pressable>
              {open ? (
                <View style={styles.bulletList}>
                  {note.content.map((line, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                      <Text style={styles.bulletText}>{line}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
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
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  list: { gap: spacing.md },
  section: { gap: spacing.md, paddingVertical: spacing.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  accent: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  accentEmoji: { fontSize: 18 },
  sectionTitle: {
    flex: 1,
    color: c.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  bulletList: { gap: spacing.sm, paddingTop: spacing.xs },
  bulletRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    color: c.slate700,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
});
