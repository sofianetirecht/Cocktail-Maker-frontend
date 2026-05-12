import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Brain, Bookmark, Search } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { completeOnboarding } from "../reducers/app";
import { PrimaryButton } from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Slide = {
  key: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  iconColor: string;
  glowColor: string;
  title: string;
  titleAccent: string;
  desc: string;
};

const SLIDES: Slide[] = [
  {
    key: "swipe",
    Icon: Flame,
    iconColor: colors.tertiaryContainer,
    glowColor: "rgba(255, 79, 114, 0.35)",
    title: "Swipe &",
    titleAccent: "Match",
    desc: "Découvrez des cocktails en swipant. Likez ceux qui vous font envie, passez les autres.",
  },
  {
    key: "ai",
    Icon: Brain,
    iconColor: colors.primary,
    glowColor: "rgba(168, 85, 247, 0.35)",
    title: "Recette",
    titleAccent: "sur mesure",
    desc: "Décrivez vos envies et notre IA concocte un cocktail unique rien que pour vous.",
  },
  {
    key: "search",
    Icon: Search,
    iconColor: colors.secondary,
    glowColor: "rgba(210, 191, 232, 0.25)",
    title: "Recherche par",
    titleAccent: "ingrédient ou par nom",
    desc: "Vous avez du citron et de la vodka ? Trouvez ce que vous pouvez faire. Ou cherchez directement un cocktail par son nom.",
  },
  {
    key: "fav",
    Icon: Bookmark,
    iconColor: colors.primaryContainer,
    glowColor: "rgba(168, 85, 247, 0.25)",
    title: "Sauvegardez",
    titleAccent: "vos coups de cœur",
    desc: "Gardez une trace de vos découvertes et retrouvez vos recettes favorites en un instant.",
  },
];

export default function OnboardingScreen() {
  const dispatch = useDispatch();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = activeIndex === SLIDES.length - 1;

  function goNext() {
    if (isLast) {
      dispatch(completeOnboarding());
      return;
    }
    flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  }

  function skip() {
    dispatch(completeOnboarding());
  }

  const renderSlide = ({ item }: { item: Slide }) => {
    const { Icon, iconColor, glowColor, title, titleAccent, desc } = item;
    return (
      <View style={s.slide}>
        {/* Icon with glow */}
        <View style={s.iconWrap}>
          <View style={[s.iconGlow, { backgroundColor: glowColor }]} />
          <View style={s.iconCircle}>
            <Icon size={52} color={iconColor} strokeWidth={1.8} />
          </View>
        </View>

        {/* Text */}
        <Text style={[typography.headlineLg, s.title, { fontSize: 34, lineHeight: 42 }]}>
          {title}{"\n"}
          <Text style={[s.titleAccent, { color: iconColor }]}>{titleAccent}</Text>
        </Text>
        <Text style={[typography.bodyMd, s.desc]}>{desc}</Text>
      </View>
    );
  };

  return (
    <View style={s.root}>
      {/* Skip */}
      <Pressable
        onPress={skip}
        hitSlop={12}
        style={({ pressed }) => [s.skipBtn, { opacity: pressed ? 0.5 : 1 }]}
      >
        <Text style={[typography.labelMd, s.skipText]}>Passer</Text>
      </Pressable>

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(idx);
        }}
        style={s.flatList}
      />

      {/* Bottom */}
      <View style={s.bottom}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * SCREEN_WIDTH,
              i * SCREEN_WIDTH,
              (i + 1) * SCREEN_WIDTH,
            ];
            const width = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={[s.dot, { width, opacity }]}
              />
            );
          })}
        </View>

        {/* CTA */}
        <PrimaryButton
          label={isLast ? "Commencer" : "Suivant"}
          onPress={goNext}
          size="lg"
        />
      </View>

      {/* Background glow */}
      <LinearGradient
        colors={[colors.glowPrimary, "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={s.bgGlow}
        pointerEvents="none"
      />
    </View>
  );
}

const ICON_SIZE = 120;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  skipBtn: {
    position: "absolute",
    top: 60,
    right: spacing.containerMargin,
    zIndex: 10,
  },
  skipText: {
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  flatList: {
    flex: 1,
  },

  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.containerMargin + spacing.md,
    paddingTop: 80,
  },

  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  iconGlow: {
    position: "absolute",
    width: ICON_SIZE + 60,
    height: ICON_SIZE + 60,
    borderRadius: (ICON_SIZE + 60) / 2,
    opacity: 0.6,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  titleAccent: {},

  desc: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 26,
  },

  bottom: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: 52,
    gap: spacing.lg,
    alignItems: "center",
  },

  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },

  bgGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: -1,
  },
});
