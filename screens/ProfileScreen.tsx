import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LogOut, Trash2, Heart, RotateCcw, Camera } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";

import * as ImagePicker from "expo-image-picker";
import { logout, setAvatar } from "../reducers/user";
import { clearFavorites } from "../reducers/favorites";
import { resetOnboarding } from "../reducers/app";
import { api } from "../services/api";
import { AppHeader } from "../components/ui";
import { colors, radius, spacing, typography } from "../theme";


export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.value);
  const favoritesCount = useSelector((state: any) => state.favorites.value.length);
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
      "Cette action est irréversible. Toutes tes données seront supprimées.",
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

  const initial = (user.username || "?").slice(0, 1).toUpperCase();

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) dispatch(setAvatar({ uri: result.assets[0].uri }));
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "L'accès à la caméra est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) dispatch(setAvatar({ uri: result.assets[0].uri }));
  }

  function handleAvatarPress() {
    const options: any[] = [
      { text: "Prendre une photo", onPress: takePhoto },
      { text: "Choisir dans la galerie", onPress: pickFromGallery },
    ];
    if (user.avatar) {
      options.push({
        text: "Retirer la photo",
        style: "destructive",
        onPress: () => dispatch(setAvatar(null)),
      });
    }
    options.push({ text: "Annuler", style: "cancel" });
    Alert.alert("Photo de profil", "Que veux-tu faire ?", options);
  }

  return (
    <View style={s.root}>
      <AppHeader
        showHomeButton
        onHomePress={() => navigation.navigate("MainTabs", { screen: "Home" })}
      />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={s.avatarWrap}>
          <Pressable
            onPress={handleAvatarPress}
            style={s.avatarTouchable}
          >
            {user.avatar ? (
              <Image source={user.avatar} style={s.avatarImage} />
            ) : (
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.avatar}
              >
                <Text style={[typography.displayMd, s.avatarText]}>{initial}</Text>
              </LinearGradient>
            )}
            <View style={s.cameraOverlay}>
              <Camera size={16} color="#fff" strokeWidth={2} />
            </View>
          </Pressable>
          <Text style={[typography.headlineSm, s.username]}>
            {user.username || "—"}
          </Text>
          <Text style={[typography.bodySm, s.email]}>{user.email || ""}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Heart size={20} color={colors.primary} strokeWidth={2} style={{ marginBottom: 6 }} />
            <Text style={[typography.headlineMd, s.statValue]}>{favoritesCount}</Text>
            <Text style={[typography.labelSm, s.statLabel]}>Favoris</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <Pressable
            style={({ pressed }) => [s.actionRow, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleLogout}
          >
            <View style={s.actionIcon}>
              <LogOut size={20} color={colors.onSurfaceVariant} strokeWidth={1.8} />
            </View>
            <Text style={[typography.titleMd, s.actionText]}>Se déconnecter</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.actionRow, s.actionDev, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              dispatch(logout());
              dispatch(clearFavorites());
              dispatch(resetOnboarding());
            }}
          >
            <View style={[s.actionIcon, s.actionIconDev]}>
              <RotateCcw size={20} color={colors.tertiary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.titleMd, { color: colors.tertiary }]}>
                Reset (dev)
              </Text>
              <Text style={[typography.labelSm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                Vide le store et relance l'onboarding
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.actionRow, s.actionDanger, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color={colors.tertiaryContainer} />
            ) : (
              <>
                <View style={[s.actionIcon, s.actionIconDanger]}>
                  <Trash2 size={20} color={colors.tertiaryContainer} strokeWidth={1.8} />
                </View>
                <Text style={[typography.titleMd, s.actionTextDanger]}>
                  Supprimer mon compte
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const AVATAR_SIZE = 88;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },

  avatarWrap: { alignItems: "center", marginBottom: spacing.xl },
  avatarTouchable: {
    marginBottom: spacing.md,
    position: "relative",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: { color: "#fff" },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  username: { color: colors.onSurface },
  email: { color: colors.onSurfaceVariant, marginTop: 4 },

  statsCard: {
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
  },
  statItem: { alignItems: "center" },
  statValue: { color: colors.primary },
  statLabel: {
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },

  actions: { gap: spacing.sm },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionDev: {
    borderColor: "rgba(255, 178, 186, 0.2)",
    backgroundColor: "rgba(255, 178, 186, 0.05)",
    borderStyle: "dashed",
  },
  actionIconDev: {
    backgroundColor: "rgba(255, 178, 186, 0.1)",
  },
  actionDanger: {
    borderColor: "rgba(255, 79, 114, 0.25)",
    backgroundColor: "rgba(255, 79, 114, 0.06)",
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconDanger: {
    backgroundColor: "rgba(255, 79, 114, 0.12)",
  },
  actionText: { color: colors.onSurface, flex: 1 },
  actionTextDanger: { color: colors.tertiaryContainer, flex: 1 },
});
