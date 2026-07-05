import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Text,
  type StyleProp,
  type TextStyle,
} from "react-native";

type AnimatedNumberProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
};

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  style,
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    animatedValue.setValue(0);

    const listenerId = animatedValue.addListener(({ value: current }) => {
      setDisplay(Math.round(current));
    });
    const animation = Animated.timing(animatedValue, {
      toValue: value,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });

    animation.start(() => setDisplay(Math.round(value)));

    return () => {
      animation.stop();
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue, value]);

  return <Text style={style}>{`${prefix}${display}${suffix}`}</Text>;
}
