import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import { addFavorite } from "../reducers/favorites";
// backend render :
const API_URL = "https://cocktail-maker-backend.onrender.com";
// 5G local
// const API_URL = "http://172.20.10.2:3000";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const FETCH_TIMEOUT_MS = 9000;
const MIN_EMPTY_FETCHES_BEFORE_END = 2;

export default function SurpriseScreen({ navigation }) {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMocktailOnly, setIsMocktailOnly] = useState(false);
  const [toggleWidth, setToggleWidth] = useState(0);
  const dispatch = useDispatch();
  const cocktailsRef = useRef([]);
  const currentIndexRef = useRef(0);
  const isMocktailOnlyRef = useRef(false);
  const loadTokenRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const emptyFetchStreakRef = useRef(0);

  // Animation
  const pan = useRef(new Animated.ValueXY()).current;
  const swipeDirection = useRef(new Animated.Value(0)).current;
  const toggleSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialCocktails();
  }, [isMocktailOnly]);

  useEffect(() => {
    Animated.spring(toggleSlide, {
      toValue: isMocktailOnly ? 1 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
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
      // petit retry pour éviter le faux "c'est tout" sur latence réseau
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

    // Charger le reste en arrière-plan (mode alcool/sans alcool)
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
        excluded,
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
    excludeIds = [],
  ) => {
    const alcoholQuery = mocktailOnly ? "without" : "with";
    const seenIds = new Set(excludeIds.map((id) => String(id)));

    // 1) Tentative optimisée: une seule requête batch vers le backend
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({
        count: String(count),
        alcohol: alcoholQuery,
      });

      if (excludeIds.length > 0) {
        params.set("excludeIds", excludeIds.join(","));
      }

      const response = await fetch(
        `${API_URL}/cocktail/surprise/batch?${params.toString()}`,
        { signal: controller.signal },
      );

      if (response.ok) {
        const data = await response.json();
        const cocktails = Array.isArray(data?.cocktails) ? data.cocktails : [];

        const unique = [];
        for (const cocktail of cocktails) {
          const id = String(cocktail?.id || "");
          if (!id || seenIds.has(id)) continue;
          if (!matchAlcoholFilter(cocktail, mocktailOnly)) continue;

          seenIds.add(id);
          unique.push(cocktail);

          if (unique.length >= count) break;
        }

        if (unique.length > 0) {
          return unique;
        }
      }
    } catch (e) {
      // fallback plus bas
    } finally {
      clearTimeout(timeout);
    }

    // 2) Fallback robuste: quelques requêtes unitaires
    const fallbackBatch = [];
    let attempts = 0;
    const maxAttempts = count * 6;

    while (fallbackBatch.length < count && attempts < maxAttempts) {
      attempts += 1;

      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(
        () => fallbackController.abort(),
        FETCH_TIMEOUT_MS,
      );

      try {
        const fallbackResponse = await fetch(
          `${API_URL}/cocktail/surprise?alcohol=${alcoholQuery}&excludeIds=${encodeURIComponent(Array.from(seenIds).join(","))}`,
          { signal: fallbackController.signal },
        );

        if (!fallbackResponse.ok) continue;

        const fallbackData = await fallbackResponse.json();
        const cocktail = fallbackData?.ok ? fallbackData.cocktail : null;
        const id = String(cocktail?.id || "");

        if (!id || seenIds.has(id)) continue;
        if (!matchAlcoholFilter(cocktail, mocktailOnly)) continue;

        seenIds.add(id);
        fallbackBatch.push(cocktail);
      } catch (e) {
        // ignore pour continuer les tentatives
      } finally {
        clearTimeout(fallbackTimeout);
      }
    }

    return fallbackBatch;
  };

  const currentCocktail = cocktails[currentIndex];

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
          // Swipe RIGHT = LIKE
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe LEFT = DISLIKE
          swipeLeft();
        } else {
          // Reset position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const swipeRight = () => {
    Animated.timing(pan, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // Ajouter aux favoris
      const activeCocktail = cocktailsRef.current[currentIndexRef.current];
      if (activeCocktail) {
        dispatch(
          addFavorite({
            id: activeCocktail.id,
            nom: activeCocktail.nom,
            image: activeCocktail.image,
            type: activeCocktail.type,
          }),
        );
      }
      nextCard();
    });
  };

  const handleAlcoholToggle = (mocktailOnly) => {
    if (mocktailOnly === isMocktailOnly) return;
    setIsMocktailOnly(mocktailOnly);
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

    // Reset après changement d'index pour éviter le flash de retour
    requestAnimationFrame(() => {
      pan.setValue({ x: 0, y: 0 });
      swipeDirection.setValue(0);
    });

    // Précharger plus de cocktails si on approche de la fin
    if (nextIdx >= cocktailsRef.current.length - 2) {
      setShowEndMessage(false);
      const appended = await fetchAndAppendMore(6);

      if (appended === 0 && nextIdx >= cocktailsRef.current.length) {
        const retryAppended = await fetchAndAppendMore(8);
        setShowEndMessage(
          retryAppended === 0 &&
            emptyFetchStreakRef.current >= MIN_EMPTY_FETCHES_BEFORE_END,
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
          emptyFetchStreakRef.current >= MIN_EMPTY_FETCHES_BEFORE_END,
      );
    })();
  }, [currentIndex, cocktails.length, loading]);

  const handleLikePress = () => swipeRight();
  const handleDislikePress = () => swipeLeft();

  // Animations
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
    <LinearGradient
      colors={["#0d0014", "#2a0025", "#1a0020"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={s.headerBar}>
        <Text style={s.headerTitle}>Cocktail Match ❤️ </Text>
        <Text style={s.headerSub}>Swipe pour trouver l'amour</Text>
      </View>

      {/* ── Alcohol toggle ── */}
      <View style={s.toggleWrap}>
        <View
          style={s.toggleRow}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            setToggleWidth(w);
          }}
        >
          {toggleWidth > 0 && (
            <Animated.View
              style={[
                s.slideIndicator,
                {
                  width: (toggleWidth - 8) / 2,
                  transform: [
                    {
                      translateX: toggleSlide.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (toggleWidth - 8) / 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          <TouchableOpacity
            style={s.toggleBtn}
            onPress={() => handleAlcoholToggle(false)}
            activeOpacity={0.9}
          >
            <Text style={[s.toggleText, !isMocktailOnly && s.toggleTextActive]}>
              Avec alcool
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.toggleBtn}
            onPress={() => handleAlcoholToggle(true)}
            activeOpacity={0.9}
          >
            <Text style={[s.toggleText, isMocktailOnly && s.toggleTextActive]}>
              Sans alcool
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Loading ── */}
      {loading && (
        <View style={s.centered}>
          <ActivityIndicator color="#ff8a00" size="large" />
          <Text style={s.loadingText}>Chargement des cocktails...</Text>
        </View>
      )}

      {/* ── End of stack ── */}
      {!loading &&
        !loadingMore &&
        showEndMessage &&
        currentIndex >= cocktails.length && (
          <View style={s.centered}>
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>🎉</Text>
              <Text style={s.emptyTitle}>C'est tout pour l'instant</Text>
              <Text style={s.emptyText}>
                Tu as exploré tous les cocktails. Recharge pour en voir plus !
              </Text>
              <TouchableOpacity
                style={s.reloadBtn}
                onPress={loadInitialCocktails}
                activeOpacity={0.92}
              >
                <LinearGradient
                  colors={["#ff4fd8", "#ff2a6d", "#ff8a00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.reloadGrad}
                >
                  <Text style={s.reloadIcon}>↺</Text>
                  <Text style={s.reloadText}>Recharger</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {!loading && loadingMore && currentIndex >= cocktails.length && (
        <View style={s.centered}>
          <ActivityIndicator color="#ff8a00" size="large" />
          <Text style={s.loadingText}>Chargement de nouveaux cocktails...</Text>
        </View>
      )}

      {/* ── Card stack ── */}
      {!loading && currentCocktail && (
        <View style={s.cardContainer}>
          {/* Next card (preview) */}
          {cocktails[currentIndex + 1] && (
            <View
              style={[s.card, s.cardBehind]}
              key={`next-${currentIndex + 1}`}
            >
              <Image
                source={{ uri: cocktails[currentIndex + 1].image }}
                style={s.cardImage}
              />
            </View>
          )}

          {/* Current card */}
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
            <TouchableOpacity
              style={s.cardPressOverlay}
              activeOpacity={0.95}
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
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.cardOverlay}
            />

            {/* NOPE stamp */}
            <Animated.View
              style={[s.stamp, s.stampNope, { opacity: nopeOpacity, left: 32 }]}
            >
              <Text style={[s.stampText, { color: "#ff2a6d" }]}>NOPE</Text>
            </Animated.View>

            {/* LIKE stamp */}
            <Animated.View
              style={[
                s.stamp,
                s.stampLike,
                { opacity: likeOpacity, right: 32 },
              ]}
            >
              <Text style={[s.stampText, { color: "#09bb0f" }]}>LIKE</Text>
            </Animated.View>

            {/* Badges */}
            <View style={s.badgeRow}>
              {currentCocktail.type && (
                <View style={[s.badge, s.badgePink]}>
                  <Text style={s.badgeText}>{currentCocktail.type}</Text>
                </View>
              )}
              {currentCocktail.categorie && (
                <View style={[s.badge, s.badgeAmber]}>
                  <Text style={[s.badgeText, { color: "#ff8a00" }]}>
                    {currentCocktail.categorie.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={s.cardInfo}>
              <Text style={s.cardTitle} numberOfLines={2}>
                {currentCocktail.nom}
              </Text>
            </View>
          </Animated.View>
        </View>
      )}

      {/* ── Action buttons ── */}
      {!loading && currentCocktail && (
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.dislikeBtn]}
            onPress={handleDislikePress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(255,42,109,0.25)", "rgba(255,42,109,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.actionGrad}
            >
              <Text style={s.actionIcon}>✕</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, s.likeBtn]}
            onPress={handleLikePress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["rgba(9,187,15,0.28)", "rgba(9,187,15,0.12)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.actionGrad}
            >
              <Text style={s.actionIcon}>♥</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  headerBar: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerSub: {
    color: "rgba(255,216,244,0.6)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },

  toggleWrap: {
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  toggleRow: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: "rgba(21,0,31,0.70)",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.3)",
    padding: 4,
  },
  slideIndicator: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    backgroundColor: "#ff2a6d",
    borderRadius: 999,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    color: "rgba(255,216,244,0.55)",
    fontWeight: "700",
    fontSize: 14,
  },
  toggleTextActive: { color: "#fff" },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    color: "rgba(255,216,244,0.75)",
    fontWeight: "700",
    marginTop: 12,
  },

  emptyCard: {
    backgroundColor: "rgba(21,0,31,0.60)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.35)",
    padding: 24,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyText: {
    color: "rgba(255,216,244,0.7)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  reloadBtn: { marginTop: 18, borderRadius: 14, overflow: "hidden" },
  reloadGrad: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reloadIcon: { color: "#fff", fontSize: 16, fontWeight: "900" },
  reloadText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.4,
  },

  // ─── Card stack ─────────────────────────────────────────────────
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: -20,
  },

  card: {
    position: "absolute",
    width: SCREEN_WIDTH - 40,
    height: "75%",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,79,216,0.4)",
    backgroundColor: "rgba(21,0,31,0.85)",
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

  // ─── Stamps ─────────────────────────────────────────────────────
  stamp: {
    position: "absolute",
    top: 48,
    borderWidth: 4,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    transform: [{ rotate: "-18deg" }],
  },
  stampNope: {
    borderColor: "#ff2a6d",
    backgroundColor: "rgba(255,42,109,0.15)",
  },
  stampLike: {
    borderColor: "#09bb0f",
    backgroundColor: "rgba(9,187,15,0.15)",
    transform: [{ rotate: "18deg" }],
  },
  stampText: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // ─── Badges & Info ──────────────────────────────────────────────
  badgeRow: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  badge: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  badgePink: {
    backgroundColor: "rgba(255,42,109,0.25)",
    borderColor: "#ff2a6d",
  },
  badgeAmber: {
    backgroundColor: "rgba(255,138,0,0.25)",
    borderColor: "#ff8a00",
  },
  badgeText: {
    color: "#ff4fd8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  cardInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.3,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // ─── Action buttons ─────────────────────────────────────────────
  actionsRow: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },

  actionBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
  },

  dislikeBtn: {
    borderWidth: 2,
    borderColor: "#ff2a6d",
  },

  likeBtn: {
    borderWidth: 2,
    borderColor: "#09bb0f",
  },

  actionGrad: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  actionIcon: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "900",
  },
});
