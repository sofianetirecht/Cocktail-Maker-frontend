import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  hasSeenOnboarding: false,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    completeOnboarding: (state) => {
      state.hasSeenOnboarding = true;
    },
    resetOnboarding: (state) => {
      state.hasSeenOnboarding = false;
    },
  },
});

export const { completeOnboarding, resetOnboarding } = appSlice.actions;
export default appSlice.reducer;
