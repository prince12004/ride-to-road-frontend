"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, LayoutDashboard, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export const DASHBOARD_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarClock },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/verification", label: "Verification", icon: ShieldCheck },
];

export function DashboardNavLinks({ onNavigate, dark = false }: { onNavigate?: () => void; dark?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-lime text-navy-900 shadow-[0_8px_20px_-8px_rgba(166,206,57,0.6)]"
                : dark
                  ? "text-navy-300 hover:bg-white/5 hover:text-white"
                  : "text-navy-500 hover:bg-navy-50 hover:text-navy-900"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
