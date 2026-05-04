import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import {
  addFavoriteSync,
  removeFavoriteSync,
} from "../reducers/favorites";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function safeText(v: any, fallback = "—") {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v == null) return fallback;
  return JSON.stringify(v);
}

export default function DetailsScreen({ route }) {
  const { cocktailId, aiRecipe } = route.params || {};
  const [cocktail, setCocktail] = useState(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.value);

  const isAI = aiRecipe?.source === "ai" && !!aiRecipe?.recipe;
  const currentId = aiRecipe?.id || cocktailId;
  const isFavorite = favorites.some((fav) => fav.id === currentId);

  useEffect(() => {
    if (isAI) {
      setLoading(false);
      return;
    }
    if (cocktailId) fetchCocktailDetails();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cocktailId, aiRecipe]);

  const fetchCocktailDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/cocktail/${cocktailId}`);
      const data = await response.json();
      if (data.ok) setCocktail(data.cocktail);
      else setCocktail(null);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion au serveur");
      setCocktail(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (!currentId) return;

    if (isFavorite) {
      const fav = favorites.find((f) => f.id === currentId);
      if (fav) dispatch(removeFavoriteSync(fav) as any);
      return;
    }

    if (isAI) {
      dispatch(addFavoriteSync(aiRecipe) as any);
      return;
    }

    if (cocktail) {
      dispatch(
        addFavoriteSync({
          id: cocktailId,
          nom: cocktail.nom,
          image: cocktail.image,
          type: cocktail.type,
        }) as any,
      );
    }
  };

  // ───────────────────────── UI helpers ─────────────────────────
  const headerBadges = useMemo(() => {
    if (isAI) return [];
    if (!cocktail) return [];
    const arr = [];
    if (cocktail.type) arr.push({ label: cocktail.type, tone: "pink" });
    if (cocktail.categorie)
      arr.push({ label: cocktail.categorie, tone: "amber" });
    return arr;
  }, [cocktail, isAI]);

  // ───────────────────────── LOADING / EMPTY ─────────────────────────
  if (loading) {
    return (
      <LinearGradient
        colors={["#0d0014", "#2a0025", "#1a0020"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.container, s.centered]}
      >
        <View style={s.loaderCard}>
          <ActivityIndicator size="large" color="#ff4fd8" />
          <Text style={s.loaderText}>Chargement de la recette…</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!isAI && !cocktail) {
    return (
      <LinearGradient
        colors={["#0d0014", "#2a0025", "#1a0020"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.container, s.centered]}
      >
        <View style={s.emptyCard}>
          <Text style={s.emptyTitle}>Introuvable</Text>
          <Text style={s.emptyText}>Cocktail non trouvé.</Text>
        </View>
      </LinearGradient>
    );
  }

  // ───────────────────────── AI DETAILS ─────────────────────────
  if (isAI) {
    const r = aiRecipe.recipe;

    return (
      <LinearGradient
        colors={["#0d0014", "#2a0025", "#1a0020"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {/* Hero card */}
          <View style={s.heroCard}>
            <LinearGradient
              colors={["rgba(255,79,216,0.22)", "rgba(255,138,0,0.10)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroGlow}
            />
            <View style={s.heroTopRow}>
              <View style={s.badgeRow}>
                <View style={[s.badge, s.badgePink]}>
                  <Text style={s.badgeText}>RECETTE IA</Text>
                </View>
                <View style={[s.badge, s.badgeAmber]}>
                  <Text style={[s.badgeText, { color: "#ff8a00" }]}>
                    {safeText(r?.format, "—").toUpperCase()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.favBtn, isFavorite && s.favBtnActive]}
                onPress={toggleFavorite}
                activeOpacity={0.9}
              >
                <Text style={s.favIcon}>{isFavorite ? "♥" : "♡"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.title}>{safeText(r?.name, "Cocktail IA")}</Text>

            <Text style={s.subline} numberOfLines={2}>
              {safeText(r?.type, "—")} • {safeText(r?.glass, "—")}
            </Text>
          </View>

          {/* Sections */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Ingrédients</Text>

            {Array.isArray(r?.ingredients) &&
              r.ingredients.map((it: any, idx: number) => (
                <View key={idx} style={s.rowLine}>
                  <View style={s.dot} />
                  <Text style={s.rowLeft} numberOfLines={1}>
                    {safeText(it?.name)}
                  </Text>
                  <Text style={s.rowRight} numberOfLines={1}>
                    {safeText(it?.amount)}
                  </Text>
                </View>
              ))}
          </View>

          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Préparation</Text>

            {Array.isArray(r?.steps) &&
              r.steps.map((step: any, i: number) => (
                <View key={i} style={s.stepRow}>
                  <LinearGradient
                    colors={["#ff2a6d", "#ff8a00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.stepNum}
                  >
                    <Text style={s.stepNumText}>{i + 1}</Text>
                  </LinearGradient>
                  <Text style={s.stepText}>{safeText(step)}</Text>
                </View>
              ))}
          </View>

          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Décoration</Text>
            <Text style={s.bodyText}>{safeText(r?.garnish)}</Text>
          </View>

          {Array.isArray(r?.tips) && r.tips.length > 0 && (
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Conseils du barman</Text>
              {r.tips.map((t: any, i: number) => (
                <View key={i} style={s.tipRow}>
                  <Text style={s.tipBullet}>✦</Text>
                  <Text style={s.bodyText}>{safeText(t)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 26 }} />
        </ScrollView>
      </LinearGradient>
    );
  }

  // ───────────────────────── API DETAILS ─────────────────────────
  return (
    <LinearGradient
      colors={["#0d0014", "#2a0025", "#1a0020"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image with overlay */}
        <View style={s.imageWrap}>
          <Image source={{ uri: cocktail.image }} style={s.image} />
          <LinearGradient
            colors={["rgba(0,0,0,0.05)", "rgba(13,0,20,0.92)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.imageOverlay}
          />
          <View style={s.imageTopRow}>
            <View style={s.badgeRow}>
              {headerBadges.map((b, i) => (
                <View
                  key={`${b.label}-${i}`}
                  style={[
                    s.badge,
                    b.tone === "amber" ? s.badgeAmber : s.badgePink,
                  ]}
                >
                  <Text
                    style={[
                      s.badgeText,
                      b.tone === "amber" ? { color: "#ff8a00" } : null,
                    ]}
                    numberOfLines={1}
                  >
                    {safeText(b.label, "—").toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[s.favBtn, isFavorite && s.favBtnActive]}
              onPress={toggleFavorite}
              activeOpacity={0.9}
            >
              <Text style={s.favIcon}>{isFavorite ? "♥" : "♡"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.imageTitleBlock}>
            <Text style={s.title} numberOfLines={2}>
              {safeText(cocktail.nom, "Cocktail")}
            </Text>
            <Text style={s.subline} numberOfLines={1}>
              {safeText(cocktail.type)} • {safeText(cocktail.categorie)}
            </Text>
          </View>
        </View>

        <View style={s.pagePad}>
          {/* Glass */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Verre</Text>
            <Text style={s.bodyText}>{safeText(cocktail.verre)}</Text>
          </View>

          {/* Ingredients */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Ingrédients</Text>
            {Array.isArray(cocktail.ingredients) &&
              cocktail.ingredients.map((ing, index) => (
                <View key={index} style={s.rowLine}>
                  <View style={s.dot} />
                  <Text style={s.rowLeft} numberOfLines={1}>
                    {safeText(ing?.nom)}
                  </Text>
                  <Text style={s.rowRight} numberOfLines={1}>
                    {safeText(ing?.quantite)}
                  </Text>
                </View>
              ))}
          </View>

          {/* Preparation */}
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Préparation</Text>
            <Text style={s.bodyText}>{safeText(cocktail.instructions)}</Text>
          </View>

          {/* Tags */}
          {Array.isArray(cocktail.tags) && cocktail.tags.length > 0 && (
            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Tags</Text>
              <View style={s.tagWrap}>
                {cocktail.tags.map((tag, index) => (
                  <View key={index} style={s.tagPill}>
                    <Text style={s.tagText}>{safeText(tag)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 26 }} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ───────────────────────── Styles (DA “Mixologue” premium) ─────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  centered: { justifyContent: "center", alignItems: "center" },

  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  // Loading / Empty
  loaderCard: {
    width: "86%",
    backgroundColor: "rgba(21,0,31,0.65)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.35)",
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
  },
  loaderText: {
    color: "rgba(255,216,244,0.75)",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  emptyCard: {
    width: "86%",
    backgroundColor: "rgba(21,0,31,0.65)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.35)",
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  emptyText: { color: "rgba(255,216,244,0.75)", fontWeight: "700" },

  // Hero (AI)
  heroCard: {
    backgroundColor: "rgba(21,0,31,0.70)",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.35)",
    padding: 16,
    overflow: "hidden",
    marginBottom: 14,
  },
  heroGlow: {
    position: "absolute",
    left: -40,
    top: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },

  // Hero image (API)
  imageWrap: { height: 340, backgroundColor: "#12001a" },
  image: { width: "100%", height: "100%" },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  imageTopRow: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageTitleBlock: {
    position: "absolute",
    bottom: 18,
    left: 16,
    right: 16,
  },
  pagePad: { paddingHorizontal: 20, paddingTop: 16 },

  // Badges
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", flex: 1 },
  badge: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    maxWidth: 220,
  },
  badgePink: {
    backgroundColor: "rgba(255,42,109,0.22)",
    borderColor: "rgba(255,42,109,0.6)",
  },
  badgeAmber: {
    backgroundColor: "rgba(255,138,0,0.14)",
    borderColor: "rgba(255,138,0,0.55)",
  },
  badgeText: {
    color: "#ff4fd8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.0,
  },

  // Fav button
  favBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(21,0,31,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  favBtnActive: {
    backgroundColor: "rgba(154, 11, 56, 0.26)",
    borderColor: "rgba(255,42,109,0.9)",
  },
  favIcon: { color: "#fff", fontSize: 18, fontWeight: "900" },

  // Titles
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subline: {
    color: "rgba(255,216,244,0.65)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Cards (sections)
  sectionCard: {
    backgroundColor: "rgba(21,0,31,0.60)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.28)",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  bodyText: {
    color: "rgba(255,216,244,0.78)",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },

  // Rows like “ingredient name / qty”
  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,79,216,0.10)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff2a6d",
    marginRight: 10,
  },
  rowLeft: { flex: 1, color: "#ffd8f4", fontWeight: "700", fontSize: 13 },
  rowRight: { color: "#ff8a00", fontWeight: "900", fontSize: 12 },

  // Steps
  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  stepText: { flex: 1, color: "#ffd8f4", fontSize: 13, lineHeight: 21 },

  // Tips
  tipRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  tipBullet: { color: "#ff4fd8", marginTop: 3, fontSize: 10 },

  // Tags
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagPill: {
    backgroundColor: "rgba(255,79,216,0.10)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,79,216,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});
