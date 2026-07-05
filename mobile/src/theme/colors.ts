// ─── Light palette — Apple HIG systemGroupedBackground family ────────────────
export const lightColors = {
  // Surfaces
  background:    "#F2F2F7",   // iOS systemGroupedBackground
  surface:       "#FFFFFF",   // iOS secondarySystemGroupedBackground
  surfaceRaised: "#FFFFFF",   // elevated card
  surfaceMuted:  "#F2F2F7",   // muted / inset area

  // Borders & separators
  border:        "#E5E5EA",   // iOS separator
  borderStrong:  "#C7C7CC",

  // Text hierarchy
  slate900:      "#1C1C1E",   // iOS label — primary text
  slate700:      "#3A3A3C",   // iOS secondaryLabel
  slate600:      "#48484A",   // iOS tertiaryLabel
  slate500:      "#6C6C70",   // iOS quaternaryLabel / metadata
  slate300:      "#AEAEB2",   // placeholder / disabled
  slate100:      "#E5E5EA",   // hairline separators

  // Brand — emerald green
  emerald:       "#1a7a4a",   // primary action / accent
  emeraldLight:  "#34C77A",   // success / active indicator
  emeraldDark:   "#115c37",   // pressed / deep accent
  emeraldSoft:   "#E8F5EE",   // tinted chip background

  // Semantic
  red:           "#FF3B30",   // iOS destructive
  redSoft:       "#FFF2F1",
  amber:         "#FF9500",   // iOS orange / warning
  amberSoft:     "#FFF5E6",
  green:         "#34C759",   // iOS green / success alias
  greenSoft:     "#E8F5EE",
  blue:          "#007AFF",   // iOS blue / info
  blueSoft:      "#EBF4FF",

  // Navigation
  navBg:         "#FFFFFF",
  navActive:     "#1a7a4a",
  navBorder:     "#E5E5EA",

  // Misc
  white:         "#FFFFFF",
  black:         "#000000",
};

// ─── Dark palette — deep green surface family ─────────────────────────────────
export const darkColors = {
  // Surfaces
  background:    "#000000",   // iOS dark systemGroupedBackground
  surface:       "#1C1C1E",   // iOS dark secondarySystemGroupedBackground
  surfaceRaised: "#2C2C2E",   // elevated card
  surfaceMuted:  "#1C1C1E",

  // Borders & separators
  border:        "#38383A",
  borderStrong:  "#48484A",

  // Text hierarchy
  slate900:      "#FFFFFF",
  slate700:      "#EBEBF5CC",
  slate600:      "#EBEBF5B3",
  slate500:      "#EBEBF599",
  slate300:      "#EBEBF566",
  slate100:      "#38383A",

  // Brand
  emerald:       "#34C77A",   // brighter in dark for accessibility
  emeraldLight:  "#30DB5B",
  emeraldDark:   "#248A57",
  emeraldSoft:   "#0D2419",

  // Semantic
  red:           "#FF453A",
  redSoft:       "#2D0B09",
  amber:         "#FF9F0A",
  amberSoft:     "#2D1B00",
  green:         "#30DB5B",
  greenSoft:     "#0D2419",
  blue:          "#0A84FF",
  blueSoft:      "#001A33",

  // Navigation
  navBg:         "#1C1C1E",
  navActive:     "#34C77A",
  navBorder:     "#38383A",

  // Misc
  white:         "#FFFFFF",
  black:         "#000000",
};

export type ColorPalette = typeof lightColors;

// Default export = light palette for backward-compat (StyleSheet.create calls
// in components that haven't been migrated to useThemedStyles yet).
// Migrated components should pull `useColors` from ./ThemeContext for live
// theme switching.
export const colors: ColorPalette = lightColors;

// Matches app.json splash backgroundColor — used in App.tsx boot gate which
// renders before ThemeProvider mounts and can't access the live palette.
export const SPLASH_BG = "#1a2f23";
