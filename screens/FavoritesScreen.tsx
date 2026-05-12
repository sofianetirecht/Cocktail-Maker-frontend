import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import { Trash2 } from "lucide-react-native";
import { removeFavoriteSync } from "../reducers/favorites";
import {
  AppHeader,
  GlassCard,
  Chip,
  SegmentedToggle,
} from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";

type TabValue = "all" | "alcohol" | "noalcohol";

export default function FavoritesScreen({ navigation }) {
  const favorites = useSelector((state: any) => state.favorites.value);
  const dispatch = useDispatch();

  const [tab, setTab] = useState<TabValue>("all");

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

    return result.sort((a, b) => {
      const aIsAI = a.source === "ai" ? 0 : 1;
      const bIsAI = b.source === "ai" ? 0 : 1;
      return aIsAI - bIsAI;
    });
  }, [favorites, tab]);

  const handleRemove = (id: any) => {
    const fav = favorites.find((f) => f.id === id);
    if (fav) dispatch(removeFavoriteSync(fav) as any);
  };

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => {
        if (item.source === "ai") {
          navigation.navigate("Details", { aiRecipe: item });
        } else {
          navigation.navigate("Details", { cocktailId: item.id });
        }
      }}
      style={({ pressed }) => [
        s.card,
        { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      {/* Thumbnail */}
      <Image source={{ uri: item.image }} style={s.thumb} />
      <LinearGradient
        colors={["rgba(31,26,35,0)", "rgba(31,26,35,0.85)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.thumbFade}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={s.cardContent}>
        <View style={s.cardTop}>
          <View style={s.badgeRow}>
            {item.source === "ai" && (
              <View style={s.badgeAI}>
                <Text style={[typography.labelSm, s.badgeAIText]}>IA</Text>
              </View>
            )}
            {item.type ? (
              <Chip
                label={String(item.type).toUpperCase()}
                variant="outline"
                uppercase
              />
            ) : null}
          </View>

          <Pressable
            onPress={() => handleRemove(item.id)}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
          >
            <Trash2
              size={18}
              color={colors.onSurfaceVariant}
              strokeWidth={1.5}
            />
          </Pressable>
        </View>

        <Text
          style={[typography.titleMd, s.name]}
          numberOfLines={1}
        >
          {item.nom}
        </Text>
        <Text style={[typography.labelSm, s.sub]}>
          Appuie pour ouvrir la recette
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={s.root}>
      <AppHeader
        showHomeButton={false}
        onAvatarPress={() => navigation.navigate("Profile")}
      />

      <View style={s.content}>
        {/* Count */}
        <Text style={[typography.labelMd, s.count]}>
          {filtered.length} cocktail{filtered.length !== 1 ? "s" : ""}
          {favorites.length !== filtered.length
            ? ` · ${favorites.length} au total`
            : ""}
        </Text>

        {/* Filter */}
        <SegmentedToggle
          segments={[
            { value: "all" as TabValue, label: "Tout" },
            { value: "alcohol" as TabValue, label: "Avec alcool" },
            { value: "noalcohol" as TabValue, label: "Sans alcool" },
          ]}
          value={tab}
          onChange={(v) => setTab(v)}
          style={s.toggle}
        />

        {/* List */}
        {favorites.length === 0 ? (
          <View style={s.emptyWrap}>
            <GlassCard style={s.emptyCard}>
              <Text style={s.emptyIcon}>💔</Text>
              <Text style={[typography.headlineSm, s.emptyTitle]}>
                Aucun favori
              </Text>
              <Text style={[typography.bodySm, s.emptyText]}>
                Ajoute des cocktails à tes favoris pour les retrouver ici.
              </Text>
            </GlassCard>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <GlassCard style={s.emptyCard}>
                  <Text style={s.emptyIcon}>🔍</Text>
                  <Text style={[typography.headlineSm, s.emptyTitle]}>
                    Aucun résultat
                  </Text>
                  <Text style={[typography.bodySm, s.emptyText]}>
                    Aucun favori dans cette catégorie.
                  </Text>
                </GlassCard>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const THUMB_SIZE = 96;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.sm,
  },

  count: {
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  toggle: {
    marginBottom: spacing.md,
  },

  list: {
    gap: spacing.sm,
    paddingBottom: 110,
  },

  // Card
  card: {
    height: THUMB_SIZE,
    flexDirection: "row",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumbFade: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: THUMB_SIZE + 24,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    justifyContent: "center",
    gap: 4,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
    flexWrap: "nowrap",
    overflow: "hidden",
  },
  badgeAI: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeAIText: {
    color: colors.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  name: {
    color: colors.onSurface,
  },
  sub: {
    color: colors.onSurfaceVariant,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyCard: {
    width: "85%",
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.onSurface,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
});
