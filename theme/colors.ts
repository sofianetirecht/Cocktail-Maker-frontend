export const colors = {
  background: "#16111b",
  surface: "#16111b",
  surfaceDim: "#16111b",
  surfaceBright: "#3d3741",
  surfaceContainerLowest: "#110c15",
  surfaceContainerLow: "#1f1a23",
  surfaceContainer: "#231e27",
  surfaceContainerHigh: "#2e2832",
  surfaceContainerHighest: "#39323d",
  surfaceVariant: "#39323d",

  onSurface: "#eadfed",
  onSurfaceVariant: "#cfc2d6",
  onBackground: "#eadfed",
  inverseSurface: "#eadfed",
  inverseOnSurface: "#342e38",

  outline: "#988d9f",
  outlineVariant: "#4d4354",

  primary: "#ddb7ff",
  onPrimary: "#490080",
  primaryContainer: "#b76dff",
  onPrimaryContainer: "#400071",
  inversePrimary: "#842bd2",
  primaryFixed: "#f0dbff",
  primaryFixedDim: "#ddb7ff",
  onPrimaryFixed: "#2c0051",
  onPrimaryFixedVariant: "#6900b3",

  secondary: "#d2bfe8",
  onSecondary: "#382a4a",
  secondaryContainer: "#4f4062",
  onSecondaryContainer: "#c0aed6",
  secondaryFixed: "#eddcff",
  secondaryFixedDim: "#d2bfe8",
  onSecondaryFixed: "#221534",
  onSecondaryFixedVariant: "#4f4062",

  tertiary: "#ffb2ba",
  onTertiary: "#67001f",
  tertiaryContainer: "#ff4f72",
  onTertiaryContainer: "#5b001a",
  tertiaryFixed: "#ffd9dc",
  tertiaryFixedDim: "#ffb2ba",
  onTertiaryFixed: "#400010",
  onTertiaryFixedVariant: "#910030",

  error: "#ffb4ab",
  onError: "#690005",
  errorContainer: "#93000a",
  onErrorContainer: "#ffdad6",

  surfaceTint: "#ddb7ff",

  gradientStart: "#A855F7",
  gradientEnd: "#7C3AED",

  glassSurface: "#4b3757",
  glassFill: "rgba(75, 55, 87, 0.7)",
  glassFillStrong: "rgba(75, 55, 87, 0.85)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  glassBorderStrong: "rgba(255, 255, 255, 0.2)",
  glowPrimary: "rgba(168, 85, 247, 0.45)",
  scrim: "rgba(0, 0, 0, 0.55)",
} as const;

export type ColorToken = keyof typeof colors;
