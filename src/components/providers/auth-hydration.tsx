"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useAdminAuthStore } from "@/store/admin-auth-store";

export function AuthHydration() {
  const { accessToken, fetchMe, isHydrated } = useAuthStore();

  // Both stores use `skipHydration`, so the first client render matches the
  // server-rendered HTML; the saved session is restored right after mount.
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
    void useAdminAuthStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (isHydrated && accessToken) fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  return null;
}
