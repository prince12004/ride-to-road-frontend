"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, ListChecks, Sparkles, Wallet, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookingCard } from "@/components/dashboard/booking-card";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import type { DashboardSummary } from "@/types";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch<DashboardSummary>("/user/dashboard-summary");
        if (active) setSummary(res.data);
      } catch (err) {
        toast({
          title: "Could not load dashboard",
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

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-navy-100" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl bg-navy-950 bg-lanes p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-lime">
          <Sparkles className="size-3.5" /> {greeting()}
        </p>
        <h1 className="mt-3 text-balance font-display text-2xl font-extrabold text-white sm:text-3xl">
          {user?.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome back"}
        </h1>
        <p className="mt-1.5 max-w-lg text-sm text-navy-300">A quick look at your bookings with Ride to Road.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Bookings" value={summary.totalBookings} icon={ListChecks} href="/dashboard/bookings?tab=all" />
        <StatCard label="Upcoming" value={summary.upcomingBookings} icon={CalendarClock} href="/dashboard/bookings?tab=upcoming" />
        <StatCard
          label="Completed"
          value={summary.completedBookings}
          icon={CheckCircle2}
          tone="success"
          href="/dashboard/bookings?tab=completed"
        />
        <StatCard
          label="Cancelled"
          value={summary.cancelledBookings}
          icon={XCircle}
          tone="danger"
          href="/dashboard/bookings?tab=cancelled"
        />
        <StatCard
          label="Pending Payment"
          value={summary.pendingPaymentBookings}
          icon={Wallet}
          tone="warning"
          href="/dashboard/bookings?tab=pending"
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy-900">Your Next Booking</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/bookings">View all</Link>
          </Button>
        </div>
        {summary.nextBooking ? (
          <BookingCard booking={summary.nextBooking} />
        ) : (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-navy-500">No upcoming bookings yet.</p>
            <Button asChild variant="lime">
              <Link href="/cars">Browse Cars</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
