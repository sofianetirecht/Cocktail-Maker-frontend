import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Keyboard,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import { addFavoriteSync } from "../reducers/favorites";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function safeText(v, fallback = "—") {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v == null) return fallback;
  return JSON.stringify(v);
}

// ─── Tag input component ────────────────────────────────────────────────────

function TagInput({ label, placeholder, tags, onTagsChange }) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  function addTag(raw) {
    const parts = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    const next = [...tags];
    parts.forEach((p) => {
      if (!next.includes(p)) next.push(p);
    });

    onTagsChange(next);
    setInputValue("");
  }

  function removeTag(tag) {
    onTagsChange(tags.filter((t) => t !== tag));
  }

  function handleAdd() {
    if (!inputValue.trim()) return;

    addTag(inputValue);

    // ✅ garde le clavier ouvert + remet le focus direct
    requestAnimationFrame(() => {
      inputRef.current?.focus?.();
    });
  }

  return (
    <View style={ti.wrapper}>
      <Text style={ti.label}>{label}</Text>

      <View style={ti.box}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={ti.tag}
            onPress={() => removeTag(tag)}
            activeOpacity={0.9}
          >
            <Text style={ti.tagText}>{tag}</Text>
            <Text style={ti.tagX}> ✕</Text>
          </TouchableOpacity>
        ))}

        <View style={ti.inputRow}>
          <TextInput
            ref={inputRef}
            style={ti.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,216,244,0.4)"
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={() => Keyboard.dismiss()} // ✅ Done/OK = ferme seulement
          />

          <TouchableOpacity
            style={[ti.addBtn, !inputValue.trim() && ti.addBtnDisabled]}
            onPress={handleAdd} // ✅ ajoute sans fermer
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
              style={ti.addBtnGrad}
            >
              <Text style={ti.addBtnText}>Ajouter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const ti = StyleSheet.create({
  wrapper: { marginTop: 14 },
  label: {
    color: "#ffd8f4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  box: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "rgba(21,0,31,0.60)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.5)",
    padding: 10,
    minHeight: 48,
    alignItems: "center",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,79,216,0.18)",
    borderRadius: 999,
    paddingVertical: 5,
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
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  addBtnText: {
    color: "#ffd8f4",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AIRecipeScreen({ navigation }) {
  const dispatch = useDispatch();

  const [tasteTags, setTasteTags] = useState([]);
  const [ingredientTags, setIngredientTags] = useState([]);
  const [constraintTags, setConstraintTags] = useState([]);

  const [isLongDrink, setIsLongDrink] = useState(true);
  const [isMocktail, setIsMocktail] = useState(false);
  const [strength, setStrength] = useState("normal");
  const [toggleWidth, setToggleWidth] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(toggleSlide, {
      toValue: isMocktail ? 1 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
  }, [isMocktail]);

  const canGenerate = useMemo(
    () => tasteTags.length > 0 || ingredientTags.length > 0,
    [tasteTags, ingredientTags],
  );

  async function generate(openModal = true) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/ai/original-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tastes: tasteTags.join(", "),
          ingredients: ingredientTags.join(", "),
          constraints: constraintTags.join(", "),
          isLongDrink,
          isMocktail,
          strength,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data?.error || "Erreur inconnue");
        return;
      }

      setRecipe(data.recipe);
      if (openModal) setModalVisible(true);

      // Vider tous les champs après génération réussie
      setTasteTags([]);
      setIngredientTags([]);
      setConstraintTags([]);
    } catch (e) {
      setError(e?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  function onSaveFavorite() {
    if (!recipe) return;

    const favorite = {
      id: `ai_${Date.now()}`,
      source: "ai",
      nom: recipe?.name || "Cocktail IA",
      type: isMocktail ? "Mocktail" : "Cocktail",
      image:
        "https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg",
      recipe,
    };

    dispatch(addFavoriteSync(favorite) as any);
    Alert.alert("✅ Ajouté aux favoris", "Votre recette IA a été sauvegardée.");
    setModalVisible(false);
  }

  return (
    <LinearGradient
      colors={["#0d0014", "#2a0025", "#1a0020"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={s.headerBar}>
        <Text style={s.headerTitle}>Mixologue IA</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Alcohol toggle ── */}
        <View
          style={s.toggleRow}
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
                  width: (toggleWidth - 8) / 2,
                  transform: [
                    {
                      translateX: toggleSlide.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (toggleWidth - 8) / 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          <TouchableOpacity
            style={s.toggleBtn}
            onPress={() => setIsMocktail(false)}
          >
            <Text style={[s.toggleText, !isMocktail && s.toggleTextActive]}>
              Avec Alcool
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.toggleBtn}
            onPress={() => setIsMocktail(true)}
          >
            <Text style={[s.toggleText, isMocktail && s.toggleTextActive]}>
              Sans Alcool
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tag Inputs ── */}
        <TagInput
          label="Vos Goûts"
          placeholder="sucré, amer… puis taper sur 'Ajouter'"
          tags={tasteTags}
          onTagsChange={setTasteTags}
        />

        <TagInput
          label="Vos Ingrédients"
          placeholder="vodka, citron… puis taper sur 'Ajouter'"
          tags={ingredientTags}
          onTagsChange={setIngredientTags}
        />

        <TagInput
          label="Contraintes (optionnel)"
          placeholder="sans œuf, sans lactose…"
          tags={constraintTags}
          onTagsChange={setConstraintTags}
        />

        {/* ── Format ── */}
        <Text style={s.sectionLabel}>Format</Text>
        <View style={s.gridRow}>
          {[
            { label: "Long Drink", val: true, icon: "🥛" },
            { label: "Short", val: false, icon: "🍸" },
          ].map(({ label, val, icon }) => (
            <TouchableOpacity
              key={label}
              style={[s.flavorCard, isLongDrink === val && s.flavorCardActive]}
              onPress={() => setIsLongDrink(val)}
            >
              <Text style={s.flavorIcon}>{icon}</Text>
              <Text
                style={[
                  s.flavorLabel,
                  isLongDrink === val && s.flavorLabelActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Force — only for cocktails ── */}
        {!isMocktail && (
          <>
            <Text style={s.sectionLabel}>Force du Cocktail</Text>
            <View style={s.gridRow}>
              {[
                { label: "Léger", val: "léger", icon: "💧" },
                { label: "Normal", val: "normal", icon: "⚡" },
                { label: "Fort", val: "fort", icon: "🔥" },
              ].map(({ label, val, icon }) => (
                <TouchableOpacity
                  key={val}
                  style={[s.flavorCard, strength === val && s.flavorCardActive]}
                  onPress={() => setStrength(val)}
                >
                  <Text style={s.flavorIcon}>{icon}</Text>
                  <Text
                    style={[
                      s.flavorLabel,
                      strength === val && s.flavorLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {!canGenerate && (
          <Text style={s.hint}>
            ✦ Ajoute au moins un goût ou un ingrédient pour générer
          </Text>
        )}

        {error && <Text style={s.error}>{error}</Text>}

        {/* ── CTA ── */}
        <TouchableOpacity
          style={[s.cta, (!canGenerate || loading) && s.ctaDisabled]}
          onPress={() => generate(true)}
          disabled={!canGenerate || loading}
        >
          <LinearGradient
            colors={
              canGenerate && !loading
                ? ["#ff4fd8", "#ff2a6d", "#ff8a00"]
                : ["#3a1040", "#3a1040"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.ctaGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.ctaIcon}>✦</Text>
                <Text style={s.ctaText}>Surprise de l&apos;IA</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Modal ─────────────────────────────────────────────────────── */}
      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={m.backdrop}>
          <LinearGradient
            colors={["#100018", "#1e0028", "#160020"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={m.card}
          >
            <LinearGradient
              colors={["#ff4fd8", "#ff2a6d", "#ff8a00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={m.accentLine}
            />

            <View style={m.header}>
              <View style={m.titleBlock}>
                <View style={m.badgeRow}>
                  <View
                    style={[
                      m.badge,
                      {
                        backgroundColor: "rgba(255,42,109,0.25)",
                        borderColor: "#ff2a6d",
                      },
                    ]}
                  >
                    <Text style={m.badgeText}>
                      {isMocktail ? "SANS ALCOOL" : "ALCOOLISÉ"}
                    </Text>
                  </View>

                  <View
                    style={[
                      m.badge,
                      {
                        backgroundColor: "rgba(255,138,0,0.2)",
                        borderColor: "#ff8a00",
                      },
                    ]}
                  >
                    <Text style={[m.badgeText, { color: "#ff8a00" }]}>
                      {isLongDrink ? "LONG DRINK" : "SHORT"}
                    </Text>
                  </View>
                </View>

                <Text style={m.title}>
                  {safeText(recipe?.name, "Recette IA")}
                </Text>

                {Array.isArray(recipe?.profile) &&
                  recipe.profile.length > 0 && (
                    <Text style={m.subtitle}>{recipe.profile.join(" · ")}</Text>
                  )}
              </View>

              <TouchableOpacity
                style={m.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={m.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={m.statsBar}>
              {[
                {
                  icon: "🍹",
                  label: safeText(recipe?.glass, "—").toUpperCase(),
                },
                { icon: "⚡", label: (strength || "normal").toUpperCase() },
              ].map(({ icon, label }, i, arr) => (
                <React.Fragment key={i}>
                  <View style={m.statItem}>
                    <Text style={m.statIcon}>{icon}</Text>
                    <Text
                      style={m.statLabel}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {label}
                    </Text>
                  </View>
                  {i < arr.length - 1 && <View style={m.statDivider} />}
                </React.Fragment>
              ))}
            </View>

            <View style={m.divider} />

            <ScrollView
              style={{ maxHeight: 360 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={m.sectionHeader}>
                <View style={m.sectionDash} />
                <Text style={m.sectionTitle}>Ingrédients</Text>
              </View>

              {Array.isArray(recipe?.ingredients) &&
                recipe.ingredients.map((it, i) => (
                  <View key={i} style={m.ingredientRow}>
                    <View style={m.dot} />
                    <Text style={m.ingredientName}>{safeText(it?.name)}</Text>
                    <Text style={m.ingredientAmount}>
                      {safeText(it?.amount)}
                    </Text>
                  </View>
                ))}

              <View style={[m.sectionHeader, { marginTop: 16 }]}>
                <View style={m.sectionDash} />
                <Text style={m.sectionTitle}>Préparation</Text>
              </View>

              {Array.isArray(recipe?.steps) &&
                recipe.steps.map((step, i) => (
                  <View key={i} style={m.stepRow}>
                    <LinearGradient
                      colors={["#ff2a6d", "#ff8a00"]}
                      style={m.stepNum}
                    >
                      <Text style={m.stepNumText}>{i + 1}</Text>
                    </LinearGradient>
                    <Text style={m.stepText}>{safeText(step)}</Text>
                  </View>
                ))}

              {recipe?.garnish && (
                <>
                  <View style={[m.sectionHeader, { marginTop: 16 }]}>
                    <View style={m.sectionDash} />
                    <Text style={m.sectionTitle}>Décoration</Text>
                  </View>
                  <View style={m.tipRow}>
                    <Text style={m.tipBullet}>✦</Text>
                    <Text style={m.bodyText}>{safeText(recipe.garnish)}</Text>
                  </View>
                </>
              )}

              {Array.isArray(recipe?.tips) && recipe.tips.length > 0 && (
                <>
                  <View style={[m.sectionHeader, { marginTop: 16 }]}>
                    <View style={m.sectionDash} />
                    <Text style={m.sectionTitle}>Conseils du Barman</Text>
                  </View>
                  {recipe.tips.map((t, i) => (
                    <View key={i} style={m.tipRow}>
                      <Text style={m.tipBullet}>✦</Text>
                      <Text style={m.bodyText}>{safeText(t)}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={{ height: 8 }} />
            </ScrollView>

            <View style={m.actions}>
              <TouchableOpacity
                style={m.btnBase}
                onPress={() => generate(true)}
                disabled={loading}
                activeOpacity={0.92}
              >
                <LinearGradient
                  colors={["#291130ff", "#451a42ff", "#811697ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={m.btnGrad}
                >
                  <View pointerEvents="none" style={m.btnGloss} />
                  <View pointerEvents="none" style={m.btnStroke} />
                  {loading ? (
                    <ActivityIndicator color="#ff4fd8" size="small" />
                  ) : (
                    <>
                      <Text style={[m.btnIcon, { color: "#ff4fd8" }]}>↺</Text>
                      <Text style={m.btnTextGhost}>NOUVELLE RECETTE</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={m.btnBase}
                onPress={onSaveFavorite}
                activeOpacity={0.92}
              >
                <LinearGradient
                  colors={["#291130ff", "#451a42ff", "#811697ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={m.btnGrad}
                >
                  <View
                    pointerEvents="none"
                    style={[m.btnGloss, { opacity: 0.22 }]}
                  />
                  <View pointerEvents="none" style={m.btnStroke} />
                  <Text style={m.btnIcon}>♥</Text>
                  <Text style={m.btnTextSolid}>ENREGISTRER</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  headerBackBtn: {
    // Le composant BackButton gère son propre style
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  toggleRow: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: "rgba(21,0,31,0.70)",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.3)",
    padding: 4,
    marginBottom: 4,
  },
  slideIndicator: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    backgroundColor: "#ff2a6d",
    borderRadius: 999,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    color: "rgba(255,216,244,0.55)",
    fontWeight: "700",
    fontSize: 14,
  },
  toggleTextActive: { color: "#fff" },
  sectionLabel: {
    color: "#ffd8f4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  flavorCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: "rgba(21,0,31,0.60)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.35)",
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
  },
  flavorCardActive: {
    borderColor: "#ff2a6d",
    backgroundColor: "rgba(255,42,109,0.18)",
  },
  flavorIcon: { fontSize: 22 },
  flavorLabel: {
    color: "rgba(255,216,244,0.55)",
    fontSize: 13,
    fontWeight: "700",
  },
  flavorLabelActive: { color: "#fff" },
  cta: {
    marginTop: 28,
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaGradient: {
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaIcon: { color: "#fff", fontSize: 16 },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  hint: {
    color: "rgba(255,228,184,0.6)",
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  error: {
    color: "#ffb3df",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "700",
  },
});

const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  card: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,79,216,0.25)",
    overflow: "hidden",
    paddingBottom: 18,
  },
  accentLine: { height: 3, width: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },
  titleBlock: { flex: 1 },
  badgeRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  badge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  badgeText: {
    color: "#ff4fd8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "rgba(255,216,244,0.55)",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,79,216,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,79,216,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  closeX: { color: "rgba(255,216,244,0.8)", fontWeight: "900", fontSize: 13 },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "rgba(255,79,216,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,79,216,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    minWidth: 0,
  },
  statIcon: { fontSize: 12 },
  statLabel: {
    flexShrink: 1,
    minWidth: 0,
    color: "rgba(255,216,244,0.7)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,79,216,0.3)",
    marginHorizontal: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,79,216,0.15)",
    marginHorizontal: 20,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionDash: {
    width: 22,
    height: 2,
    backgroundColor: "#ff2a6d",
    borderRadius: 2,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,79,216,0.08)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff2a6d",
    marginRight: 10,
  },
  ingredientName: { color: "#ffd8f4", fontSize: 13, flex: 1 },
  ingredientAmount: { color: "#ff4fd8", fontWeight: "800", fontSize: 13 },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "flex-start",
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
  stepText: { color: "#ffd8f4", flex: 1, lineHeight: 21, fontSize: 13 },
  tipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  tipBullet: { color: "#ff4fd8", fontSize: 10, marginTop: 4 },
  bodyText: {
    color: "rgba(255,216,244,0.75)",
    lineHeight: 21,
    fontSize: 13,
    flex: 1,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 18,
  },
  btnBase: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000000ff",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  btnGrad: {
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnIcon: { color: "#fff", fontSize: 20, fontWeight: "900" },
  btnTextSolid: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  btnTextGhost: {
    color: "rgba(255,216,244,0.85)",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  btnGloss: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "55%",
    backgroundColor: "rgba(255,255,255,0.16)",
    transform: [{ skewY: "-10deg" }],
  },
  btnStroke: {
    position: "absolute",
    left: 1,
    right: 1,
    top: 1,
    bottom: 1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
});
