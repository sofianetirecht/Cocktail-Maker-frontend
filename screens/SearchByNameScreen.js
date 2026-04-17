import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function SearchByNameScreen({ navigation }) {
  const [cocktailName, setCocktailName] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  // Vider le champ quand on quitte la page
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setCocktailName("");
        setResults([]);
        setSearched(false);
      };
    }, []),
  );

  useEffect(() => {
    // Annuler le timeout précédent
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Si le champ est vide, vider les résultats
    if (!cocktailName.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    // Attendre 400ms après la dernière frappe
    debounceRef.current = setTimeout(() => {
      handleSearch();
    }, 100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [cocktailName]);

  // Vider le champ quand on quitte la page
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setCocktailName("");
        setResults([]);
        setSearched(false);
      };
    }, []),
  );

  const canSearch = cocktailName.trim().length > 0 && !loading;

  const handleSearch = async () => {
    if (!cocktailName.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/cocktail/searchByName?name=${encodeURIComponent(cocktailName)}`,
      );
      const data = await response.json();

      if (data.drinks && Array.isArray(data.drinks)) {
        setResults(data.drinks);
        setSearched(true);
      } else {
        setResults([]);
        setSearched(true);
      }
    } catch (error) {
      console.error("Erreur recherche nom:", error);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const renderCocktail = ({ item }) => {
    return (
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TouchableOpacity
          style={s.card}
          activeOpacity={0.92}
          onPress={() =>
            navigation.navigate("Details", { cocktailId: item.idDrink })
          }
        >
          <View style={s.cardMedia}>
            <Image source={{ uri: item.strDrinkThumb }} style={s.cardImage} />
            <LinearGradient
              colors={["rgba(0,0,0,0.08)", "rgba(13,0,20,0.88)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.cardOverlay}
            />

            <View style={s.cardTitleBlock}>
              <Text style={s.cardTitle} numberOfLines={2}>
                {item.strDrink || "Cocktail"}
              </Text>
              <Text style={s.cardSub} numberOfLines={1}>
                Clique pour voir la recette
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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
            <Text style={s.title}>Recherche par nom</Text>
            <Text style={s.subtitle}>
              Entre le nom du cocktail que tu recherches.
            </Text>
          </View>

          {/* Search box */}
          <View style={s.searchCard}>
            <Text style={s.label}>Nom du cocktail</Text>

            <TextInput
              style={s.input}
              placeholder="Mojito, Margarita, Martini…"
              placeholderTextColor="rgba(255,216,244,0.35)"
              value={cocktailName}
              onChangeText={setCocktailName}
              returnKeyType="search"
            />
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
                  Vérifie l'orthographe ou essaie avec un autre nom.
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
                keyExtractor={(item) => String(item.idDrink)}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 26 }}
              />
            </View>
          )}

          <View style={{ height: 26 }} />
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.3,
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

  input: {
    backgroundColor: "rgba(21,0,31,0.55)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
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
