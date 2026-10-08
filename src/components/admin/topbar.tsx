"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { apiFetch } from "@/lib/api";

export function AdminTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { admin, clearSession } = useAdminAuthStore();

  const handleLogout = async () => {
    try {
      await apiFetch("/admin/auth/logout", { method: "POST" });
    } catch {
      // Ignore — clear the client session regardless.
    }
    clearSession();
    router.push("/admin/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy-100 bg-white/90 px-4 backdrop-blur lg:px-8">
      <button onClick={onMenuClick} className="grid size-9 place-items-center rounded-full text-navy-500 hover:bg-navy-50 lg:hidden">
        <Menu className="size-5" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-navy-900">{admin?.name}</p>
          <p className="text-xs text-navy-400">{admin?.role.replace(/_/g, " ")}</p>
        </div>
        <div className="grid size-9 place-items-center rounded-full bg-navy-900 text-sm font-bold text-lime-400 transition-transform duration-200 hover:scale-105">
          {admin?.name?.charAt(0).toUpperCase() ?? "A"}
        </div>
        <button
          onClick={handleLogout}
          className="grid size-9 place-items-center rounded-full text-navy-400 transition-colors hover:bg-red-50 hover:text-red-600 lg:hidden"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
