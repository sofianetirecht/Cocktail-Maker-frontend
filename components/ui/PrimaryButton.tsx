import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, typography } from "../../theme";

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  size?: "md" | "lg";
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  variant = "primary",
  fullWidth = true,
  size = "lg",
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const paddingVertical = size === "lg" ? 16 : 12;
  const labelTypo = size === "lg" ? typography.titleMd : typography.bodySm;

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.wrapper,
          fullWidth && { alignSelf: "stretch" },
          {
            opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
          style,
        ]}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            { paddingVertical, shadowColor: colors.gradientStart },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.content}>
              {icon}
              <Text
                numberOfLines={1}
                style={[labelTypo, styles.labelPrimary]}
              >
                {label}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.secondary,
          fullWidth && { alignSelf: "stretch" },
          { paddingVertical },
          { opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.content}>
            {icon}
            <Text
              numberOfLines={1}
              style={[labelTypo, styles.labelSecondary]}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        { paddingVertical, paddingHorizontal: spacing.md, alignItems: "center" },
        { opacity: isDisabled ? 0.5 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Text style={[typography.titleMd, { color: colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.pill,
    overflow: "visible",
  },
  gradient: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  secondary: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.glassFill,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labelPrimary: {
    color: "#fff",
    fontWeight: "700",
  },
  labelSecondary: {
    color: colors.primary,
    fontWeight: "600",
  },
});
