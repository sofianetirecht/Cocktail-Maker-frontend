import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../../theme";

function hexWithAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const BAR_RADIUS = 28;

export function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={70}
            tint="dark"
            style={[StyleSheet.absoluteFillObject, styles.blurBg]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              styles.androidBg,
            ]}
          />
        )}

        <View style={styles.innerBorder} pointerEvents="none" />

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            const renderIcon = options.tabBarIcon as
              | ((p: {
                  focused: boolean;
                  color: string;
                  size: number;
                }) => React.ReactNode)
              | undefined;

            const activeColor =
              (options.tabBarActiveTintColor as string | undefined) ||
              colors.primary;

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                style={styles.tab}
              >
                <View
                  style={[
                    styles.iconHolder,
                    isFocused && {
                      backgroundColor: hexWithAlpha(activeColor, 0.2),
                      shadowColor: activeColor,
                      shadowOpacity: 0.6,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                >
                  {renderIcon &&
                    renderIcon({
                      focused: isFocused,
                      color: isFocused
                        ? activeColor
                        : colors.onSurfaceVariant,
                      size: 24,
                    })}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
  },
  bar: {
    borderRadius: BAR_RADIUS,
    overflow: "hidden",
    minHeight: 68,
    justifyContent: "center",
    // Halo doux sous la barre flottante
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  blurBg: {
    backgroundColor: "rgba(75, 55, 87, 0.85)", // glassSurface #4b3757 translucide
    borderRadius: BAR_RADIUS,
  },
  androidBg: {
    backgroundColor: colors.glassSurface,
    borderRadius: BAR_RADIUS,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BAR_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconHolder: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
