import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch } from "react-redux";

import { login } from "../reducers/user";
import { fetchFavoritesFromBackend } from "../reducers/favorites";
import { api } from "../services/api";

export default function AuthScreen() {
  const dispatch = useDispatch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
        ? await api.signup({
            username: username.trim(),
            email: email.trim(),
            password,
          })
        : await api.signin({ email: email.trim(), password });

      dispatch(
        login({
          token: res.token,
          username: res.username,
          email: email.trim(),
        }),
      );

      // Récupérer les favoris/recettes depuis le backend
      dispatch(fetchFavoritesFromBackend() as any);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.message || "Impossible de se connecter, réessaye.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#0d0014", "#2a0025", "#1a0020"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            <Text style={s.logo}>🍸</Text>
            <Text style={s.title}>Cocktail Maker</Text>
            <Text style={s.subtitle}>
              {isSignup
                ? "Crée ton compte pour sauvegarder tes recettes"
                : "Reconnecte-toi pour retrouver tes favoris"}
            </Text>
          </View>

          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, !isSignup && s.tabActive]}
              onPress={() => setMode("signin")}
              activeOpacity={0.85}
            >
              <Text style={[s.tabText, !isSignup && s.tabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, isSignup && s.tabActive]}
              onPress={() => setMode("signup")}
              activeOpacity={0.85}
            >
              <Text style={[s.tabText, isSignup && s.tabTextActive]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          <View style={s.form}>
            {isSignup && (
              <View style={s.field}>
                <Text style={s.label}>Pseudo</Text>
                <TextInput
                  style={s.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ex: alice"
                  placeholderTextColor="rgba(255,216,244,0.4)"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemple.com"
                placeholderTextColor="rgba(255,216,244,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Mot de passe</Text>
              <View style={s.passwordRow}>
                <TextInput
                  style={[s.input, s.inputPassword]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,216,244,0.4)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={s.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text
                    style={[s.eyeIcon, showPassword && s.eyeIconActive]}
                  >
                    👁️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={s.submit}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#ff2a6d", "#ff4fd8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.submitGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.submitText}>
                    {isSignup ? "Créer mon compte" : "Se connecter"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 56, marginBottom: 12 },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,216,244,0.7)",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "rgba(21,0,31,0.70)",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.28)",
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "rgba(255,42,109,0.9)" },
  tabText: {
    color: "rgba(255,216,244,0.6)",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tabTextActive: { color: "#fff" },
  form: { gap: 16 },
  field: {},
  label: {
    color: "#ffd8f4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(21,0,31,0.60)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.5)",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  passwordRow: { position: "relative" },
  inputPassword: { paddingRight: 52 },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: { fontSize: 20, opacity: 0.4 },
  eyeIconActive: { opacity: 1 },
  submit: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  submitGrad: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
