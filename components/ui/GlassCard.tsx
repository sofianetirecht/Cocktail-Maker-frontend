import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { colors, radius } from "../../theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  variant?: "default" | "strong" | "subtle";
  noBorder?: boolean;
};

export function GlassCard({
  children,
  style,
  intensity = 40,
  borderRadius = radius.xl,
  variant = "default",
  noBorder = false,
}: Props) {
  const fill =
    variant === "strong"
      ? colors.glassFillStrong
      : variant === "subtle"
        ? "rgba(255,255,255,0.03)"
        : colors.glassFill;

  const border =
    variant === "strong" ? colors.glassBorderStrong : colors.glassBorder;

  // BlurView ne fonctionne pas sur Android dans tous les cas, on garde un fallback
  if (Platform.OS === "android") {
    return (
      <View
        style={[
          styles.fallback,
          {
            borderRadius,
            backgroundColor: colors.glassSurface,
            borderColor: noBorder ? "transparent" : border,
            borderWidth: noBorder ? 0 : StyleSheet.hairlineWidth,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[{ borderRadius, overflow: "hidden" }, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius, backgroundColor: fill },
        ]}
      />
      <View
        style={{
          borderRadius,
          borderWidth: noBorder ? 0 : StyleSheet.hairlineWidth,
          borderColor: noBorder ? "transparent" : border,
          flex: 1,
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
