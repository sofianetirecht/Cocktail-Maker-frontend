import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import { Heart, X, RotateCw } from "lucide-react-native";
import { addFavoriteSync } from "../reducers/favorites";
import {
  AppHeader,
  SegmentedToggle,
  Chip,
  PrimaryButton,
} from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";

const API_URL = "https://cocktail-maker-backend.onrender.com";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const FETCH_TIMEOUT_MS = 9000;
const MIN_EMPTY_FETCHES_BEFORE_END = 2;
const CARD_WIDTH = SCREEN_WIDTH - spacing.containerMargin * 2;

export default function SurpriseScreen({ navigation }) {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMocktailOnly, setIsMocktailOnly] = useState(false);
  const dispatch = useDispatch();
  const cocktailsRef = useRef([]);
  const currentIndexRef = useRef(0);
  const isMocktailOnlyRef = useRef(false);
  const loadTokenRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const emptyFetchStreakRef = useRef(0);

  const pan = useRef(new Animated.ValueXY()).current;
  const swipeDirection = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialCocktails();
  }, [isMocktailOnly]);

  useEffect(() => {
    cocktailsRef.current = cocktails;
  }, [cocktails]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isMocktailOnlyRef.current = isMocktailOnly;
  }, [isMocktailOnly]);

  const loadInitialCocktails = async () => {
    const loadToken = loadTokenRef.current + 1;
    loadTokenRef.current = loadToken;

    setLoading(true);
    setShowEndMessage(false);
    emptyFetchStreakRef.current = 0;

    let firstBatch = await fetchCocktailBatch(4, isMocktailOnly, []);
    if (firstBatch.length === 0) {
      firstBatch = await fetchCocktailBatch(4, isMocktailOnly, []);
    }

    if (loadTokenRef.current !== loadToken) return;

    setCocktails(firstBatch);
    setCurrentIndex(0);
    cocktailsRef.current = firstBatch;
    currentIndexRef.current = 0;
    pan.setValue({ x: 0, y: 0 });
    swipeDirection.setValue(0);
    setLoading(false);

    fetchAndAppendMore(4, loadToken);
  };

  const fetchAndAppendMore = async (count = 3, expectedLoadToken = null) => {
    if (loadingMoreRef.current) return 0;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const excluded = cocktailsRef.current.map((c) => c.id).filter(Boolean);

      const more = await fetchCocktailBatch(
        count,
        isMocktailOnlyRef.current,
        excluded
      );

      if (expectedLoadToken && loadTokenRef.current !== expectedLoadToken)
        return 0;
      if (more.length === 0) {
        emptyFetchStreakRef.current += 1;
        return 0;
      }

      let appended = 0;
      setCocktails((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const uniqueMore = more.filter((c) => c?.id && !existingIds.has(c.id));
        appended = uniqueMore.length;
        const updated = [...prev, ...uniqueMore];
        cocktailsRef.current = updated;
        return updated;
      });

      if (appended > 0) {
        emptyFetchStreakRef.current = 0;
      } else {
        emptyFetchStreakRef.current += 1;
      }

      return appended;
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  const matchAlcoholFilter = (cocktail, mocktailOnly) => {
    const type = String(cocktail?.type || "").toLowerCase();
    const isSansAlcool =
      type.includes("sans alcool") ||
      type.includes("non alcoholic") ||
      type.includes("non-alcoholic");

    return mocktailOnly ? isSansAlcool : !isSansAlcool;
  };

  const fetchCocktailBatch = async (
    count = 3,
    mocktailOnly = false,
    excludeIds = []
  ) => {
    const alcoholQuery = mocktailOnly ? "without" : "with";
    const seenIds = new Set(excludeIds.map((id) => String(id)));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({
        count: String(count),
        alcohol: alcoholQuery,
      });
      if (excludeIds.length > 0)
        params.set("excludeIds", excludeIds.join(","));

      const response = await fetch(
        `${API_URL}/cocktail/surprise/batch?${params.toString()}`,
        { signal: controller.signal }
      );

      if (response.ok) {
        const data = await response.json();
        const cocktailsResp = Array.isArray(data?.cocktails) ? data.cocktails : [];

        const unique = [];
        for (const cocktail of cocktailsResp) {
          const id = String(cocktail?.id || "");
          if (!id || seenIds.has(id)) continue;
          if (!matchAlcoholFilter(cocktail, mocktailOnly)) continue;

          seenIds.add(id);
          unique.push(cocktail);

          if (unique.length >= count) break;
        }

        if (unique.length > 0) return unique;
      }
    } catch {
      // fallback below
    } finally {
      clearTimeout(timeout);
    }

    const fallbackBatch = [];
    let attempts = 0;
    const maxAttempts = count * 6;

    while (fallbackBatch.length < count && attempts < maxAttempts) {
      attempts += 1;
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(
        () => fallbackController.abort(),
        FETCH_TIMEOUT_MS
      );

      try {
        const fallbackResponse = await fetch(
          `${API_URL}/cocktail/surprise?alcohol=${alcoholQuery}&excludeIds=${encodeURIComponent(Array.from(seenIds).join(","))}`,
          { signal: fallbackController.signal }
        );

        if (!fallbackResponse.ok) continue;

        const fallbackData = await fallbackResponse.json();
        const cocktail = fallbackData?.ok ? fallbackData.cocktail : null;
        const id = String(cocktail?.id || "");

        if (!id || seenIds.has(id)) continue;
        if (!matchAlcoholFilter(cocktail, mocktailOnly)) continue;

        seenIds.add(id);
        fallbackBatch.push(cocktail);
      } catch {
        // ignore
      } finally {
        clearTimeout(fallbackTimeout);
      }
    }

    return fallbackBatch;
  };

  const currentCocktail = cocktails[currentIndex];
  const nextCocktail = cocktails[currentIndex + 1];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const swipeRight = () => {
    Animated.timing(pan, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      const activeCocktail = cocktailsRef.current[currentIndexRef.current];
      if (activeCocktail) {
        dispatch(
          addFavoriteSync({
            id: activeCocktail.id,
            nom: activeCocktail.nom,
            image: activeCocktail.image,
            type: activeCocktail.type,
          })
        );
      }
      nextCard();
    });
  };

  const swipeLeft = () => {
    Animated.timing(pan, {
      toValue: { x: -(SCREEN_WIDTH + 100), y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      nextCard();
    });
  };

  const nextCard = async () => {
    const nextIdx = currentIndexRef.current + 1;
    setCurrentIndex((prev) => prev + 1);
    currentIndexRef.current = nextIdx;

    requestAnimationFrame(() => {
      pan.setValue({ x: 0, y: 0 });
      swipeDirection.setValue(0);
    });

    if (nextIdx >= cocktailsRef.current.length - 2) {
      setShowEndMessage(false);
      const appended = await fetchAndAppendMore(6);

      if (appended === 0 && nextIdx >= cocktailsRef.current.length) {
        const retryAppended = await fetchAndAppendMore(8);
        setShowEndMessage(
          retryAppended === 0 &&
            emptyFetchStreakRef.current >= MIN_EMPTY_FETCHES_BEFORE_END
        );
      }
    }
  };

  useEffect(() => {
    if (loading) return;
    if (currentIndex < cocktails.length) {
      setShowEndMessage(false);
      return;
    }
    if (loadingMoreRef.current) return;

    (async () => {
      setShowEndMessage(false);
      const appended = await fetchAndAppendMore(8);
      setShowEndMessage(
        appended === 0 &&
          currentIndexRef.current >= cocktailsRef.current.length &&
          emptyFetchStreakRef.current >= MIN_EMPTY_FETCHES_BEFORE_END
      );
    })();
  }, [currentIndex, cocktails.length, loading]);

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-12deg", "0deg", "12deg"],
    extrapolate: "clamp",
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={s.root}>
      <AppHeader onAvatarPress={() => navigation.navigate("Profile")} />

      <View style={s.content}>
        {/* ── Hero compact ── */}
        <View style={s.hero}>
          <Text style={[typography.headlineMd, s.heroTitle]}>
            Cocktail Match <Text style={s.heart}>❤️</Text>
          </Text>
          <Text style={[typography.bodySm, s.heroSub]}>
            Swipe pour trouver l'amour
          </Text>
        </View>

        {/* ── Toggle ── */}
        <SegmentedToggle
          segments={[
            { value: "alcohol", label: "Avec alcool" },
            { value: "mocktail", label: "Sans alcool" },
          ]}
          value={isMocktailOnly ? "mocktail" : "alcohol"}
          onChange={(v) => setIsMocktailOnly(v === "mocktail")}
          style={{ marginBottom: spacing.md }}
        />

        {/* ── Card stack + straddling buttons ── */}
        <View style={s.stackWrapper}>
          <View style={s.cardArea}>
            {loading && (
              <View style={s.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[typography.bodyMd, s.loadingText]}>
                  Chargement des cocktails…
                </Text>
              </View>
            )}

            {!loading &&
              !loadingMore &&
              showEndMessage &&
              currentIndex >= cocktails.length && (
                <View style={s.centered}>
                  <View style={s.emptyCard}>
                    <Text style={s.emptyIcon}>🎉</Text>
                    <Text style={[typography.headlineSm, s.emptyTitle]}>
                      C'est tout pour l'instant
                    </Text>
                    <Text style={[typography.bodySm, s.emptyText]}>
                      Tu as exploré tous les cocktails. Recharge pour en voir plus.
                    </Text>
                    <PrimaryButton
                      label="Recharger"
                      onPress={loadInitialCocktails}
                      icon={
                        <RotateCw size={16} color="#fff" strokeWidth={2.5} />
                      }
                      fullWidth={false}
                      size="md"
                      style={{ marginTop: spacing.md }}
                    />
                  </View>
                </View>
              )}

            {!loading && loadingMore && currentIndex >= cocktails.length && (
              <View style={s.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[typography.bodyMd, s.loadingText]}>
                  Chargement de nouveaux cocktails…
                </Text>
              </View>
            )}

            {!loading && currentCocktail && (
              <View style={s.cardContainer}>
                {nextCocktail && (
                  <View
                    style={[s.card, s.cardBehind]}
                    key={`next-${currentIndex + 1}`}
                  >
                    <Image
                      source={{ uri: nextCocktail.image }}
                      style={s.cardImage}
                    />
                  </View>
                )}

                <Animated.View
                  key={`current-${currentIndex}`}
                  style={[
                    s.card,
                    {
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { rotate },
                      ],
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <Pressable
                    style={s.cardPressOverlay}
                    onPress={() =>
                      navigation.navigate("Details", {
                        cocktailId: currentCocktail.id,
                      })
                    }
                  />

                  <Image
                    source={{ uri: currentCocktail.image }}
                    style={s.cardImage}
                  />
                  <LinearGradient
                    colors={["rgba(0,0,0,0)", "rgba(22,17,27,0.95)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={s.cardOverlay}
                    pointerEvents="none"
                  />

                  {/* Stamps */}
                  <Animated.View
                    style={[s.stamp, s.stampNope, { opacity: nopeOpacity }]}
                  >
                    <Text style={[s.stampText, { color: colors.tertiaryContainer }]}>
                      NOPE
                    </Text>
                  </Animated.View>
                  <Animated.View
                    style={[s.stamp, s.stampLike, { opacity: likeOpacity }]}
                  >
                    <Text style={[s.stampText, { color: colors.primary }]}>
                      LIKE
                    </Text>
                  </Animated.View>

                  {/* Badges */}
                  <View style={s.badgeRow}>
                    {currentCocktail.type ? (
                      <Chip
                        label={currentCocktail.type}
                        variant="solid"
                        style={s.badge}
                      />
                    ) : null}
                    {currentCocktail.categorie ? (
                      <Chip
                        label={String(currentCocktail.categorie).toUpperCase()}
                        variant="outline"
                        uppercase
                        style={s.badge}
                      />
                    ) : null}
                  </View>

                  {/* Info */}
                  <View style={s.cardInfo} pointerEvents="none">
                    <Text
                      style={[typography.displayMd, s.cardTitle]}
                      numberOfLines={2}
                    >
                      {currentCocktail.nom}
                    </Text>
                  </View>
                </Animated.View>
              </View>
            )}
          </View>

          {/* ── Action buttons — straddling card bottom edge ── */}
          {!loading && currentCocktail && (
            <View style={s.actionsRow}>
              <Pressable
                onPress={swipeLeft}
                style={({ pressed }) => [
                  s.actionBtn,
                  s.dislikeBtn,
                  { transform: [{ scale: pressed ? 0.92 : 1 }] },
                ]}
              >
                <X size={26} color={colors.tertiaryContainer} strokeWidth={2.5} />
              </Pressable>

              <Pressable
                onPress={swipeRight}
                style={({ pressed }) => [
                  s.actionBtn,
                  s.likeBtn,
                  { transform: [{ scale: pressed ? 0.92 : 1 }] },
                ]}
              >
                <Heart
                  size={26}
                  color={colors.onPrimary}
                  strokeWidth={2.5}
                  fill={colors.onPrimary}
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.xs,
    paddingBottom: 110, // clearance tab bar flottante (~90 + marge)
  },

  // Hero compact (sur une seule ligne pour économiser la verticale)
  hero: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.onSurface,
    textAlign: "center",
  },
  heart: {
    fontSize: 22,
  },
  heroSub: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 2,
  },

  // States
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },

  emptyCard: {
    backgroundColor: colors.glassSurface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.onSurface,
    marginBottom: 6,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },

  // Wrapper for card + straddling buttons
  stackWrapper: {
    flex: 1,
  },
  // Card stack — leaves room for half-button overlap at bottom
  cardArea: {
    flex: 1,
    paddingBottom: 30, // half of button height (60/2) so buttons straddle the edge
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    width: CARD_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: "100%",
    borderRadius: radius.xxl,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.glassSurface,
  },
  cardBehind: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  cardPressOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },

  // Stamps
  stamp: {
    position: "absolute",
    top: 48,
    borderWidth: 4,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  stampNope: {
    left: 24,
    borderColor: colors.tertiaryContainer,
    backgroundColor: "rgba(255, 79, 114, 0.15)",
    transform: [{ rotate: "-18deg" }],
  },
  stampLike: {
    right: 24,
    borderColor: colors.primary,
    backgroundColor: "rgba(221, 183, 255, 0.18)",
    transform: [{ rotate: "18deg" }],
  },
  stampText: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Badges over card
  badgeRow: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    alignSelf: "auto",
  },

  // Title under image
  cardInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
  },
  cardTitle: {
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Actions — absolutely centered, top half overlaps card bottom
  actionsRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xl,
    zIndex: 10,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dislikeBtn: {
    backgroundColor: colors.glassSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  likeBtn: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  // Next Match
  nextMatchCard: {
    backgroundColor: colors.glassSurface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  nextMatchInner: {
    padding: spacing.md,
  },
  nextMatchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  nextMatchTitle: {
    color: colors.primary,
  },
  nextMatchKicker: {
    color: colors.onSurfaceVariant,
  },
  nextMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  nextMatchImage: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  nextMatchBars: {
    flex: 1,
    gap: 6,
  },
  skeletonBar: {
    height: 8,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 4,
  },
});
