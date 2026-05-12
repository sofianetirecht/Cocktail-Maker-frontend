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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { AppHeader, GlassCard } from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function SearchByNameScreen({ navigation }) {
  const [cocktailName, setCocktailName] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setCocktailName("");
        setResults([]);
        setSearched(false);
      };
    }, []),
  );

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!cocktailName.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => handleSearch(), 100);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cocktailName]);

  const handleSearch = async () => {
    if (!cocktailName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/cocktail/searchByName?name=${encodeURIComponent(cocktailName)}`,
      );
      const data = await response.json();
      setResults(data.drinks && Array.isArray(data.drinks) ? data.drinks : []);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const renderCocktail = ({ item }) => (
    <Pressable
      style={({ pressed }) => [s.card, { opacity: pressed ? 0.88 : 1 }]}
      onPress={() => navigation.navigate("Details", { cocktailId: item.idDrink })}
    >
      <Image source={{ uri: item.strDrinkThumb }} style={s.cardImage} />
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(22,17,27,0.95)"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={s.cardFooter}>
        <Text style={[typography.titleMd, s.cardName]} numberOfLines={2}>
          {item.strDrink || "Cocktail"}
        </Text>
        <Text style={[typography.labelSm, s.cardSub]}>
          Appuie pour voir la recette
        </Text>
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.root}>
        <AppHeader
          showHomeButton
          onHomePress={() => navigation.goBack()}
          onAvatarPress={() => navigation.navigate("Profile")}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.pageHeader}>
            <Text style={[typography.headlineMd, s.pageTitle]}>
              Recherche par nom
            </Text>
            <Text style={[typography.bodySm, s.pageSub]}>
              Entre le nom du cocktail que tu recherches.
            </Text>
          </View>

          <View style={s.inputCard}>
            <Text style={[typography.labelMd, s.label]}>Nom du cocktail</Text>
            <TextInput
              style={[typography.bodySm, s.input]}
              placeholder="Mojito, Margarita, Martini…"
              placeholderTextColor={colors.onSurfaceVariant}
              value={cocktailName}
              onChangeText={setCocktailName}
              returnKeyType="search"
              autoFocus
            />
          </View>

          {loading && (
            <View style={s.stateWrap}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[typography.bodySm, s.stateText]}>
                Recherche en cours…
              </Text>
            </View>
          )}

          {!loading && searched && results.length === 0 && (
            <GlassCard style={s.emptyCard}>
              <Text style={s.emptyIcon}>😕</Text>
              <Text style={[typography.headlineSm, s.emptyTitle]}>
                Aucun résultat
              </Text>
              <Text style={[typography.bodySm, s.emptyText]}>
                Vérifie l'orthographe ou essaie avec un autre nom.
              </Text>
            </GlassCard>
          )}

          {!loading && results.length > 0 && (
            <View style={s.resultsWrap}>
              <View style={s.resultsHeader}>
                <Text style={[typography.labelLg, s.resultsTitle]}>
                  Résultats
                </Text>
                <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>
                  {results.length} cocktail{results.length > 1 ? "s" : ""}
                </Text>
              </View>
              <FlatList
                data={results}
                renderItem={renderCocktail}
                keyExtractor={(item) => String(item.idDrink)}
                scrollEnabled={false}
                contentContainerStyle={{ gap: spacing.sm }}
              />
            </View>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  input: {
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },

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
  cardFooter: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  cardName: { color: "#fff", marginBottom: 4 },
  cardSub: { color: "rgba(255,255,255,0.6)" },
});
