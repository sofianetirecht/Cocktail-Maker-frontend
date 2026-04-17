import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: [],
};

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    addFavorite: (state, action) => {
      // Vérifier si le cocktail n'est pas déjà dans les favoris
      const exists = state.value.find((fav) => fav.id === action.payload.id);
      if (!exists) {
        state.value.push(action.payload);
      }
    },
    removeFavorite: (state, action) => {
      state.value = state.value.filter((fav) => fav.id !== action.payload);
    },
    clearFavorites: (state) => {
      state.value = [];
    },
  },
});

export const { addFavorite, removeFavorite, clearFavorites } =
  favoritesSlice.actions;
export default favoritesSlice.reducer;
