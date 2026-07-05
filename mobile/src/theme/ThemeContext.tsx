import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { Appearance } from "react-native";

type SystemScheme = "light" | "dark" | null;
import { darkColors, lightColors, type ColorPalette } from "./colors";
import { loadStoredMode, saveStoredMode, type ThemeMode } from "./themePersistence";

type ThemeContextValue = {
  /** User's saved preference. */
  mode: ThemeMode;
  /** What's actually applied right now ("light" | "dark"). */
  effective: "light" | "dark";
  /** Live palette — switches instantly when mode or system scheme changes. */
  colors: ColorPalette;
  /** True once the stored mode has been loaded from AsyncStorage. */
  hydrated: boolean;
  /** Update + persist the user's choice. */
  setMode: (next: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveEffective(mode: ThemeMode, systemScheme: SystemScheme): "light" | "dark" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return systemScheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState<SystemScheme>(() => {
    const initial = Appearance.getColorScheme();
    return initial === "dark" ? "dark" : initial === "light" ? "light" : null;
  });
  const [hydrated, setHydrated] = useState(false);

  // Hydrate stored mode once on mount.
  useEffect(() => {
    let cancelled = false;
    void loadStoredMode().then((stored) => {
      if (cancelled) return;
      setModeState(stored);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for system theme changes — only matters when mode === "system",
  // but keeping the listener always-on keeps the value fresh for instant switch.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === "dark" ? "dark" : colorScheme === "light" ? "light" : null);
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void saveStoredMode(next);
  }, []);

  const effective = resolveEffective(mode, systemScheme);
  const palette = effective === "dark" ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, effective, colors: palette, hydrated, setMode }),
    [mode, effective, palette, hydrated, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback so non-provider code paths (storybook, edge cases) don't crash.
    return {
      mode: "system",
      effective: "light",
      colors: lightColors,
      hydrated: false,
      setMode: () => {},
    };
  }
  return ctx;
}

export function useColors(): ColorPalette {
  return useTheme().colors;
}
