"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, LayoutDashboard, LogIn, LogOut, Menu, Phone, UserRound, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { Button } from "@/components/ui/button";
import { mainNav, siteConfig } from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/lib/api";

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

function UserMenu() {
  const { user, clearSession, isHydrated } = useAuthStore();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — clear the local session regardless of API result.
    }
    clearSession();
    setOpen(false);
  };

  // Until the saved session is read, hold the slot open instead of showing
  // "Login" and then swapping it for the avatar a moment later.
  if (!isHydrated) return <span aria-hidden className="hidden h-9 w-[5.5rem] sm:block" />;

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
        <Link href="/login">
          <LogIn className="size-4" /> Login
        </Link>
      </Button>
    );
  }

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center overflow-hidden rounded-full bg-navy-900 font-display text-xs font-extrabold text-white transition-opacity hover:opacity-90"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user.profileImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.profileImage.url} alt="" className="size-full object-cover" />
        ) : (
          initials(user.name, user.mobile)
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-navy-100 bg-white p-1.5 shadow-2xl shadow-navy-900/15">
            <p className="truncate px-3 py-2 text-xs font-semibold text-navy-400">{user.name || user.mobile}</p>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50"
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
            <Link
              href="/dashboard/bookings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50"
            >
              <CalendarClock className="size-4" /> My Bookings
            </Link>
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50"
            >
              <UserRound className="size-4" /> Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, clearSession } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleMobileLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — clear the local session regardless of API result.
    }
    clearSession();
    setOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent bg-white/90 backdrop-blur-xl transition-[box-shadow,border-color] duration-300",
        scrolled && "border-navy-100/80 shadow-[0_10px_30px_-18px_rgba(14,29,38,0.35)]",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4 sm:h-[72px]">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${siteConfig.contact.phone}`}
            className="hidden items-center gap-2 text-sm font-semibold text-navy-900 lg:flex"
          >
            <Phone className="size-4 text-brand-deep" />
            {siteConfig.contact.phoneDisplay}
          </a>
          <Button asChild size="sm" variant="navy" className="hidden sm:inline-flex">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <WhatsappIcon /> Book on WhatsApp
            </a>
          </Button>
          <UserMenu />
          <a
            href={`tel:${siteConfig.contact.phone}`}
            aria-label={`Call ${siteConfig.contact.phoneDisplay}`}
            className="grid size-10 place-items-center rounded-full bg-navy-50 text-navy-900 transition-colors hover:bg-navy-100 lg:hidden"
          >
            <Phone className="size-[18px]" />
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full bg-navy-900 text-white transition-colors hover:bg-navy-800 xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

        {open && (
          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className="h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-navy-100 bg-white duration-200 animate-in fade-in-0 slide-in-from-top-2 sm:h-[calc(100dvh-72px)] xl:hidden"
          >
            <ul className="container flex flex-col py-4">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-navy-50 py-4 font-display text-xl font-semibold text-navy-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="container flex flex-col gap-3 pb-10">
              {user ? (
                <>
                  <Button asChild variant="lime" size="lg">
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <LayoutDashboard /> My Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/dashboard/bookings" onClick={() => setOpen(false)}>
                      <CalendarClock /> My Bookings
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild variant="lime" size="lg">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <LogIn /> Login / Sign Up
                  </Link>
                </Button>
              )}
              <Button asChild variant="whatsapp" size="lg">
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <WhatsappIcon /> Book on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`tel:${siteConfig.contact.phone}`}>
                  <Phone /> Call {siteConfig.contact.phoneDisplay}
                </a>
              </Button>
              {user && (
                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-red-600"
                >
                  <LogOut className="size-4" /> Logout
                </button>
              )}
            </div>
          </nav>
        )}
    </header>
  );
}
