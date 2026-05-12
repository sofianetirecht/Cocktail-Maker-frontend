import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Home, User } from "lucide-react-native";
import { colors, spacing, typography, radius } from "../../theme";

type Props = {
  title?: string;
  showHomeButton?: boolean;
  onHomePress?: () => void;
  onAvatarPress?: () => void;
  avatarSource?: ImageSourcePropType;
};

export function AppHeader({
  title = "COCKTAIL MAKER",
  showHomeButton = true,
  onHomePress,
  onAvatarPress,
  avatarSource,
}: Props) {
  const insets = useSafeAreaInsets();
  const reduxAvatar = useSelector((state: any) => state.user?.value?.avatar);
  const resolvedAvatar = avatarSource ?? (reduxAvatar ? reduxAvatar : undefined);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.side}>
          {showHomeButton ? (
            <Pressable
              onPress={onHomePress}
              hitSlop={10}
              style={({ pressed }) => [
                styles.iconButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Home size={22} color={colors.primary} strokeWidth={2} />
            </Pressable>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>

        <Text style={[typography.titleLg, styles.title]} numberOfLines={1}>
          {title}
        </Text>

        <View style={[styles.side, { alignItems: "flex-end" }]}>
          <Pressable
            onPress={onAvatarPress}
            hitSlop={10}
            style={({ pressed }) => [
              styles.avatarWrapper,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {resolvedAvatar ? (
              <Image source={resolvedAvatar} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={18} color={colors.primary} strokeWidth={2} />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />
    </View>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  side: {
    width: 44,
    justifyContent: "center",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: colors.primary,
    letterSpacing: 3,
    fontSize: 16,
    textTransform: "uppercase",
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginTop: spacing.sm,
    opacity: 0.5,
  },
});
