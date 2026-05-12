import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ScrollView,
  ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme";

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
  padHorizontal?: boolean;
  /** Add bottom padding to clear the floating tab bar */
  withTabBar?: boolean;
};

const TAB_BAR_CLEARANCE = 90;

export function ScreenContainer({
  children,
  scroll = true,
  contentContainerStyle,
  style,
  scrollProps,
  padHorizontal = true,
  withTabBar = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const padding = padHorizontal
    ? { paddingHorizontal: spacing.containerMargin }
    : null;

  const bottomClearance = withTabBar
    ? TAB_BAR_CLEARANCE + Math.max(insets.bottom - 12, 0)
    : Math.max(insets.bottom, spacing.lg);

  if (scroll) {
    return (
      <ScrollView
        style={[styles.root, style]}
        contentContainerStyle={[
          { paddingBottom: bottomClearance, paddingTop: spacing.md },
          padding,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.root,
        padding,
        { paddingTop: spacing.md, paddingBottom: bottomClearance },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
