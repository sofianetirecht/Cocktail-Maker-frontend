import React, { useMemo, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

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
      const url = `${API_URL}/cocktail/match?ingredients=${encodeURIComponent(
        ingredientTags.join(", "),
      )}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setResults(data.results || []);
        setSearched(true);
      } else {
        setResults([]);
        setSearched(true);
      }

      // Vider les tags après la recherche
      setIngredientTags([]);
    } catch (error) {
      alert("Erreur de connexion au serveur");
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  function addTag() {
    if (!inputValue.trim()) return;

    const parts = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    const next = [...ingredientTags];
    parts.forEach((p) => {
      if (!next.includes(p)) next.push(p);
    });

    setIngredientTags(next);
    setInputValue("");

    // Garde le focus
    requestAnimationFrame(() => {
      inputRef.current?.focus?.();
    });
  }

  function removeTag(tag: string) {
    setIngredientTags(ingredientTags.filter((t) => t !== tag));
  }

  const renderCocktail = ({ item }: any) => {
    const score = Math.round(Number(item?.score || 0));

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.92}
        onPress={() =>
          navigation.navigate("Details", { cocktailId: item.idDrink })
        }
      >
        <View style={s.cardMedia}>
          <Image
            source={{ uri: item?.drink?.strDrinkThumb }}
            style={s.cardImage}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.08)", "rgba(13,0,20,0.88)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.cardOverlay}
          />

          <View style={s.cardTopRow}>
            <View style={s.scorePill}>
              <Text style={s.scoreText}>{score}% MATCH</Text>
            </View>
          </View>

          <View style={s.cardTitleBlock}>
            <Text style={s.cardTitle} numberOfLines={2}>
              {item?.name || "Cocktail"}
            </Text>
            <Text style={s.cardSub} numberOfLines={2}>
              {Array.isArray(item?.matchedIngredients)
                ? item.matchedIngredients.join(", ")
                : "—"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#0d0014", "#2a0025", "#1a0020"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Recherche</Text>
          <Text style={s.subtitle}>
            Ajoute tes ingrédients séparés par des virgules.
          </Text>
        </View>

        {/* Search box */}
        <View style={s.searchCard}>
          <Text style={s.label}>Ingrédients</Text>

          <View style={s.tagBox}>
            {ingredientTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={s.tag}
                onPress={() => removeTag(tag)}
                activeOpacity={0.9}
              >
                <Text style={s.tagText}>{tag}</Text>
                <Text style={s.tagX}> ✕</Text>
              </TouchableOpacity>
            ))}

            <View style={s.inputRow}>
              <TextInput
                ref={inputRef}
                style={s.input}
                placeholder="vodka, citron, menthe…"
                placeholderTextColor="rgba(255,216,244,0.35)"
                value={inputValue}
                onChangeText={setInputValue}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={() => Keyboard.dismiss()}
              />

              <TouchableOpacity
                style={[s.addBtn, !inputValue.trim() && s.addBtnDisabled]}
                onPress={addTag}
                disabled={!inputValue.trim()}
                activeOpacity={0.92}
              >
                <LinearGradient
                  colors={
                    inputValue.trim()
                      ? ["rgba(255,79,216,0.22)", "rgba(255,79,216,0.08)"]
                      : ["rgba(58,16,64,0.6)", "rgba(58,16,64,0.6)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.addBtnGrad}
                >
                  <Text style={s.addBtnText}>Ajouter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.cta, !canSearch && s.ctaDisabled]}
            onPress={handleSearch}
            disabled={!canSearch}
            activeOpacity={0.92}
          >
            <LinearGradient
              colors={
                canSearch
                  ? ["#ff4fd8", "#ff2a6d", "#ff8a00"]
                  : ["#3a1040", "#3a1040"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaGrad}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.ctaIcon}>✦</Text>
                  <Text style={s.ctaText}>Trouver un cocktail</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* States */}
        {loading && (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="large" color="#ff4fd8" />
            <Text style={s.loaderText}>Recherche en cours…</Text>
          </View>
        )}

        {!loading && searched && results.length === 0 && (
          <View style={s.emptyWrap}>
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>😕</Text>
              <Text style={s.emptyTitle}>Aucun résultat</Text>
              <Text style={s.emptyText}>
                Essaie avec d’autres ingrédients (ou moins d’ingrédients).
              </Text>
            </View>
          </View>
        )}

        {!loading && results.length > 0 && (
          <View style={s.resultsWrap}>
            <View style={s.resultsHeader}>
              <Text style={s.resultsTitle}>Résultats</Text>
              <Text style={s.resultsCount}>
                {results.length} cocktail{results.length > 1 ? "s" : ""}
              </Text>
            </View>

            <FlatList
              data={results}
              renderItem={renderCocktail}
              keyExtractor={(item: any) => String(item.idDrink)}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 26 }}
            />
          </View>
        )}

        <View style={{ height: 26 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,216,244,0.65)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: 0.3,
  },

  searchCard: {
    marginTop: 8,
    marginHorizontal: 20,
    backgroundColor: "rgba(21,0,31,0.65)",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.30)",
    padding: 16,
  },

  label: {
    color: "#ffd8f4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  tagBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "rgba(21,0,31,0.55)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.45)",
    padding: 10,
    minHeight: 52,
    alignItems: "center",
    marginBottom: 14,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,79,216,0.18)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ff4fd8",
  },
  tagText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  tagX: { color: "#ff4fd8", fontSize: 11, fontWeight: "900" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexGrow: 1,
    minWidth: 170,
  },
  input: {
    flex: 1,
    minWidth: 110,
    color: "#fff",
    fontSize: 13,
    paddingVertical: 2,
  },
  addBtn: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ff4fd8",
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnGrad: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  cta: {
    marginTop: 14,
    borderRadius: 18,
    overflow: "hidden",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaGrad: {
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaIcon: { color: "#fff", fontSize: 16 },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  loaderWrap: {
    marginTop: 18,
    alignItems: "center",
    gap: 10,
  },
  loaderText: {
    color: "rgba(255,216,244,0.65)",
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  emptyWrap: { paddingHorizontal: 20, paddingTop: 18 },
  emptyCard: {
    backgroundColor: "rgba(21,0,31,0.65)",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.30)",
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 54, marginBottom: 10 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  emptyText: {
    marginTop: 6,
    color: "rgba(255,216,244,0.75)",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "700",
    fontSize: 13,
  },

  resultsWrap: { paddingTop: 18, paddingHorizontal: 20 },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  resultsTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  resultsCount: {
    color: "rgba(255,216,244,0.65)",
    fontSize: 12,
    fontWeight: "800",
  },

  // Card
  card: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.30)",
    backgroundColor: "rgba(21,0,31,0.60)",
  },
  cardMedia: { height: 190, backgroundColor: "#12001a" },
  cardImage: { width: "100%", height: "100%" },
  cardOverlay: { ...StyleSheet.absoluteFillObject },

  cardTopRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  scorePill: {
    backgroundColor: "rgba(255,138,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,138,0,0.65)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreText: {
    color: "#ff8a00",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.8,
  },

  cardTitleBlock: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  cardSub: {
    marginTop: 6,
    color: "rgba(255,216,244,0.75)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
});
