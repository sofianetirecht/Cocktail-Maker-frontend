import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";

const API_URL = "https://cocktail-maker-backend.onrender.com";

export default function SearchByName({ navigation }) {
  const [cocktailName, setCocktailName] = useState("");
  const [loadingByName, setLoadingByName] = useState(false);
  const [nameResults, setNameResults] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Annuler le timeout précédent
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Si le champ est vide, vider les résultats
    if (!cocktailName.trim()) {
      setNameResults([]);
      return;
    }

    // Attendre 400ms après la dernière frappe
    debounceRef.current = setTimeout(() => {
      handleSearchByName();
    }, 0);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [cocktailName]);

  const handleSearchByName = async () => {
    if (!cocktailName.trim()) return;

    setLoadingByName(true);
    try {
      const response = await fetch(
        `${API_URL}/cocktail/searchByName?name=${encodeURIComponent(cocktailName)}`,
      );
      const data = await response.json();

      setNameResults(Array.isArray(data.drinks) ? data.drinks : []);
    } catch (error) {
      console.error("Erreur recherche nom:", error);
      setNameResults([]);
    } finally {
      setLoadingByName(false);
    }
  };

  const renderNameResult = ({ item }) => (
    <TouchableOpacity
      style={styles.cocktailCard}
      onPress={() =>
        navigation.navigate("Details", { cocktailId: item.idDrink })
      }
    >
      <Image
        source={{ uri: item.strDrinkThumb }}
        style={styles.cocktailImage}
      />
      <View style={styles.cocktailInfo}>
        <Text style={styles.cocktailName}>{item.strDrink}</Text>
        <Text style={styles.smallText}>Voir les détails</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>🔤 Recherche par nom</Text>
      <Text style={styles.sectionSubTitle}>Ex: Mojito, Margarita, Martini</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du cocktail"
        placeholderTextColor="#666"
        value={cocktailName}
        onChangeText={setCocktailName}
      />

      {loadingByName && (
        <ActivityIndicator size="large" color="#ff8a00" style={styles.loader} />
      )}

      {nameResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            {nameResults.length} cocktail{nameResults.length > 1 ? "s" : ""}{" "}
            trouvé
            {nameResults.length > 1 ? "s" : ""}
          </Text>
          <FlatList
            data={nameResults}
            renderItem={renderNameResult}
            keyExtractor={(item) => item.idDrink}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  sectionSubTitle: {
    fontSize: 14,
    color: "#ffd8f4",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(30, 3, 34, 0.72)",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#ff4fd8",
  },
  searchButton: {
    backgroundColor: "#ff8a00",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    marginVertical: 20,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  cocktailCard: {
    backgroundColor: "rgba(30, 3, 34, 0.72)",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#ff4fd8",
  },
  cocktailImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#5c0931",
  },
  cocktailInfo: {
    padding: 16,
  },
  cocktailName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  smallText: {
    fontSize: 13,
    color: "#ffd8f4",
  },
});
