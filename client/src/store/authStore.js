import { create } from "zustand";

const STORAGE_KEY = "rtchat_auth";

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const stored = loadStoredAuth();

export const useAuthStore = create((set, get) => ({
  user: stored?.user || null,
  accessToken: stored?.accessToken || "",
  refreshToken: stored?.refreshToken || "",

  setAuth: ({ user, accessToken, refreshToken }) => {
    const payload = { user, accessToken, refreshToken };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    set(payload);
  },

  setTokens: ({ accessToken, refreshToken }) => {
    const state = get();
    const next = {
      user: state.user,
      accessToken,
      refreshToken,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set({ accessToken, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, accessToken: "", refreshToken: "" });
  },
}));
