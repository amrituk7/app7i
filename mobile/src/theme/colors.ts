// Light palette - Apple HIG systemGroupedBackground family.
export const lightColors = {
  // Surfaces
  background:    "#F2F2F7",   // iOS systemGroupedBackground
  surface:       "#FFFFFF",   // iOS secondarySystemGroupedBackground
  surfaceRaised: "#FFFFFF",   // elevated card
  surfaceMuted:  "#F2F2F7",   // muted / inset area

  // Borders and separators
  border:        "#E5E5EA",   // iOS separator
  borderStrong:  "#C7C7CC",

  // Text hierarchy
  slate900:      "#1C1C1E",   // iOS label / primary text
  slate700:      "#3A3A3C",   // iOS secondaryLabel
  slate600:      "#48484A",   // iOS tertiaryLabel
  slate500:      "#6C6C70",   // iOS quaternaryLabel / metadata
  slate300:      "#AEAEB2",   // placeholder / disabled
  slate100:      "#E5E5EA",   // hairline separators

  // Brand — App7i signature indigo, used with RESTRAINT: reserved for genuine
  // accents (primary fills, send bubbles, "today", progress, links, active tab).
  // Utility icons/chips deliberately stay NEUTRAL via emeraldDark/emeraldSoft so
  // the colour reads as intentional, not noisy. Core surfaces/text neutral below.
  emerald:       "#464CA3",   // brand accent — deep muted indigo (fills, bubbles, today, progress, links)
  emeraldLight:  "#565CB5",   // active accent
  emeraldDark:   "#1C1C1E",   // neutral icon/text (utility) — intentionally NOT indigo
  emeraldSoft:   "#F2F2F7",   // neutral chip / badge bg — intentionally NOT indigo
  onAccent:      "#FFFFFF",   // text/icons placed on emerald or emeraldLight fills
  onInverted:    "#FFFFFF",   // text/icons placed on slate900 fills

  // Semantic
  red:           "#FF3B30",   // iOS destructive
  redSoft:       "#FFF2F1",
  amber:         "#FF9500",   // iOS orange / warning
  amberSoft:     "#FFF5E6",
  green:         "#1C1C1E",   // success alias, neutralised for brand consistency
  greenSoft:     "#F2F2F7",
  blue:          "#007AFF",   // iOS blue / info
  blueSoft:      "#EBF4FF",

  // Navigation
  navBg:         "#FFFFFF",
  navActive:     "#3F4499",   // active tab tint (deep indigo, AA-safe)
  navBorder:     "#E5E5EA",

  // Misc
  white:         "#FFFFFF",
  black:         "#000000",
};

// Dark palette - neutral native-app dark mode.
//
// Dark mode intentionally removes the green-heavy surface treatment. Primary
// controls stay charcoal; active states and icon accents resolve to white.
export const darkColors = {
  // Surfaces
  background:    "#08090A",
  surface:       "#0D0F10",
  surfaceRaised: "#111315",
  surfaceMuted:  "#171A1D",

  // Borders and separators
  border:        "#24272B",
  borderStrong:  "#3B4045",

  // Text hierarchy
  slate900:      "#F2F3F5",
  slate700:      "#D0D3D6",
  slate600:      "#A1A6AB",
  slate500:      "#7D838A",
  slate300:      "#50565C",
  slate100:      "#24272B",

  // Brand — same App7i signature indigo (restrained; see light-palette note).
  emerald:       "#666DAE",   // muted indigo for genuine progress and selection states
  emeraldLight:  "#7B82BF",
  emeraldDark:   "#E8EAED",   // neutral utility icons and text
  emeraldSoft:   "#171A1D",
  onAccent:      "#FAFAFA",
  onInverted:    "#0B0C0D",

  // Semantic
  red:           "#F0645C",
  redSoft:       "#251313",
  amber:         "#D99A58",
  amberSoft:     "#241B12",
  green:         "#D7DBDF",
  greenSoft:     "#171A1D",
  blue:          "#68A9D4",
  blueSoft:      "#101B23",

  // Navigation
  navBg:         "#090A0B",
  navActive:     "#F2F3F5",
  navBorder:     "#202327",

  // Misc
  white:         "#FFFFFF",
  black:         "#000000",
};

export type ColorPalette = typeof lightColors;

// Default export = light palette for backward-compat StyleSheet.create calls
// in components that have not migrated to useThemedStyles yet. Migrated
// components should pull useColors from ThemeContext for live theme switching.
export const colors: ColorPalette = lightColors;

// Matches app.json splash backgroundColor. This is used in App.tsx before the
// ThemeProvider mounts and cannot access the live palette.
export const SPLASH_BG = "#0B0B0C";
