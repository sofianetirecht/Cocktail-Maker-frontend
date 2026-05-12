import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { colors, radius, spacing, typography } from "../../theme";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  variant?: "solid" | "outline" | "ghost";
  style?: StyleProp<ViewStyle>;
  uppercase?: boolean;
};

export function Chip({
  label,
  active,
  onPress,
  variant = "solid",
  style,
  uppercase,
}: Props) {
  const isInteractive = !!onPress;

  const containerStyle = [
    styles.base,
    variant === "outline" && styles.outline,
    variant === "solid" && (active ? styles.solidActive : styles.solid),
    variant === "ghost" && styles.ghost,
    style,
  ];

  const textStyle = [
    typography.labelMd,
    {
      color:
        variant === "solid" && active
          ? colors.onPrimary
          : variant === "outline"
            ? colors.tertiary
            : colors.onSurfaceVariant,
      letterSpacing: uppercase ? 1 : 0.4,
    },
    uppercase && { textTransform: "uppercase" as const },
  ];

  if (isInteractive) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyle,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={textStyle}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable disabled style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  solid: {
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  solidActive: {
    backgroundColor: colors.primary,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.tertiary,
    backgroundColor: "transparent",
  },
  ghost: {
    backgroundColor: "transparent",
  },
});
