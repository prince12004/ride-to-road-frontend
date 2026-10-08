"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, MessageCircle, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAV_ITEMS, DashboardNavLinks } from "@/components/dashboard/nav-links";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

function initials(name?: string, mobile?: string) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }
  return mobile?.slice(-2) ?? "RR";
}

function UserCard({ name, mobile }: { name?: string; mobile?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-lime font-display text-sm font-extrabold text-navy-900">
        {initials(name, mobile)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{name || "Guest"}</p>
        <p className="truncate text-xs text-navy-400">{mobile}</p>
      </div>
    </div>
  );
}

function LogoutButton({ onLoggedOut }: { onLoggedOut: () => void }) {
  return (
    <button
      type="button"
      onClick={onLoggedOut}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
    >
      <LogOut className="size-4" /> Logout
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isHydrated, clearSession } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — clear the local session regardless of API result.
    }
    clearSession();
    router.push("/");
  };

  if (!isHydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-50">
        <div className="size-8 animate-spin rounded-full border-2 border-navy-200 border-t-navy-900" />
      </div>
    );
  }

  const pageTitle = DASHBOARD_NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="mx-auto flex max-w-[100%]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-4 bg-navy-950 bg-lanes p-4 lg:flex">
          <div className="flex justify-center py-1">
            <Logo className="h-8 w-auto" onDark />
          </div>
          <UserCard name={user.name} mobile={user.mobile} />
          <DashboardNavLinks dark />
          <div className="mt-auto border-t border-white/10 pt-3">
            <LogoutButton onLoggedOut={handleLogout} />
          </div>
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-navy-950/60" onClick={() => setDrawerOpen(false)} />
            <div className={cn("absolute inset-y-0 left-0 flex w-64 flex-col gap-4 bg-navy-950 bg-lanes p-4 shadow-2xl")}>
              <div className="flex items-center justify-between pb-1">
                <Logo className="h-7 w-auto" onDark />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="grid size-9 place-items-center rounded-full text-navy-300 hover:bg-white/5 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <UserCard name={user.name} mobile={user.mobile} />
              <DashboardNavLinks dark onNavigate={() => setDrawerOpen(false)} />
              <div className="mt-auto border-t border-white/10 pt-3">
                <LogoutButton onLoggedOut={handleLogout} />
              </div>
            </div>
          </div>
        )}

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-navy-100 bg-white/95 px-4 backdrop-blur lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-navy-700 hover:bg-navy-50 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
              <Logo className="h-8 lg:hidden" />
              <h1 className="hidden truncate font-display text-lg font-bold text-navy-900 lg:block">{pageTitle}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> Support
                </a>
              </Button>
              <div className="grid size-9 place-items-center rounded-full bg-navy-900 font-display text-xs font-extrabold text-white">
                {initials(user.name, user.mobile)}
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
