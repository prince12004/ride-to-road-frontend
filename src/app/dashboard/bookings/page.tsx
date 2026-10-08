"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { BookingCard } from "@/components/dashboard/booking-card";
import { cn } from "@/lib/utils";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { BookingStatus, UserBooking } from "@/types";

const UPCOMING_STATUSES: BookingStatus[] = ["CONFIRMED", "CAR_ASSIGNED", "ACTIVE"];
const PENDING_STATUSES: BookingStatus[] = ["PAYMENT_PENDING", "PAYMENT_FAILED"];

type TabKey = "all" | "upcoming" | "pending" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending Payment" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const TAB_KEYS: TabKey[] = TABS.map((t) => t.key);

function MyBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>(TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "all");

  const selectTab = (key: TabKey) => {
    setTab(key);
    router.replace(`/dashboard/bookings?tab=${key}`, { scroll: false });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<UserBooking[]>("/user/bookings");
        if (active) setBookings(res.data);
      } catch (err) {
        toast({
          title: "Could not load bookings",
          description: err instanceof ApiClientError ? err.message : "Please try again.",
          variant: "error",
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    switch (tab) {
      case "upcoming":
        return bookings.filter(
          (b) => UPCOMING_STATUSES.includes(b.status) && new Date(b.pickupDate).getTime() >= now
        );
      case "pending":
        return bookings.filter((b) => PENDING_STATUSES.includes(b.status));
      case "completed":
        return bookings.filter((b) => b.status === "COMPLETED");
      case "cancelled":
        return bookings.filter((b) => b.status === "CANCELLED");
      default:
        return bookings;
    }
  }, [bookings, tab]);

  return (
    <div className="space-y-6">
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-deep">
          <span className="h-px w-6 bg-current" /> Booking history
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">My Bookings</h1>
        <p className="mt-1 text-sm text-navy-500">Your full booking history with Ride to Road.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-navy-100 bg-white p-1.5 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTab(t.key)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-navy-900 text-white shadow-sm" : "text-navy-500 hover:bg-navy-50 hover:text-navy-900"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-navy-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-navy-500">No bookings in this category.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard key={b._id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-navy-100" />
          ))}
        </div>
      }
    >
      <MyBookingsContent />
    </Suspense>
  );
}
