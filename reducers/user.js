import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: {
    token: null,
    username: null,
    email: null,
    avatar: null, // require() result (number) or URI string
  },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.value.token = action.payload.token;
      state.value.username = action.payload.username;
      state.value.email = action.payload.email || null;
    },
    logout: (state) => {
      state.value.token = null;
      state.value.username = null;
      state.value.email = null;
      state.value.avatar = null;
    },
    setAvatar: (state, action) => {
      state.value.avatar = action.payload;
    },
  },
});

export const { login, logout, setAvatar } = userSlice.actions;
export default userSlice.reducer;
