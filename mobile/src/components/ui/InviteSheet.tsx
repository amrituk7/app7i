import { Ionicons } from "@expo/vector-icons";
import QRCode from "qrcode";
import { Component, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getMyInstructorProfile } from "../../services/dataService";
import { captureAppException } from "../../services/sentry";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";
import { hapticSuccess, hapticTap } from "../../utils/haptics";
import { AppButton } from "./AppButton";

type ClipboardModule = typeof import("expo-clipboard");
let cachedClipboard: ClipboardModule | null | undefined = undefined;
type SvgModule = typeof import("react-native-svg");
let cachedSvg: SvgModule | null | undefined = undefined;

function getClipboard(): ClipboardModule | null {
  if (cachedClipboard !== undefined) return cachedClipboard;
  try {
    cachedClipboard = require("expo-clipboard") as ClipboardModule;
    return cachedClipboard;
  } catch {
    cachedClipboard = null;
    return null;
  }
}

function getSvg(): SvgModule | null {
  if (cachedSvg !== undefined) return cachedSvg;
  try {
    cachedSvg = require("react-native-svg") as SvgModule;
    return cachedSvg;
  } catch {
    cachedSvg = null;
    return null;
  }
}

class QrBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    captureAppException(error, { area: "invite_qr_render" });
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function InviteSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [copied, setCopied] = useState(false);
  const uid = user?.uid || "";
  const inviteUrl = `https://app7i.com/register?instructor=${uid}`;

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    getMyInstructorProfile()
      .then((profile) => setUsername(profile?.username || ""))
      .catch(() => setUsername(""));
  }, [open]);

  const qr = useMemo(() => buildQrPath(inviteUrl), [inviteUrl]);
  const svg = useMemo(() => getSvg(), []);
  const Svg = svg?.default;
  const Path = svg?.Path;

  const shareLink = useCallback(() => {
    Share.share({
      url: inviteUrl,
      message: `Join my App7i driving school profile: ${inviteUrl}`,
    }).catch(() => Alert.alert("Share unavailable", "Try copying the link instead."));
  }, [inviteUrl]);

  const copyLink = useCallback(async () => {
    hapticTap();
    const clipboard = getClipboard();
    if (!clipboard) {
      Alert.alert("Copy unavailable", inviteUrl);
      return;
    }

    try {
      await clipboard.setStringAsync(inviteUrl);
      setCopied(true);
      hapticSuccess();
    } catch {
      Alert.alert("Copy failed", "Use Share link or try again.");
    }
  }, [inviteUrl]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Invite a student</Text>
              <Text style={styles.subtitle}>Send this link so they can register with you.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close invite sheet"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={20} color={c.slate900} />
            </Pressable>
          </View>

          <View style={styles.qrCard}>
            <View style={styles.qrFrame}>
              {Svg && Path ? (
                <QrBoundary fallback={<QrFallback />}>
                  <Svg width={212} height={212} viewBox={`0 0 ${qr.size} ${qr.size}`}>
                    <Path d={`M0 0h${qr.size}v${qr.size}H0z`} fill={c.white} />
                    <Path d={qr.path} fill={c.slate900} />
                  </Svg>
                </QrBoundary>
              ) : (
                <QrFallback />
              )}
            </View>
            <Text style={styles.username}>{username ? `@${username}` : "Set your username"}</Text>
            <Text style={styles.url} numberOfLines={2}>
              {inviteUrl}
            </Text>
          </View>

          <View style={styles.actions}>
            <AppButton label="Share link" onPress={shareLink} style={styles.actionButton} />
            <AppButton
              label={copied ? "Copied" : "Copy link"}
              variant="secondary"
              onPress={copyLink}
              style={styles.actionButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function QrFallback() {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={styles.qrFallback}>
      <Ionicons name="link-outline" size={36} color={c.emeraldDark} />
      <Text style={styles.qrFallbackText}>QR needs the latest app build. Share or copy the link below.</Text>
    </View>
  );
}

function buildQrPath(value: string) {
  const qr = QRCode.create(value || "https://app7i.com", { errorCorrectionLevel: "M" });
  const quietZone = 4;
  const moduleSize = qr.modules.size;
  const viewBoxSize = moduleSize + quietZone * 2;
  const commands: string[] = [];

  for (let row = 0; row < moduleSize; row += 1) {
    for (let col = 0; col < moduleSize; col += 1) {
      if (qr.modules.get(col, row)) {
        commands.push(`M${col + quietZone} ${row + quietZone}h1v1H${col + quietZone}z`);
      }
    }
  }

  return { path: commands.join(""), size: viewBoxSize };
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: `${c.black}73`,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: c.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
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
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    color: c.slate900,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    color: c.slate500,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
  },
  qrCard: {
    alignItems: "center",
    gap: spacing.md,
    borderRadius: 24,
    padding: spacing.lg,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  qrFrame: {
    padding: spacing.md,
    borderRadius: 24,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.slate100,
  },
  qrFallback: {
    width: 212,
    height: 212,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  qrFallbackText: {
    color: c.slate500,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  username: {
    color: c.slate900,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0,
  },
  url: {
    color: c.slate500,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
