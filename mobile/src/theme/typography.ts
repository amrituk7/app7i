import type { TextStyle } from "react-native";

type TypeToken = Pick<TextStyle, "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing">;

export const typography: Record<string, TypeToken> = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700" },
  title1:     { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  title2:     { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  title3:     { fontSize: 20, lineHeight: 25, fontWeight: "600" },
  headline:   { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  body:       { fontSize: 17, lineHeight: 22, fontWeight: "400" },
  callout:    { fontSize: 16, lineHeight: 21, fontWeight: "400" },
  subhead:    { fontSize: 15, lineHeight: 20, fontWeight: "400" },
  footnote:   { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  caption1:   { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  caption2:   { fontSize: 11, lineHeight: 13, fontWeight: "400" },
};

// Legacy numeric aliases — backward compat for any screen that imports these directly.
export const title = 28;
export const h1 = 22;
export const h2 = 20;
export const h3 = 17;
export const body = 17;
export const small = 13;
export const tiny = 11;
