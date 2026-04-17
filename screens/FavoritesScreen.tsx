import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSelector, useDispatch } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { removeFavorite } from "../reducers/favorites";

export default function FavoritesScreen({ navigation }) {
  const favorites = useSelector((state: any) => state.favorites.value);
  const dispatch = useDispatch();

  const [tab, setTab] = useState<"all" | "alcohol" | "noalcohol">("all");
  const [toggleWidth, setToggleWidth] = useState(0);
  const toggleSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetValue = tab === "all" ? 0 : tab === "alcohol" ? 1 : 2;
    Animated.spring(toggleSlide, {
      toValue: targetValue,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
  }, [tab]);

  const filtered = useMemo(() => {
    let result = [];
    if (tab === "alcohol")
      result = favorites.filter((f) => {
        const type = String(f.type || "").toLowerCase();
        return (
          !type.includes("sans alcool") &&
          !type.includes("non alcoholic") &&
          !type.includes("non-alcoholic")
        );
      });
    else if (tab === "noalcohol")
      result = favorites.filter((f) => {
        const type = String(f.type || "").toLowerCase();
        return (
          type.includes("sans alcool") ||
          type.includes("non alcoholic") ||
          type.includes("non-alcoholic")
        );
      });
    else result = [...favorites];

    // Trier : recettes IA en premier
    return result.sort((a, b) => {
      const aIsAI = a.source === "ai" ? 0 : 1;
      const bIsAI = b.source === "ai" ? 0 : 1;
      return aIsAI - bIsAI;
    });
  }, [favorites, tab]);

  const handleRemoveFavorite = (id) => {
    dispatch(removeFavorite(id));
  };

  const renderFavorite = ({ item }) => (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.92}
      onPress={() => {
        if (item.source === "ai") {
          navigation.navigate("Details", { aiRecipe: item });
        } else {
          navigation.navigate("Details", { cocktailId: item.id });
        }
      }}
    >
      <Image source={{ uri: item.image }} style={s.thumb} />

      {/* overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.05)", "rgba(13,0,20,0.78)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.thumbOverlay}
      />

      <View style={s.content}>
        <View style={s.cardTopRow}>
          <View style={s.badgeRow}>
            {item.source === "ai" && (
              <View style={[s.badge, s.badgeAI]}>
                <Text style={s.badgeAIText}>IA</Text>
              </View>
            )}
            <View style={[s.badge, s.badgeGhost]}>
              <Text style={s.badgeGhostText}>
                {(item.type || "—").toUpperCase()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.trashBtn}
            onPress={() => handleRemoveFavorite(item.id)}
            activeOpacity={0.85}
          >
            <Text style={s.trashIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.name} numberOfLines={2}>
          {item.nom}
        </Text>

        <Text style={s.sub} numberOfLines={1}>
          Appuie pour ouvrir la recette
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (favorites.length === 0) {
    return (
      <LinearGradient
        colors={["#0d0014", "#2a0025", "#1a0020"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.emptyWrap}
      >
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>💔</Text>
          <Text style={s.emptyTitle}>Aucun favori</Text>
          <Text style={s.emptyText}>
            Ajoute des cocktails à tes favoris pour les retrouver ici.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0d0014", "#2a0025", "#1a0020"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Favoris</Text>
        <Text style={s.count}>
          {filtered.length} cocktail{filtered.length > 1 ? "s" : ""} •{" "}
          {favorites.length} au total
        </Text>

        {/* Tabs */}
        <View
          style={s.tabs}
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
                  width: (toggleWidth - 8 - 12) / 3,
                  transform: [
                    {
                      translateX: toggleSlide.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [
                          0,
                          (toggleWidth - 8 - 12) / 3 + 6,
                          ((toggleWidth - 8 - 12) / 3 + 6) * 2,
                        ],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          {[
            { key: "all", label: "Tout" },
            { key: "alcohol", label: "Avec alcool" },
            { key: "noalcohol", label: "Sans alcool" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={s.tab}
              onPress={() => setTab(t.key as any)}
              activeOpacity={0.9}
            >
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderFavorite}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  count: {
    color: "rgba(255,216,244,0.65)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Tabs (pill segmented control)
  tabs: {
    marginTop: 14,
    position: "relative",
    flexDirection: "row",
    backgroundColor: "rgba(21,0,31,0.70)",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.28)",
    padding: 4,
    gap: 6,
  },
  slideIndicator: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    backgroundColor: "rgba(255,42,109,0.9)",
    borderRadius: 999,
  },
  tab: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    zIndex: 1,
  },
  tabText: {
    color: "rgba(255,216,244,0.6)",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tabTextActive: { color: "#fff" },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },

  // Card
  card: {
    height: 110,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.30)",
    backgroundColor: "rgba(21,0,31,0.60)",
  },

  // Image (full-left background)
  thumb: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 110,
    backgroundColor: "#12001a",
  },
  thumbOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 110,
  },

  content: {
    flex: 1,
    padding: 14,
    paddingLeft: 122,
    justifyContent: "center",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },

  badgeRow: { flexDirection: "row", gap: 6, flex: 1, flexWrap: "wrap" },
  badge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  badgeAI: {
    backgroundColor: "rgba(138,43,226,0.18)",
    borderColor: "rgba(138,43,226,0.65)",
  },
  badgeAIText: {
    color: "#ba7fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.0,
  },
  badgeAmber: {
    backgroundColor: "rgba(255,138,0,0.14)",
    borderColor: "rgba(255,138,0,0.55)",
  },
  badgeGhost: {
    backgroundColor: "rgba(255,79,216,0.08)",
    borderColor: "rgba(255,79,216,0.35)",
  },
  badgeText: {
    color: "#ff4fd8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.0,
  },
  badgeGhostText: {
    color: "rgba(255,216,244,0.80)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  sub: {
    color: "rgba(255,216,244,0.55)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },

  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,79,216,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,79,216,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  trashIcon: { fontSize: 16 },

  // Empty state
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyCard: {
    width: "86%",
    backgroundColor: "rgba(21,0,31,0.65)",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.35)",
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 64, marginBottom: 10 },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  emptyText: {
    color: "rgba(255,216,244,0.75)",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "700",
    fontSize: 13,
  },
});
