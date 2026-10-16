"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarClock,
  Car,
  CarFront,
  Users,
  Ticket,
  BadgePercent,
  MapPin,
  Newspaper,
  HelpCircle,
  MessageSquareQuote,
  Route,
  Mail,
  FileText,
  Settings,
  ShieldCheck,
  History,
  ExternalLink,
  LogOut,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module: string | null; // null = always visible (e.g. dashboard-agnostic)
  children?: NavChild[];
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, module: "dashboard" },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: CalendarClock,
    module: "bookings",
    children: [
      { label: "Pending Payments", href: "/admin/bookings/pending-payments" },
      { label: "Offline Booking", href: "/admin/bookings/offline" },
    ],
  },
  { label: "Cars", href: "/admin/cars", icon: Car, module: "cars" },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
    module: "customers",
    children: [{ label: "Verification Requests", href: "/admin/customers/verification-requests" }],
  },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket, module: "coupons" },
  { label: "Offers", href: "/admin/offers", icon: BadgePercent, module: "offers" },
  { label: "Locations", href: "/admin/locations", icon: MapPin, module: "locations" },
  {
    label: "Blogs",
    href: "/admin/blogs",
    icon: Newspaper,
    module: "blogs",
    children: [{ label: "Blog Categories", href: "/admin/blogs/categories" }],
  },
  { label: "FAQs", href: "/admin/faqs", icon: HelpCircle, module: "faqs" },
  { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote, module: "testimonials" },
  { label: "Journeys", href: "/admin/journeys", icon: Route, module: "blogs" },
  { label: "Contact Enquiries", href: "/admin/contact-enquiries", icon: Mail, module: "contact" },
  { label: "Car Leads", href: "/admin/car-leads", icon: CarFront, module: "contact" },
  { label: "Content Pages", href: "/admin/content-pages", icon: FileText, module: "cms" },
  { label: "Settings", href: "/admin/settings", icon: Settings, module: "settings" },
  { label: "Users", href: "/admin/users", icon: ShieldCheck, module: "__super_admin_only" },
  { label: "Activity Logs", href: "/admin/activity-logs", icon: History, module: "activityLogs" },
];

export function AdminSidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, hasPermission, clearSession } = useAdminAuthStore();
  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>({});

  const visible = NAV.filter((item) => {
    if (item.module === "__super_admin_only") return admin?.role === "SUPER_ADMIN";
    if (item.module === null) return true;
    return hasPermission(item.module);
  });

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
    <aside
      className={cn(
        "flex w-64 flex-col border-r border-navy-800/40 bg-navy-950",
        mobile ? "h-full" : "fixed inset-y-0 left-0 z-40 hidden lg:flex",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-lime text-sm font-extrabold text-navy-900">R</div>
        <span className="truncate font-display text-sm font-bold text-white">Ride to Road</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {visible.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            const hasActiveChild = item.children?.some((c) => pathname === c.href) ?? false;
            const isOpen = openOverrides[item.href] ?? (active || hasActiveChild);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <div
                  className={cn(
                    "group flex items-center rounded-xl text-sm font-medium text-navy-300 transition-colors duration-200 hover:bg-white/5 hover:text-white",
                    active && "bg-lime/15 text-lime-400",
                  )}
                >
                  <Link href={item.href} className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
                    <Icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      onClick={() => setOpenOverrides((prev) => ({ ...prev, [item.href]: !isOpen }))}
                      aria-expanded={isOpen}
                      aria-label={`Toggle ${item.label} submenu`}
                      className="grid size-9 shrink-0 place-items-center text-navy-400 hover:text-white"
                    >
                      <ChevronDown className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180")} />
                    </button>
                  )}
                </div>

                {item.children && (
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="ml-6 overflow-hidden border-l border-white/10 pl-3"
                      >
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <li key={child.href} className="pt-0.5">
                              <Link
                                href={child.href}
                                className={cn(
                                  "block rounded-lg px-2.5 py-1.5 text-xs font-medium text-navy-400 transition-colors duration-200 hover:text-white",
                                  childActive && "text-lime-400",
                                )}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-4" /> View Website
        </a>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-300 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="size-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
