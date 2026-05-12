import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Brain,
  Wine,
  Heart,
  Search,
  ChevronRight,
} from "lucide-react-native";
import { AppHeader, GlassCard, ScreenContainer } from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";

type MenuItem = {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  desc: string;
  route: string;
  badge?: string;
  variant: "default" | "primary" | "accent";
};

const MENU_ITEMS: MenuItem[] = [
  {
    icon: Brain,
    label: "Recette sur mesure",
    desc: "Créez un cocktail selon vos goûts",
    route: "AIRecipe",
    badge: "IA BOOST",
    variant: "primary",
  },
  {
    icon: Heart,
    label: "Swipe et match",
    desc: "Au lieu de trouver l'amour, trouvez votre cocktail idéal",
    route: "Swipe",
    variant: "accent",
  },
  {
    icon: Wine,
    label: "Recherche par ingrédients",
    desc: "Une idée d'ingrédient ? Trouvez les cocktails possibles",
    route: "Search",
    variant: "default",
  },
  {
    icon: Search,
    label: "Recherche par nom",
    desc: "Trouvez le cocktail de vos rêves",
    route: "SearchByName",
    variant: "default",
  },
];

function MenuCardItem({
  item,
  index,
  onPress,
}: {
  item: MenuItem;
  index: number;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const Icon = item.icon;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: 120 + index * 90,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <GlassCard
          variant={item.variant === "accent" ? "strong" : "default"}
          borderRadius={radius.xl}
          style={[
            styles.card,
            item.variant === "primary" && styles.cardPrimary,
            item.variant === "accent" && styles.cardAccent,
          ]}
        >
          {item.variant === "accent" && (
            <LinearGradient
              colors={["rgba(255, 79, 114, 0.22)", "rgba(168, 85, 247, 0.18)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
          )}

          <View style={styles.cardInner}>
            <View
              style={[
                styles.iconBox,
                item.variant === "primary" && styles.iconBoxPrimary,
                item.variant === "accent" && styles.iconBoxAccent,
              ]}
            >
              <Icon
                size={22}
                color={
                  item.variant === "accent"
                    ? colors.tertiary
                    : item.variant === "primary"
                      ? colors.primary
                      : colors.onSurfaceVariant
                }
                strokeWidth={2}
              />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text
                  style={[typography.headlineSm, styles.cardLabel]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[typography.bodySm, styles.cardDesc]}>
                {item.desc}
              </Text>
            </View>

            <ChevronRight
              size={22}
              color={colors.onSurfaceVariant}
              strokeWidth={2}
            />
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const heroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.root}>
      <AppHeader
        showHomeButton={false}
        onAvatarPress={() => navigation.navigate("Profile")}
      />

      <ScreenContainer>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[typography.headlineLg, styles.heroTitle, { fontSize: 28, lineHeight: 36 }]}>
            Devenez le barman{"\n"}
            <Text style={styles.heroAccent}>que vous méritez</Text>
          </Text>
        </Animated.View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={[typography.labelLg, styles.dividerText]}>
            Choisissez votre mode
          </Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.cards}>
          {MENU_ITEMS.map((item, i) => (
            <MenuCardItem
              key={item.route}
              item={item}
              index={i}
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </View>

      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  hero: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.onSurface,
    textAlign: "center",
  },
  heroAccent: {
    color: colors.primary,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
  },
  dividerText: {
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 11,
  },

  cards: {
    gap: spacing.md,
  },
  card: {
    overflow: "hidden",
  },
  cardPrimary: {
    borderColor: "rgba(221, 183, 255, 0.35)",
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  cardAccent: {
    borderColor: "rgba(255, 79, 114, 0.35)",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.glassFill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  iconBoxPrimary: {
    backgroundColor: "rgba(221, 183, 255, 0.12)",
    borderColor: "rgba(221, 183, 255, 0.3)",
  },
  iconBoxAccent: {
    backgroundColor: "rgba(255, 79, 114, 0.14)",
    borderColor: "rgba(255, 79, 114, 0.35)",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  cardLabel: {
    color: colors.onSurface,
    flexShrink: 1,
  },
  cardDesc: {
    color: colors.onSurfaceVariant,
  },
  badge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  inspirationWrap: {
    marginTop: spacing.xl,
    borderRadius: radius.xxl,
    overflow: "hidden",
    height: 180,
  },
  inspirationImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  inspirationContent: {
    padding: spacing.lg,
  },
  inspirationKicker: {
    color: colors.primary,
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1.5,
    fontSize: 11,
  },
  inspirationTitle: {
    color: "#fff",
  },
});
