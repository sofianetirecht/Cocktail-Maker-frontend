const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    const error = new Error(data?.error || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  signup: (body) => request("/users/signup", { method: "POST", body }),
  signin: (body) => request("/users/signin", { method: "POST", body }),
  me: (token) => request("/users/me", { token }),
  deleteAccount: (token) =>
    request("/users/me", { method: "DELETE", token }),

  getFavorites: (token) => request("/users/favorites", { token }),
  addFavorite: (token, body) =>
    request("/users/favorites", { method: "POST", body, token }),
  removeFavorite: (token, idDrink) =>
    request(`/users/favorites/${idDrink}`, { method: "DELETE", token }),

  getRecipes: (token) => request("/users/recipes", { token }),
  saveRecipe: (token, body) =>
    request("/users/recipes", { method: "POST", body, token }),
  removeRecipe: (token, id) =>
    request(`/users/recipes/${id}`, { method: "DELETE", token }),
};
