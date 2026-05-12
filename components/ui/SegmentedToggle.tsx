import React from "react";
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { colors, radius, spacing, typography } from "../../theme";

type Segment<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedToggle<T extends string>({
  segments,
  value,
  onChange,
  style,
}: Props<T>) {
  return (
    <View style={[styles.container, style]}>
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable
            key={s.value}
            onPress={() => onChange(s.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text
              style={[
                typography.labelLg,
                {
                  color: active ? colors.onPrimary : colors.onSurfaceVariant,
                  textAlign: "center",
                },
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.gradientStart,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
