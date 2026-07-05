import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColors } from "../../theme/ThemeContext";

type PulseDotProps = {
  active?: boolean;
  count?: number;
  color?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function PulseDot({
  active = true,
  count,
  color,
  textColor,
  style,
}: PulseDotProps) {
  const c = useColors();
  const dotColor = color ?? c.emerald;
  const labelColor = textColor ?? c.white;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.stopAnimation();
      scale.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [active, scale]);

  return (
    <Animated.View
      style={[
        count === undefined ? styles.dot : styles.badge,
        { backgroundColor: dotColor, transform: [{ scale }] },
        style,
      ]}
    >
      {count !== undefined ? (
        <Text style={[styles.count, { color: labelColor }]}>{count}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  count: {
    fontSize: 12,
    fontWeight: "700",
  },
});
