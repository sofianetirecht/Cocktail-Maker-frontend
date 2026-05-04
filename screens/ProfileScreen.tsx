import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";

import { logout } from "../reducers/user";
import { clearFavorites } from "../reducers/favorites";
import { api } from "../services/api";

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.value);
  const favoritesCount = useSelector(
    (state: any) => state.favorites.value.length,
  );
  const [deleting, setDeleting] = useState(false);

  function handleLogout() {
    Alert.alert("Déconnexion", "Veux-tu vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: () => {
          dispatch(logout());
          dispatch(clearFavorites());
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes tes données (favoris, recettes IA) seront supprimées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await api.deleteAccount(user.token);
              dispatch(logout());
              dispatch(clearFavorites());
            } catch (error: any) {
              Alert.alert("Erreur", error?.message || "Suppression impossible");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
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

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(user.username || "?").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={s.username}>{user.username || "—"}</Text>
          <Text style={s.email}>{user.email || ""}</Text>
        </View>

        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{favoritesCount}</Text>
            <Text style={s.statLabel}>Favoris</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.actionBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={s.actionIcon}>🚪</Text>
          <Text style={s.actionText}>Se déconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, s.actionBtnDanger]}
          onPress={handleDeleteAccount}
          disabled={deleting}
          activeOpacity={0.85}
        >
          {deleting ? (
            <ActivityIndicator color="#ff5577" />
          ) : (
            <>
              <Text style={s.actionIcon}>🗑️</Text>
              <Text style={[s.actionText, s.actionTextDanger]}>
                Supprimer mon compte
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: "rgba(255,42,109,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(255,79,216,0.6)",
  },
  avatarText: { color: "#fff", fontSize: 38, fontWeight: "900" },
  username: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  email: { color: "rgba(255,216,244,0.65)", marginTop: 4, fontSize: 14 },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(21,0,31,0.65)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.30)",
    paddingVertical: 18,
    marginBottom: 20,
    justifyContent: "center",
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { color: "#ff8a00", fontSize: 26, fontWeight: "900" },
  statLabel: {
    color: "rgba(255,216,244,0.7)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21,0,31,0.65)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,79,216,0.30)",
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 12,
  },
  actionBtnDanger: {
    borderColor: "rgba(255,80,120,0.5)",
    backgroundColor: "rgba(80,0,20,0.4)",
  },
  actionIcon: { fontSize: 18 },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  actionTextDanger: { color: "#ff5577" },
});
