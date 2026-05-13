import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { Heart } from "lucide-react-native";
import { addFavoriteSync, removeFavoriteSync } from "../reducers/favorites";
import { GlassCard, Chip, AppHeader } from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function safeText(v: any, fallback = "—") {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v == null) return fallback;
  return JSON.stringify(v);
}

export default function DetailsScreen({ route, navigation }) {
  const { cocktailId, aiRecipe } = route.params || {};
  const [cocktail, setCocktail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const favorites = useSelector((state: any) => state.favorites.value);

  const isAI = aiRecipe?.source === "ai" && !!aiRecipe?.recipe;
  const currentId = aiRecipe?.id || cocktailId;
  const isFavorite = favorites.some((fav: any) => fav.id === currentId);

  useEffect(() => {
    if (isAI) { setLoading(false); return; }
    if (cocktailId) fetchCocktailDetails();
    else setLoading(false);
  }, [cocktailId, aiRecipe]);

  const fetchCocktailDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/cocktail/${cocktailId}`);
      const data = await response.json();
      setCocktail(data.ok ? data.cocktail : null);
    } catch {
      alert("Erreur de connexion au serveur");
      setCocktail(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (!currentId) return;
    if (isFavorite) {
      const fav = favorites.find((f: any) => f.id === currentId);
      if (fav) dispatch(removeFavoriteSync(fav) as any);
      return;
    }
    if (isAI) { dispatch(addFavoriteSync(aiRecipe) as any); return; }
    if (cocktail) {
      dispatch(addFavoriteSync({
        id: cocktailId,
        nom: cocktail.nom,
        image: cocktail.image,
        type: cocktail.type,
      }) as any);
    }
  };

  const headerBadges = useMemo(() => {
    if (isAI || !cocktail) return [];
    const arr: any[] = [];
    if (cocktail.type) arr.push({ label: cocktail.type, variant: "solid" });
    if (cocktail.categorie) arr.push({ label: cocktail.categorie, variant: "outline" });
    return arr;
  }, [cocktail, isAI]);

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={[s.root, s.centered]}>
        <GlassCard style={s.stateCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.bodySm, s.stateText]}>
            Chargement de la recette…
          </Text>
        </GlassCard>
      </SafeAreaView>
    );
  }

  // ── Not found ──
  if (!isAI && !cocktail) {
    return (
      <SafeAreaView style={[s.root, s.centered]}>
        <GlassCard style={s.stateCard}>
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
            Introuvable
          </Text>
          <Text style={[typography.bodySm, s.stateText]}>
            Cocktail non trouvé.
          </Text>
        </GlassCard>
      </SafeAreaView>
    );
  }

  // ── AI recipe ──
  if (isAI) {
    const r = aiRecipe.recipe;
    return (
      <SafeAreaView style={s.root} edges={["bottom"]}>
        <AppHeader
          showHomeButton
          onHomePress={() => navigation.goBack()}
          onAvatarPress={() => navigation.navigate("Profile")}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollPad}
        >
          {/* Hero */}
          <GlassCard style={s.heroCard}>
            <LinearGradient
              colors={[colors.glowPrimary, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroGlow}
            />
            <View style={s.heroTopRow}>
              <View style={s.badgeRow}>
                <Chip label="RECETTE IA" variant="solid" active />
                {r?.format ? (
                  <Chip
                    label={safeText(r.format).toUpperCase()}
                    variant="outline"
                    uppercase
                  />
                ) : null}
              </View>
              <Pressable
                style={[s.favBtn, isFavorite && s.favBtnActive]}
                onPress={toggleFavorite}
                hitSlop={8}
              >
                <Heart
                  size={20}
                  color={isFavorite ? colors.tertiaryContainer : colors.onSurfaceVariant}
                  fill={isFavorite ? colors.tertiaryContainer : "transparent"}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
            <Text style={[typography.headlineMd, s.heroTitle]}>
              {safeText(r?.name, "Cocktail IA")}
            </Text>
            <Text style={[typography.bodySm, s.heroSub]} numberOfLines={2}>
              {safeText(r?.type, "—")} · {safeText(r?.glass, "—")}
            </Text>
          </GlassCard>

          <SectionCard title="Ingrédients">
            {Array.isArray(r?.ingredients) &&
              r.ingredients.map((it: any, idx: number) => (
                <IngredientRow
                  key={idx}
                  name={safeText(it?.name)}
                  amount={safeText(it?.amount)}
                />
              ))}
          </SectionCard>

          <SectionCard title="Préparation">
            {Array.isArray(r?.steps) &&
              r.steps.map((step: any, i: number) => (
                <StepRow key={i} index={i + 1} text={safeText(step)} />
              ))}
          </SectionCard>

          <SectionCard title="Décoration">
            <Text style={[typography.bodySm, s.bodyText]}>
              {safeText(r?.garnish)}
            </Text>
          </SectionCard>

          {Array.isArray(r?.tips) && r.tips.length > 0 && (
            <SectionCard title="Conseils du barman">
              {r.tips.map((t: any, i: number) => (
                <View key={i} style={s.tipRow}>
                  <Text style={s.tipBullet}>✦</Text>
                  <Text style={[typography.bodySm, s.bodyText]}>{safeText(t)}</Text>
                </View>
              ))}
            </SectionCard>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── API cocktail ──
  return (
    <SafeAreaView style={s.root} edges={["bottom"]}>
      <AppHeader
        showHomeButton
        onHomePress={() => navigation.goBack()}
        onAvatarPress={() => navigation.navigate("Profile")}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={s.imageWrap}>
          <Image source={{ uri: cocktail.image }} style={s.image} />
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(22,17,27,0.96)"]}
            start={{ x: 0, y: 0.25 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          <View style={s.imageTopRow}>
            <View style={s.badgeRow}>
              {headerBadges.map((b, i) => (
                <Chip
                  key={`${b.label}-${i}`}
                  label={b.label.toUpperCase()}
                  variant={b.variant}
                  uppercase
                />
              ))}
            </View>
            <Pressable
              style={[s.favBtn, isFavorite && s.favBtnActive]}
              onPress={toggleFavorite}
              hitSlop={8}
            >
              <Heart
                size={20}
                color={isFavorite ? colors.tertiaryContainer : "#fff"}
                fill={isFavorite ? colors.tertiaryContainer : "transparent"}
                strokeWidth={2}
              />
            </Pressable>
          </View>

          <View style={s.imageTitleBlock}>
            <Text style={[typography.displayMd, s.imageTitle]} numberOfLines={2}>
              {safeText(cocktail.nom, "Cocktail")}
            </Text>
            <Text style={[typography.bodySm, s.imageSubline]} numberOfLines={1}>
              {safeText(cocktail.type)} · {safeText(cocktail.categorie)}
            </Text>
          </View>
        </View>

        <View style={s.pagePad}>
          <SectionCard title="Verre">
            <Text style={[typography.bodySm, s.bodyText]}>
              {safeText(cocktail.verre)}
            </Text>
          </SectionCard>

          <SectionCard title="Ingrédients">
            {Array.isArray(cocktail.ingredients) &&
              cocktail.ingredients.map((ing: any, index: number) => (
                <IngredientRow
                  key={index}
                  name={safeText(ing?.nom)}
                  amount={safeText(ing?.quantite)}
                />
              ))}
          </SectionCard>

          <SectionCard title="Préparation">
            <Text style={[typography.bodySm, s.bodyText]}>
              {safeText(cocktail.instructions)}
            </Text>
          </SectionCard>

          {Array.isArray(cocktail.tags) && cocktail.tags.length > 0 && (
            <SectionCard title="Tags">
              <View style={s.tagWrap}>
                {cocktail.tags.map((tag: any, index: number) => (
                  <Chip key={index} label={safeText(tag)} variant="solid" />
                ))}
              </View>
            </SectionCard>
          )}

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ──

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard style={sc.card} noBorder>
      <Text style={[typography.labelLg, sc.title]}>{title}</Text>
      {children}
    </GlassCard>
  );
}

function IngredientRow({ name, amount }: { name: string; amount: string }) {
  return (
    <View style={sc.row}>
      <View style={sc.dot} />
      <Text style={[typography.bodySm, sc.rowName]} numberOfLines={1}>{name}</Text>
      <Text style={[typography.labelMd, sc.rowAmount]} numberOfLines={1}>{amount}</Text>
    </View>
  );
}

function StepRow({ index, text }: { index: number; text: string }) {
  return (
    <View style={sc.stepRow}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={sc.stepNum}
      >
        <Text style={sc.stepNumText}>{index}</Text>
      </LinearGradient>
      <Text style={[typography.bodySm, sc.stepText]}>{text}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  rowName: { flex: 1, color: colors.onSurface },
  rowAmount: { color: colors.primaryContainer },
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    marginBottom: spacing.sm,
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
  stepText: { flex: 1, color: colors.onSurface, lineHeight: 22 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: "center", alignItems: "center" },
  scrollPad: { paddingHorizontal: spacing.containerMargin, paddingBottom: 18 },

  stateCard: {
    width: "85%",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  stateText: { color: colors.onSurfaceVariant },

  // AI hero
  heroCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    left: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  heroTitle: { color: colors.onSurface, marginBottom: 4 },
  heroSub: { color: colors.onSurfaceVariant },

  // API hero image
  imageWrap: { height: 340, backgroundColor: colors.surfaceContainerLow },
  image: { width: "100%", height: "100%" },
  imageTopRow: {
    position: "absolute",
    top: 12,
    left: spacing.containerMargin,
    right: spacing.containerMargin,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageTitleBlock: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.containerMargin,
    right: spacing.containerMargin,
  },
  imageTitle: {
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  imageSubline: { color: "rgba(255,255,255,0.7)", marginTop: 6 },

  pagePad: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.md,
  },

  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", flex: 1 },

  favBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  favBtnActive: {
    backgroundColor: "rgba(255, 79, 114, 0.2)",
    borderColor: colors.tertiaryContainer,
  },

  bodyText: { color: colors.onSurfaceVariant, lineHeight: 22 },

  tipRow: { flexDirection: "row", gap: spacing.sm, marginBottom: 6 },
  tipBullet: { color: colors.primary, marginTop: 3, fontSize: 10 },

  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
