import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Search, Plus, X } from "lucide-react-native";
import { AppHeader, GlassCard, PrimaryButton } from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";

const API_URL = "https://cocktail-maker-backend.onrender.com";

export default function SearchScreen({ navigation }) {
  const [ingredientTags, setIngredientTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  const canSearch = ingredientTags.length > 0 && !loading;

  const handleSearch = async () => {
    if (!ingredientTags.length) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const url = `${API_URL}/cocktail/match?ingredients=${encodeURIComponent(ingredientTags.join(", "))}`;
      const response = await fetch(url);
      const data = await response.json();
      setResults(data.ok ? data.results || [] : []);
      setSearched(true);
      setIngredientTags([]);
    } catch {
      alert("Erreur de connexion au serveur");
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  function addTag() {
    if (!inputValue.trim()) return;
    const parts = inputValue.split(",").map((t) => t.trim()).filter(Boolean);
    const next = [...ingredientTags];
    parts.forEach((p) => { if (!next.includes(p)) next.push(p); });
    setIngredientTags(next);
    setInputValue("");
    requestAnimationFrame(() => inputRef.current?.focus?.());
  }

  function removeTag(tag: string) {
    setIngredientTags(ingredientTags.filter((t) => t !== tag));
  }

  const renderCocktail = ({ item }: any) => {
    const score = Math.round(Number(item?.score || 0));
    return (
      <Pressable
        style={({ pressed }) => [s.card, { opacity: pressed ? 0.88 : 1 }]}
        onPress={() => navigation.navigate("Details", { cocktailId: item.idDrink })}
      >
        <Image source={{ uri: item?.drink?.strDrinkThumb }} style={s.cardImage} />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(22,17,27,0.95)"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={s.scoreRow}>
          <View style={s.scorePill}>
            <Text style={[typography.labelSm, s.scoreText]}>{score}% MATCH</Text>
          </View>
        </View>
        <View style={s.cardFooter}>
          <Text style={[typography.titleMd, s.cardName]} numberOfLines={2}>
            {item?.name || "Cocktail"}
          </Text>
          <Text style={[typography.labelSm, s.cardSub]} numberOfLines={1}>
            {Array.isArray(item?.matchedIngredients)
              ? item.matchedIngredients.join(", ")
              : "—"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={s.root}>
      <AppHeader
        showHomeButton={false}
        onAvatarPress={() => navigation.navigate("Profile")}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.pageHeader}>
          <Text style={[typography.headlineMd, s.pageTitle]}>Recherche</Text>
          <Text style={[typography.bodySm, s.pageSub]}>
            Ajoute tes ingrédients pour trouver un cocktail.
          </Text>
        </View>

        <View style={s.inputCard}>
          <Text style={[typography.labelMd, s.label]}>Ingrédients</Text>

          <View style={s.tagArea}>
            {ingredientTags.map((tag) => (
              <Pressable key={tag} style={s.tag} onPress={() => removeTag(tag)}>
                <Text style={[typography.labelSm, s.tagText]}>{tag}</Text>
                <X size={12} color={colors.primary} strokeWidth={2.5} />
              </Pressable>
            ))}
            <View style={s.inputRow}>
              <TextInput
                ref={inputRef}
                style={[typography.bodySm, s.input]}
                placeholder={ingredientTags.length === 0 ? "vodka, citron, menthe…" : ""}
                placeholderTextColor={colors.onSurfaceVariant}
                value={inputValue}
                onChangeText={setInputValue}
                returnKeyType="done"
                onSubmitEditing={addTag}
              />
              <Pressable
                onPress={addTag}
                disabled={!inputValue.trim()}
                style={({ pressed }) => [
                  s.addBtn,
                  !inputValue.trim() && s.addBtnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Plus size={18} color={colors.primary} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          <PrimaryButton
            label="Trouver un cocktail"
            onPress={handleSearch}
            disabled={!canSearch}
            loading={loading}
            icon={<Search size={18} color="#fff" strokeWidth={2} />}
            size="md"
          />
        </View>

        {loading && (
          <View style={s.stateWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[typography.bodySm, s.stateText]}>Recherche en cours…</Text>
          </View>
        )}

        {!loading && searched && results.length === 0 && (
          <GlassCard style={s.emptyCard}>
            <Text style={s.emptyIcon}>😕</Text>
            <Text style={[typography.headlineSm, s.emptyTitle]}>Aucun résultat</Text>
            <Text style={[typography.bodySm, s.emptyText]}>
              Essaie avec d'autres ingrédients (ou moins d'ingrédients).
            </Text>
          </GlassCard>
        )}

        {!loading && results.length > 0 && (
          <View style={s.resultsWrap}>
            <View style={s.resultsHeader}>
              <Text style={[typography.labelLg, s.resultsTitle]}>Résultats</Text>
              <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
                {results.length} cocktail{results.length > 1 ? "s" : ""}
              </Text>
            </View>
            <FlatList
              data={results}
              renderItem={renderCocktail}
              keyExtractor={(item: any) => String(item.idDrink)}
              scrollEnabled={false}
              contentContainerStyle={{ gap: spacing.sm }}
            />
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.containerMargin },

  pageHeader: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    alignItems: "center",
  },
  pageTitle: { color: colors.onSurface },
  pageSub: { color: colors.onSurfaceVariant, marginTop: 4, textAlign: "center" },

  inputCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
  },
  label: {
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  tagArea: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    padding: spacing.sm,
    minHeight: 52,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.glassFill,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  tagText: { color: colors.onSurface },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 140,
    gap: 8,
  },
  input: { flex: 1, color: colors.onSurface, paddingVertical: 2 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: { opacity: 0.3 },

  stateWrap: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  stateText: { color: colors.onSurfaceVariant },

  emptyCard: {
    padding: spacing.xl,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { color: colors.onSurface, marginBottom: spacing.xs },
  emptyText: { color: colors.onSurfaceVariant, textAlign: "center" },

  resultsWrap: { paddingTop: spacing.sm },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  resultsTitle: {
    color: colors.onSurface,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  card: {
    height: 190,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  cardImage: { width: "100%", height: "100%" },
  scoreRow: { position: "absolute", top: spacing.sm, right: spacing.sm },
  scorePill: {
    backgroundColor: "rgba(221,183,255,0.15)",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  scoreText: { color: colors.primary, letterSpacing: 0.5 },
  cardFooter: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  cardName: { color: "#fff", marginBottom: 4 },
  cardSub: { color: "rgba(255,255,255,0.6)" },
});
