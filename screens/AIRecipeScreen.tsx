import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";
import {
  Sparkles,
  X,
  Plus,
  Heart,
  RotateCw,
  Droplet,
  Zap,
  Flame,
  GlassWater,
  Wine,
} from "lucide-react-native";
import {
  AppHeader,
  GlassCard,
  PrimaryButton,
  SegmentedToggle,
  ScreenContainer,
} from "../components/ui";
import { addFavoriteSync } from "../reducers/favorites";
import { colors, radius, spacing, typography } from "../theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function safeText(v: any, fallback = "—") {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v == null) return fallback;
  return JSON.stringify(v);
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

type TagInputProps = {
  label: string;
  placeholder: string;
  tags: string[];
  onTagsChange: (next: string[]) => void;
};

function TagInput({ label, placeholder, tags, onTagsChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<TextInput | null>(null);

  function addTag(raw: string) {
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

  function removeTag(tag: string) {
    onTagsChange(tags.filter((t) => t !== tag));
  }

  function handleAdd() {
    if (!inputValue.trim()) return;
    addTag(inputValue);
    requestAnimationFrame(() => inputRef.current?.focus?.());
  }

  return (
    <View style={ti.wrapper}>
      <Text style={[typography.labelLg, ti.label]}>{label}</Text>

      <GlassCard variant="default" borderRadius={radius.lg} style={ti.box}>
        {tags.length > 0 && (
          <View style={ti.tagsRow}>
            {tags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => removeTag(tag)}
                style={({ pressed }) => [
                  ti.tag,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={ti.tagText}>{tag}</Text>
                <X size={12} color={colors.primary} strokeWidth={2.5} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={ti.inputRow}>
          <TextInput
            ref={inputRef}
            style={ti.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={tags.length > 0 ? "" : placeholder}
            placeholderTextColor={colors.onSurfaceVariant + "99"}
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={handleAdd}
          />

          <Pressable
            onPress={handleAdd}
            disabled={!inputValue.trim()}
            style={({ pressed }) => [
              ti.addBtn,
              !inputValue.trim() && ti.addBtnDisabled,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Plus size={14} color={colors.primary} strokeWidth={2.5} />
            <Text style={ti.addBtnText}>Ajouter</Text>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
}

// ─── Selector Card (Format + Force) ──────────────────────────────────────────

type SelectorCardProps = {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  active: boolean;
  accentColor?: string;
  onPress: () => void;
};

function SelectorCard({
  icon: Icon,
  label,
  active,
  accentColor = colors.primary,
  onPress,
}: SelectorCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View
        style={[
          sel.card,
          active && {
            borderColor: accentColor,
            borderWidth: 2,
            backgroundColor: hexA(accentColor, 0.15),
            shadowColor: accentColor,
            shadowOpacity: 0.4,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          },
        ]}
      >
        <Icon
          size={28}
          color={active ? accentColor : colors.onSurfaceVariant}
          strokeWidth={active ? 2.5 : 2}
        />
        <Text
          style={[
            typography.titleMd,
            {
              color: active ? colors.onSurface : colors.onSurfaceVariant,
              fontWeight: active ? "700" : "500",
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function hexA(hex: string, alpha: number): string {
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
  const c = hex.replace("#", "");
  const full =
    c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AIRecipeScreen({ navigation }: any) {
  const dispatch = useDispatch();

  const [tasteTags, setTasteTags] = useState<string[]>([]);
  const [ingredientTags, setIngredientTags] = useState<string[]>([]);
  const [constraintTags, setConstraintTags] = useState<string[]>([]);

  const [isLongDrink, setIsLongDrink] = useState(true);
  const [isMocktail, setIsMocktail] = useState(false);
  const [strength, setStrength] = useState<"léger" | "normal" | "fort">(
    "normal"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const canGenerate = useMemo(
    () => tasteTags.length > 0 || ingredientTags.length > 0,
    [tasteTags, ingredientTags]
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

      setTasteTags([]);
      setIngredientTags([]);
      setConstraintTags([]);
    } catch (e: any) {
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
    Alert.alert("✓ Ajouté aux favoris", "Votre recette IA a été sauvegardée.");
    setModalVisible(false);
  }

  return (
    <View style={s.root}>
      <AppHeader onAvatarPress={() => navigation.navigate("Profile")} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          <ImageBackground
            source={require("../assets/cocktail.png")}
            style={s.heroImage}
            imageStyle={{ borderRadius: radius.xxl }}
          >
            <LinearGradient
              colors={["rgba(22,17,27,0.05)", "rgba(22,17,27,0.95)"]}
              style={[StyleSheet.absoluteFillObject, { borderRadius: radius.xxl }]}
            />
            <View style={s.heroContent}>
              <Text style={[typography.displayMd, s.heroTitle]}>
                Mixologue IA
              </Text>
              <Text style={[typography.labelLg, s.heroSub]}>
                Créez votre signature
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* ── Avec / Sans alcool ── */}
        <SegmentedToggle
          segments={[
            { value: "alcohol", label: "Avec Alcool" },
            { value: "mocktail", label: "Sans Alcool" },
          ]}
          value={isMocktail ? "mocktail" : "alcohol"}
          onChange={(v) => setIsMocktail(v === "mocktail")}
          style={{ marginVertical: spacing.lg }}
        />

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
        <Text style={[typography.labelLg, s.sectionLabel]}>Format</Text>
        <View style={s.gridRow}>
          <SelectorCard
            icon={GlassWater}
            label="Long Drink"
            active={isLongDrink}
            onPress={() => setIsLongDrink(true)}
          />
          <SelectorCard
            icon={Wine}
            label="Short"
            active={!isLongDrink}
            onPress={() => setIsLongDrink(false)}
          />
        </View>

        {/* ── Force ── */}
        {!isMocktail && (
          <>
            <Text style={[typography.labelLg, s.sectionLabel]}>
              Force du cocktail
            </Text>
            <View style={s.gridRow}>
              <SelectorCard
                icon={Droplet}
                label="Léger"
                active={strength === "léger"}
                accentColor="#60a5fa"
                onPress={() => setStrength("léger")}
              />
              <SelectorCard
                icon={Zap}
                label="Normal"
                active={strength === "normal"}
                accentColor="#fbbf24"
                onPress={() => setStrength("normal")}
              />
              <SelectorCard
                icon={Flame}
                label="Fort"
                active={strength === "fort"}
                accentColor={colors.tertiaryContainer}
                onPress={() => setStrength("fort")}
              />
            </View>
          </>
        )}

        {!canGenerate && (
          <View style={s.hintRow}>
            <Sparkles size={14} color={colors.primary} strokeWidth={2} />
            <Text style={[typography.bodySm, s.hint]}>
              Ajoute au moins un goût ou un ingrédient pour générer
            </Text>
          </View>
        )}

        {error ? (
          <Text style={[typography.bodySm, s.error]}>{error}</Text>
        ) : null}

        {canGenerate && (
          <PrimaryButton
            label="Générer ma recette"
            loading={loading}
            disabled={!canGenerate}
            onPress={() => generate(true)}
            icon={<Sparkles size={18} color="#fff" strokeWidth={2.5} />}
            style={{ marginTop: spacing.lg }}
          />
        )}
      </ScrollView>

      {/* ── Modal ── */}
      <RecipeModal
        visible={modalVisible}
        recipe={recipe}
        isMocktail={isMocktail}
        isLongDrink={isLongDrink}
        strength={strength}
        loading={loading}
        onClose={() => setModalVisible(false)}
        onRegenerate={() => generate(true)}
        onSave={onSaveFavorite}
      />
    </View>
  );
}

// ─── Recipe Modal ────────────────────────────────────────────────────────────

type RecipeModalProps = {
  visible: boolean;
  recipe: any;
  isMocktail: boolean;
  isLongDrink: boolean;
  strength: string;
  loading: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  onSave: () => void;
};

function RecipeModal({
  visible,
  recipe,
  isMocktail,
  isLongDrink,
  strength,
  loading,
  onClose,
  onRegenerate,
  onSave,
}: RecipeModalProps) {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={m.backdrop}>
        <View style={m.card}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={m.accentLine}
          />

          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <View style={m.badgeRow}>
                <View style={[m.badge, m.badgePrimary]}>
                  <Text style={m.badgeText}>
                    {isMocktail ? "SANS ALCOOL" : "ALCOOLISÉ"}
                  </Text>
                </View>
                <View style={[m.badge, m.badgeSecondary]}>
                  <Text style={m.badgeTextSecondary}>
                    {isLongDrink ? "LONG DRINK" : "SHORT"}
                  </Text>
                </View>
              </View>

              <Text style={[typography.headlineMd, m.title]}>
                {safeText(recipe?.name, "Recette IA")}
              </Text>

              {Array.isArray(recipe?.profile) && recipe.profile.length > 0 && (
                <Text style={[typography.bodySm, m.subtitle]}>
                  {recipe.profile.join(" · ")}
                </Text>
              )}
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [
                m.closeBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <X size={16} color={colors.onSurface} strokeWidth={2.5} />
            </Pressable>
          </View>

          {recipe?.glass && (
            <View style={m.statsBar}>
              <View style={m.statItem}>
                <GlassWater size={14} color={colors.primary} strokeWidth={2} />
                <Text style={m.statLabel} numberOfLines={1}>
                  {safeText(recipe?.glass).toUpperCase()}
                </Text>
              </View>
              <View style={m.statDivider} />
              <View style={m.statItem}>
                <Zap size={14} color={colors.primary} strokeWidth={2} />
                <Text style={m.statLabel}>{(strength || "normal").toUpperCase()}</Text>
              </View>
            </View>
          )}

          <ScrollView
            style={{ maxHeight: 360 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={m.sectionHeader}>
              <View style={m.sectionDash} />
              <Text style={[typography.labelLg, m.sectionTitle]}>
                Ingrédients
              </Text>
            </View>

            {Array.isArray(recipe?.ingredients) &&
              recipe.ingredients.map((it: any, i: number) => (
                <View key={i} style={m.ingredientRow}>
                  <View style={m.dot} />
                  <Text style={[typography.bodySm, m.ingredientName]}>
                    {safeText(it?.name)}
                  </Text>
                  <Text style={[typography.bodySm, m.ingredientAmount]}>
                    {safeText(it?.amount)}
                  </Text>
                </View>
              ))}

            <View style={[m.sectionHeader, { marginTop: spacing.md }]}>
              <View style={m.sectionDash} />
              <Text style={[typography.labelLg, m.sectionTitle]}>
                Préparation
              </Text>
            </View>

            {Array.isArray(recipe?.steps) &&
              recipe.steps.map((step: any, i: number) => (
                <View key={i} style={m.stepRow}>
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    style={m.stepNum}
                  >
                    <Text style={m.stepNumText}>{i + 1}</Text>
                  </LinearGradient>
                  <Text style={[typography.bodySm, m.stepText]}>
                    {safeText(step)}
                  </Text>
                </View>
              ))}

            {recipe?.garnish ? (
              <>
                <View style={[m.sectionHeader, { marginTop: spacing.md }]}>
                  <View style={m.sectionDash} />
                  <Text style={[typography.labelLg, m.sectionTitle]}>
                    Décoration
                  </Text>
                </View>
                <View style={m.tipRow}>
                  <Sparkles size={12} color={colors.primary} strokeWidth={2} />
                  <Text style={[typography.bodySm, m.bodyText]}>
                    {safeText(recipe.garnish)}
                  </Text>
                </View>
              </>
            ) : null}

            {Array.isArray(recipe?.tips) && recipe.tips.length > 0 ? (
              <>
                <View style={[m.sectionHeader, { marginTop: spacing.md }]}>
                  <View style={m.sectionDash} />
                  <Text style={[typography.labelLg, m.sectionTitle]}>
                    Conseils du barman
                  </Text>
                </View>
                {recipe.tips.map((t: any, i: number) => (
                  <View key={i} style={m.tipRow}>
                    <Sparkles size={12} color={colors.primary} strokeWidth={2} />
                    <Text style={[typography.bodySm, m.bodyText]}>
                      {safeText(t)}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            <View style={{ height: spacing.xs }} />
          </ScrollView>

          <View style={m.actions}>
            <PrimaryButton
              variant="secondary"
              label="Nouvelle"
              size="md"
              onPress={onRegenerate}
              loading={loading}
              icon={<RotateCw size={14} color={colors.primary} strokeWidth={2.5} />}
              fullWidth={false}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="Enregistrer"
              size="md"
              onPress={onSave}
              icon={<Heart size={14} color="#fff" strokeWidth={2.5} />}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: 120,
    paddingTop: spacing.md,
  },
  hero: {
    height: 180,
    borderRadius: radius.xxl,
    overflow: "hidden",
  },
  heroImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: spacing.lg,
  },
  heroTitle: {
    color: "#fff",
    marginBottom: 6,
  },
  heroSub: {
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 11,
  },
  sectionLabel: {
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  gridRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
    justifyContent: "center",
  },
  hint: {
    color: colors.onSurfaceVariant,
    fontStyle: "italic",
  },
  error: {
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});

const ti = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
  },
  label: {
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  box: {
    padding: spacing.sm,
    minHeight: 56,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(221, 183, 255, 0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  tagText: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(221, 183, 255, 0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(221, 183, 255, 0.4)",
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});

const sel = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.glassSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});

const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: colors.glassSurface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    overflow: "hidden",
    paddingBottom: spacing.lg,
  },
  accentLine: {
    height: 3,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.xs,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgePrimary: {
    backgroundColor: "rgba(221, 183, 255, 0.16)",
    borderColor: colors.primary,
  },
  badgeSecondary: {
    backgroundColor: "rgba(255, 79, 114, 0.16)",
    borderColor: colors.tertiaryContainer,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  badgeTextSecondary: {
    color: colors.tertiary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    color: colors.onSurface,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
    fontStyle: "italic",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.glassFill,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    flexShrink: 1,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionDash: {
    width: 22,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 13,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  ingredientName: {
    color: colors.onSurface,
    flex: 1,
  },
  ingredientAmount: {
    color: colors.primary,
    fontWeight: "700",
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  stepText: {
    color: colors.onSurface,
    flex: 1,
  },
  tipRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.lg,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  bodyText: {
    color: colors.onSurfaceVariant,
    flex: 1,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
});
