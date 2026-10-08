"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function AuthHydration() {
  const { accessToken, fetchMe, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && accessToken) fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  return null;
}
