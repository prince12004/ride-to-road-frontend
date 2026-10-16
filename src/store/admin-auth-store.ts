"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, setAccessToken } from "@/lib/api";

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AdminAuthState {
  admin: AdminUserSummary | null;
  accessToken: string | null;
  isHydrated: boolean;
  setSession: (admin: AdminUserSummary, accessToken: string) => void;
  clearSession: () => void;
  fetchMe: () => Promise<void>;
  setHydrated: () => void;
  hasPermission: (module: string) => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      accessToken: null,
      isHydrated: false,
      setSession: (admin, accessToken) => {
        setAccessToken(accessToken, "admin");
        set({ admin, accessToken });
      },
      clearSession: () => {
        setAccessToken(null, "admin");
        set({ admin: null, accessToken: null });
      },
      fetchMe: async () => {
        const token = get().accessToken;
        if (token) setAccessToken(token, "admin");
        try {
          const res = await apiFetch<AdminUserSummary>("/admin/auth/me");
          set({ admin: res.data });
          return;
        } catch {
          // Access token may have simply expired — try the refresh-token
          // cookie before logging the admin out on every reload.
        }
        try {
          const refreshRes = await apiFetch<{ accessToken: string }>("/admin/auth/refresh", { method: "POST" });
          setAccessToken(refreshRes.data.accessToken, "admin");
          set({ accessToken: refreshRes.data.accessToken });
          const res = await apiFetch<AdminUserSummary>("/admin/auth/me");
          set({ admin: res.data });
        } catch {
          get().clearSession();
        }
      },
      setHydrated: () => set({ isHydrated: true }),
      hasPermission: (module: string) => {
        const admin = get().admin;
        if (!admin) return false;
        return admin.role === "SUPER_ADMIN" || admin.permissions.includes(module);
      },
    }),
    {
      name: "rtr-admin-auth",
      // Read localStorage only after mount (see AuthHydration). Rehydrating
      // during module load made the first client render differ from the
      // server HTML — a hydration mismatch that re-rendered and flickered.
      skipHydration: true,
      partialize: (state) => ({ admin: state.admin, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessToken(state.accessToken, "admin");
        state?.setHydrated();
      },
    }
  )
);
