import { createSlice } from "@reduxjs/toolkit";
import { api } from "../services/api";

const initialState = {
  value: [],
};

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    addFavorite: (state, action) => {
      const exists = state.value.find((fav) => fav.id === action.payload.id);
      if (!exists) {
        state.value.push(action.payload);
      }
    },
    removeFavorite: (state, action) => {
      state.value = state.value.filter((fav) => fav.id !== action.payload);
    },
    setFavorites: (state, action) => {
      state.value = action.payload;
    },
    clearFavorites: (state) => {
      state.value = [];
    },
  },
});

export const { addFavorite, removeFavorite, setFavorites, clearFavorites } =
  favoritesSlice.actions;
export default favoritesSlice.reducer;

/**
 * -----------------------------
 *  THUNKS (sync backend)
 * -----------------------------
 *
 * Ces thunks mettent à jour le state local IMMÉDIATEMENT (UI réactive)
 * puis tentent de synchroniser avec le backend si l'utilisateur est connecté.
 * En cas d'erreur réseau, on garde l'état local (offline-first).
 */

export const addFavoriteSync = (favorite) => async (dispatch, getState) => {
  dispatch(addFavorite(favorite));

  const token = getState().user?.value?.token;
  if (!token) return;

  try {
    if (favorite.source === "ai" && favorite.recipe) {
      const res = await api.saveRecipe(token, {
        ...favorite.recipe,
        name: favorite.recipe.name || favorite.nom,
      });
      dispatch(removeFavorite(favorite.id));
      dispatch(
        addFavorite({
          ...favorite,
          id: `ai_${res.recipe._id}`,
          remoteId: res.recipe._id,
        }),
      );
    } else {
      await api.addFavorite(token, {
        idDrink: String(favorite.id),
        nom: favorite.nom,
        image: favorite.image,
      });
    }
  } catch (error) {
    console.warn("Sync addFavorite failed:", error.message);
  }
};

export const removeFavoriteSync = (favorite) => async (dispatch, getState) => {
  dispatch(removeFavorite(favorite.id));

  const token = getState().user?.value?.token;
  if (!token) return;

  try {
    if (favorite.source === "ai") {
      const recipeId = favorite.remoteId || String(favorite.id).replace(/^ai_/, "");
      if (recipeId) await api.removeRecipe(token, recipeId);
    } else {
      await api.removeFavorite(token, String(favorite.id));
    }
  } catch (error) {
    console.warn("Sync removeFavorite failed:", error.message);
  }
};

export const fetchFavoritesFromBackend = () => async (dispatch, getState) => {
  const token = getState().user?.value?.token;
  if (!token) return;

  try {
    const [favRes, recipesRes] = await Promise.all([
      api.getFavorites(token),
      api.getRecipes(token),
    ]);

    const favorites = (favRes.favorites || []).map((f) => ({
      id: f.idDrink,
      nom: f.nom,
      image: f.image,
      type: "",
    }));

    const recipes = (recipesRes.recipes || []).map((r) => ({
      id: `ai_${r._id}`,
      remoteId: r._id,
      source: "ai",
      nom: r.name,
      type: r.type === "mocktail" ? "Mocktail" : "Cocktail",
      image:
        "https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg",
      recipe: r,
    }));

    dispatch(setFavorites([...recipes, ...favorites]));
  } catch (error) {
    console.warn("fetchFavoritesFromBackend failed:", error.message);
  }
};
