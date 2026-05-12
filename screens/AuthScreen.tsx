import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Eye, EyeOff } from "lucide-react-native";
import { useDispatch } from "react-redux";

import { login } from "../reducers/user";
import { fetchFavoritesFromBackend } from "../reducers/favorites";
import { api } from "../services/api";
import { PrimaryButton, SegmentedToggle } from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const dispatch = useDispatch();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs manquants", "Email et mot de passe requis.");
      return;
    }
    if (isSignup && !username.trim()) {
      Alert.alert("Champs manquants", "Le pseudo est requis.");
      return;
    }
    try {
      setLoading(true);
      const res = isSignup
        ? await api.signup({ username: username.trim(), email: email.trim(), password })
        : await api.signin({ email: email.trim(), password });

      dispatch(login({ token: res.token, username: res.username, email: email.trim() }));
      dispatch(fetchFavoritesFromBackend() as any);
    } catch (error: any) {
      Alert.alert("Erreur", error?.message || "Impossible de se connecter, réessaye.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.hero}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logoGlow}
            />
            <Text style={s.logoEmoji}>🍸</Text>
            <Text style={[typography.headlineLg, s.appName]}>Cocktail Maker</Text>
            <Text style={[typography.bodySm, s.tagline]}>
              {isSignup
                ? "Crée ton compte pour sauvegarder tes recettes"
                : "Reconnecte-toi pour retrouver tes favoris"}
            </Text>
          </View>

          {/* Mode toggle */}
          <SegmentedToggle
            segments={[
              { value: "signin" as Mode, label: "Connexion" },
              { value: "signup" as Mode, label: "Inscription" },
            ]}
            value={mode}
            onChange={(v) => setMode(v)}
            style={s.toggle}
          />

          {/* Form */}
          <View style={s.form}>
            {isSignup && (
              <View style={s.field}>
                <Text style={[typography.labelMd, s.label]}>Pseudo</Text>
                <TextInput
                  style={[typography.bodySm, s.input]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ex : alice"
                  placeholderTextColor={colors.onSurfaceVariant}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={s.field}>
              <Text style={[typography.labelMd, s.label]}>Email</Text>
              <TextInput
                style={[typography.bodySm, s.input]}
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemple.com"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.field}>
              <Text style={[typography.labelMd, s.label]}>Mot de passe</Text>
              <View style={s.passwordRow}>
                <TextInput
                  style={[typography.bodySm, s.input, s.inputPassword]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.onSurfaceVariant}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  style={s.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                >
                  {showPassword
                    ? <EyeOff size={20} color={colors.onSurfaceVariant} strokeWidth={1.8} />
                    : <Eye size={20} color={colors.onSurfaceVariant} strokeWidth={1.8} />
                  }
                </Pressable>
              </View>
            </View>

            <PrimaryButton
              label={isSignup ? "Créer mon compte" : "Se connecter"}
              onPress={handleSubmit}
              disabled={loading}
              loading={loading}
              style={s.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: 72,
    paddingBottom: 40,
    justifyContent: "center",
  },

  hero: { alignItems: "center", marginBottom: spacing.xl },
  logoGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -40,
    opacity: 0.2,
  },
  logoEmoji: { fontSize: 60, marginBottom: spacing.sm },
  appName: { color: colors.primary, textAlign: "center" },
  tagline: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },

  toggle: { marginBottom: spacing.md },

  form: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
  },
  field: { gap: spacing.xs },
  label: {
    color: colors.onSurfaceVariant,
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
  passwordRow: { position: "relative" },
  inputPassword: { paddingRight: 52 },
  eyeBtn: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: { marginTop: spacing.xs },
});
