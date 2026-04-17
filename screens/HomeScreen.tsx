import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const MENU_ITEMS = [
  {
    icon: "⚗️",
    label: "Recette sur mesure",
    desc: "Créez un cocktail selon vos goûts",
    route: "AIRecipe",
    accent: "rgba(9, 187, 15)",
    badge: "IA Boost",
    isAI: true,
  },
  {
    icon: "🧉",
    label: "Recherche par ingrédients",
    desc: "Une idée d'ingrédient ? Trouvez les cocktails possibles",
    route: "Search",
    accent: "#ff4f8b",
    badge: null,
  },
  {
    icon: "🃏",
    label: "Swipe et match",
    desc: "Au lieu de trouver l'amour, trouvez votre cocktail idéal",
    route: "Swipe",
    accent: "#ff8a00",
    badge: null,
  },
  {
    icon: "🏷️",
    label: "Recherche par nom",
    desc: "Trouvez le cocktail de vos rêves",
    route: "SearchByName",
    accent: "#c44dff",
    badge: null,
  },
];

function AnimatedCard({ item, index, navigation }: any) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: 200 + index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => navigation.navigate(item.route)}
        style={[styles.card, item.isAI && styles.cardAI]}
      >
        {/* Glow border top */}
        <View style={[styles.cardGlowLine, { backgroundColor: item.accent }]} />

        <View style={styles.cardInner}>
          <View style={styles.cardLeft}>
            <View
              style={[styles.iconCircle, { borderColor: item.accent + "66" }]}
            >
              <Text style={styles.cardIcon}>{item.icon}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </View>

          <View style={styles.cardRight}>
            {item.badge ? (
              <View style={[styles.badge, { backgroundColor: item.accent }]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
            <Text style={[styles.chevron, { color: item.accent }]}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Background layers */}
      <LinearGradient
        colors={["#0f0515ff", "#34004fff", "#51024aff"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── HEADER ── */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: logoAnim,
                transform: [
                  {
                    scale: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Logo pill */}
            <View style={styles.logoPill}>
              <Text style={styles.logoPillText}>🍹 MixologyAI</Text>
            </View>

            <Text style={styles.heroTitle}>
              Transformez vos{"\n"}
              <Text style={styles.heroAccent}>ingrédients</Text> en{"\n"}
              <Text style={styles.heroAccent2}>cocktails incroyables</Text>
            </Text>

            <Text style={styles.heroSub}>
              Devenez le barman que vous méritez{"\n"}
              Votre barman personnel est à portée de main.
            </Text>
          </Animated.View>

          {/* ── DIVIDER ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Choisissez votre mode</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── MENU CARDS ── */}
          <View style={styles.cards}>
            {MENU_ITEMS.map((item, i) => (
              <AnimatedCard
                key={item.route}
                item={item}
                index={i}
                navigation={navigation}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0d0015",
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
  },
  logoPill: {
    backgroundColor: "rgba(255,79,139,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,79,139,0.4)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  logoPillText: {
    color: "#ff4f8b",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 25 * 1.2,
    marginBottom: 14,
  },
  heroAccent: {
    color: "#ff4f8b",
  },
  heroAccent2: {
    color: "#ff8a00",
  },
  heroSub: {
    fontSize: 13,
    color: "#c8a8d8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 11,
    color: "#9b7aaa",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Divider ──
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,79,139,0.2)",
  },
  dividerText: {
    color: "#9b7aaa",
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // ── Cards ──
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: "rgba(26, 0, 40, 0.85)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,79,139,0.25)",
    overflow: "hidden",
  },
  cardAI: {
    borderColor: "rgba(9, 187, 15, 0.35)",
    shadowColor: "rgba(9, 187, 15)",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  cardGlowLine: {
    height: 2,
    width: "100%",
    opacity: 0.8,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  cardLeft: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: {
    fontSize: 26,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: "#9b7aaa",
    lineHeight: 17,
  },
  cardRight: {
    alignItems: "center",
    gap: 6,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 24,
  },

  // ── CTA ──
  ctaWrapper: {
    marginTop: 28,
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaButton: {
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 16,
  },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  browseLink: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 4,
  },
  browseLinkText: {
    color: "#9b7aaa",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  // Bouton retour

  backBtnGrad: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    marginLeft: -3,
    marginTop: -1,
  },
});
