"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, setAccessToken } from "@/lib/api";

export interface AuthUser {
  id: string;
  name?: string;
  mobile: string;
  email?: string;
  profileImage?: { url: string };
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  fetchMe: () => Promise<void>;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isHydrated: false,
      setSession: (user, accessToken) => {
        setAccessToken(accessToken, "user");
        set({ user, accessToken });
      },
      clearSession: () => {
        setAccessToken(null, "user");
        set({ user: null, accessToken: null });
      },
      fetchMe: async () => {
        const token = get().accessToken;
        if (token) setAccessToken(token, "user");
        try {
          const res = await apiFetch<AuthUser>("/auth/me");
          set({ user: res.data });
          return;
        } catch {
          // Access token may have simply expired (15 min lifetime) — the
          // refresh-token cookie can still be valid, so try that silently
          // before giving up and logging the user out on every reload.
        }
        try {
          const refreshRes = await apiFetch<{ accessToken: string }>("/auth/refresh", { method: "POST" });
          setAccessToken(refreshRes.data.accessToken, "user");
          set({ accessToken: refreshRes.data.accessToken });
          const res = await apiFetch<AuthUser>("/auth/me");
          set({ user: res.data });
        } catch {
          get().clearSession();
        }
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "rtr-user-auth",
      // Read localStorage only after mount (see AuthHydration). Rehydrating
      // during module load made the first client render differ from the
      // server HTML — a hydration mismatch that re-rendered and flickered.
      skipHydration: true,
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessToken(state.accessToken, "user");
        state?.setHydrated();
      },
    }
  )
);
