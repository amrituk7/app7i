import { useRef } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ColorPalette } from "../../theme/colors";
import { useColors } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { spacing } from "../../theme/spacing";

type Props = {
  /** Width revealed under the row when swiped left. */
  actionWidth?: number;
  /** Tint of the destructive action behind the row. */
  actionColor?: string;
  /** Icon shown in the action area. */
  actionIcon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Label shown under the icon. */
  actionLabel?: string;
  /** Called when the action is committed (swipe past threshold + release, OR tap). */
  onAction: () => void;
  /** Disable swipe (loading state). */
  disabled?: boolean;
  /** Corner radius of the masked row (match the child card's radius). */
  radius?: number;
  children: React.ReactNode;
};

const THRESHOLD = -60;
const COMMIT_THRESHOLD = -160;

export function SwipeableRow({
  actionWidth = 96,
  actionColor,
  actionIcon = "trash",
  actionLabel = "Delete",
  onAction,
  disabled,
  radius,
  children,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const resolvedActionColor = actionColor ?? c.red;
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        if (disabled) return false;
        // Only respond to horizontal-dominant gestures
        return Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;
      },
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dx > 0 && !isOpen.current) {
          translateX.setValue(0);
        } else {
          const next = isOpen.current ? -actionWidth + gesture.dx : gesture.dx;
          translateX.setValue(Math.max(-actionWidth - 30, Math.min(0, next)));
        }
      },
      onPanResponderRelease: (_evt, gesture) => {
        const final = isOpen.current ? -actionWidth + gesture.dx : gesture.dx;
        if (final < COMMIT_THRESHOLD) {
          // Commit destructive action
          Animated.timing(translateX, {
            toValue: -500,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            onAction();
          });
        } else if (final < THRESHOLD) {
          // Snap open to action width
          isOpen.current = true;
          Animated.spring(translateX, {
            toValue: -actionWidth,
            useNativeDriver: true,
            tension: 60,
            friction: 9,
          }).start();
        } else {
          // Snap closed
          isOpen.current = false;
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 60,
            friction: 9,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: isOpen.current ? -actionWidth : 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  function handleActionTap() {
    Animated.timing(translateX, {
      toValue: -500,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onAction();
    });
  }

  return (
    <View style={[styles.wrap, radius != null && { borderRadius: radius }]}>
      <View style={[styles.actionLayer, { backgroundColor: resolvedActionColor, width: actionWidth }]}>
        <Pressable
          onPress={handleActionTap}
          style={styles.actionPressable}
          hitSlop={4}
        >
          <Ionicons name={actionIcon} size={22} color={c.white} />
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden",
  },
  actionLayer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPressable: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    color: c.white,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  content: {
    backgroundColor: c.surface,
  },
});
