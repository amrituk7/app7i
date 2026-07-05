import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import type { Message } from "../../types";

type Props = {
  message: Message;
  mine: boolean;
  grouped?: boolean;
  isFollowedByGroup?: boolean;
  isLastSent?: boolean;
  onLongPress?: () => void;
};

export function MessageBubble({
  message,
  mine,
  grouped = false,
  isFollowedByGroup = false,
  isLastSent = false,
  onLongPress,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const isDeleted = Boolean(message.deleted);

  const tailRadius = 6;
  const fullRadius = 20;
  const cornerStyle = mine
    ? {
        borderBottomRightRadius: isFollowedByGroup ? fullRadius : tailRadius,
        borderTopRightRadius: grouped ? tailRadius : fullRadius,
      }
    : {
        borderBottomLeftRadius: isFollowedByGroup ? fullRadius : tailRadius,
        borderTopLeftRadius: grouped ? tailRadius : fullRadius,
      };

  return (
    <View
      style={[
        styles.wrap,
        mine ? styles.wrapMine : styles.wrapTheirs,
        grouped && styles.grouped,
      ]}
    >
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={350}
        style={({ pressed }) => [
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
          isDeleted && styles.bubbleDeleted,
          cornerStyle,
          pressed && onLongPress && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.text,
            mine ? styles.textMine : styles.textTheirs,
            isDeleted && styles.textDeleted,
          ]}
        >
          {isDeleted ? "Message deleted" : message.text}
        </Text>
      </Pressable>
      {isLastSent && mine && !isDeleted ? (
        <View style={styles.deliveredRow}>
          <Ionicons
            name={message.read ? "checkmark-done" : "checkmark"}
            size={12}
            color={message.read ? c.emerald : c.slate500}
          />
          <Text style={[styles.deliveredText, message.read && styles.deliveredTextRead]}>
            {message.read ? "Read" : "Delivered"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    wrap: {
      maxWidth: "78%",
      marginBottom: 8,
    },
    wrapMine: {
      alignSelf: "flex-end",
      alignItems: "flex-end",
    },
    wrapTheirs: {
      alignSelf: "flex-start",
      alignItems: "flex-start",
    },
    grouped: {
      marginBottom: 2,
    },
    bubble: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 20,
    },
    bubbleMine: {
      backgroundColor: c.emerald,
      shadowColor: c.emerald,
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    bubbleTheirs: {
      backgroundColor: c.surface,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    bubbleDeleted: {
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    pressed: {
      opacity: 0.75,
    },
    text: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "400",
      letterSpacing: -0.1,
    },
    textMine: {
      color: c.white,
    },
    textTheirs: {
      color: c.slate900,
    },
    textDeleted: {
      color: c.slate500,
      fontStyle: "italic",
    },
    deliveredRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 4,
      marginRight: 4,
    },
    deliveredText: {
      color: c.slate500,
      fontSize: 11,
      fontWeight: "500",
    },
    deliveredTextRead: {
      color: c.emerald,
    },
  });
