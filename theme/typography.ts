import { TextStyle } from "react-native";

export const fontFamily = {
  montserratBold: "Montserrat_700Bold",
  montserratSemiBold: "Montserrat_600SemiBold",
  montserratMedium: "Montserrat_500Medium",
  interRegular: "Inter_400Regular",
  interMedium: "Inter_500Medium",
  interSemiBold: "Inter_600SemiBold",
  interBold: "Inter_700Bold",
} as const;

export const typography: Record<string, TextStyle> = {
  displayLg: {
    fontFamily: fontFamily.montserratBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  displayMd: {
    fontFamily: fontFamily.montserratBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  headlineLg: {
    fontFamily: fontFamily.montserratBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  headlineMd: {
    fontFamily: fontFamily.montserratSemiBold,
    fontSize: 24,
    lineHeight: 32,
  },
  headlineSm: {
    fontFamily: fontFamily.montserratSemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  titleLg: {
    fontFamily: fontFamily.montserratSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  titleMd: {
    fontFamily: fontFamily.interSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyLg: {
    fontFamily: fontFamily.interRegular,
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: fontFamily.interRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: fontFamily.interRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  labelLg: {
    fontFamily: fontFamily.interSemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.7,
  },
  labelMd: {
    fontFamily: fontFamily.interSemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  labelSm: {
    fontFamily: fontFamily.interMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};
