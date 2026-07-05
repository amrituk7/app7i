import { useMemo } from "react";
import type { ColorPalette } from "./colors";
import { useColors } from "./ThemeContext";

/**
 * Build a StyleSheet (or any style object) from the current theme palette.
 * The factory runs once per theme change, then results are memoised — so steady-state
 * renders pay nothing.
 *
 * Pattern:
 *   const styles = useThemedStyles(makeStyles);
 *   const makeStyles = (c: ColorPalette) => StyleSheet.create({ ... });
 */
export function useThemedStyles<T>(make: (c: ColorPalette) => T): T {
  const colors = useColors();
  return useMemo(() => make(colors), [colors, make]);
}
