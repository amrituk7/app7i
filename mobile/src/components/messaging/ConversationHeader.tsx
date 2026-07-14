import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = {
  studentName: string;
  studentPhone?: string;
  subtitle?: string;
  onBack: () => void;
  onDelete?: () => void;
};

function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function digitsOnly(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (cleaned.startsWith("0")) return `44${cleaned.slice(1)}`;
  return cleaned;
}

export function ConversationHeader({
  studentName,
  studentPhone,
  subtitle,
  onBack,
  onDelete,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const hasPhone = Boolean(studentPhone?.trim());

  async function openWhatsApp() {
    if (!studentPhone) return;
    const digits = digitsOnly(studentPhone);
    if (!digits) {
      Alert.alert("WhatsApp", "Couldn't read this student's phone number.");
      return;
    }
    const url = `whatsapp://send?phone=${digits}`;
    const webFallback = `https://wa.me/${digits}`;
    try {
      const supported = await Linking.canOpenURL(url);
      await Linking.openURL(supported ? url : webFallback);
    } catch {
      Alert.alert("WhatsApp not installed", "Install WhatsApp to message this student there.");
    }
  }

  async function callPhone() {
    if (!studentPhone) return;
    const digits = studentPhone.replace(/[^\d+]/g, "");
    try {
      await Linking.openURL(`tel:${digits}`);
    } catch {
      Alert.alert("Couldn't open dialler", "Try calling manually.");
    }
  }

  async function openSms() {
    if (!studentPhone) return;
    const digits = digitsOnly(studentPhone);
    if (!digits) {
      Alert.alert("Text message", "Couldn't read this student's phone number.");
      return;
    }
    try {
      await Linking.openURL(`sms:+${digits}`);
    } catch {
      Alert.alert("Couldn't open messages", "Try texting manually.");
    }
  }

  async function openTelegram() {
    if (!studentPhone) return;
    const digits = digitsOnly(studentPhone);
    if (!digits) {
      Alert.alert("Telegram", "Couldn't read this student's phone number.");
      return;
    }
    const appUrl = `tg://resolve?phone=${digits}`;
    const webFallback = `https://t.me/+${digits}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webFallback);
    } catch {
      Alert.alert("Telegram not installed", "Install Telegram to message this student there.");
    }
  }

  function openMoreMenu() {
    const buttons = [];
    if (hasPhone) {
      buttons.push(
        { text: "Send SMS text", onPress: openSms },
        { text: "Message on Telegram", onPress: openTelegram },
      );
    }
    if (onDelete) {
      buttons.push({ text: "Delete chat", style: "destructive" as const, onPress: onDelete });
    }
    buttons.push({ text: "Cancel", style: "cancel" as const });
    Alert.alert(studentName, "Contact options", buttons);
  }

  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={26} color={c.emerald} />
      </Pressable>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(studentName)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={1}>
            {studentName}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {hasPhone ? (
          <>
            <Pressable
              onPress={callPhone}
              accessibilityLabel="Call student"
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              hitSlop={6}
            >
              <Ionicons name="call" size={19} color={c.emerald} />
            </Pressable>
            <Pressable
              onPress={openWhatsApp}
              accessibilityLabel="Message on WhatsApp"
              style={({ pressed }) => [styles.whatsappBtn, pressed && styles.pressed]}
              hitSlop={6}
            >
              <Ionicons name="logo-whatsapp" size={19} color="#25D366" />
            </Pressable>
          </>
        ) : null}
        {onDelete || hasPhone ? (
          <Pressable
            onPress={openMoreMenu}
            accessibilityLabel="More contact options"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            hitSlop={6}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={c.slate600} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 10,
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    whatsappBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.greenSoft,
    },
    identity: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingLeft: 4,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.emeraldSoft,
    },
    avatarText: {
      color: c.emeraldDark,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    copy: {
      flex: 1,
    },
    name: {
      color: c.slate900,
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: -0.3,
    },
    subtitle: {
      color: c.slate500,
      fontSize: 12,
      fontWeight: "400",
      marginTop: 1,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    pressed: {
      opacity: 0.5,
    },
  });
