"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Car, CalendarClock, Users, IndianRupee, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { BookingStatusBadge } from "@/components/admin/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatINR } from "@/lib/utils";
import type { DashboardStats } from "@/types";

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "navy",
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: "navy" | "lime";
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
        <div
          className={
            accent === "lime"
              ? "grid size-9 place-items-center rounded-full bg-lime/20 text-brand-deep"
              : "grid size-9 place-items-center rounded-full bg-navy-900/5 text-navy-700"
          }
        >
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-2xl font-extrabold text-navy-950">{value}</p>
        {href && <ArrowRight className="size-4 text-navy-300 transition-transform group-hover:translate-x-0.5" />}
      </div>
    </>
  );

  const className = "group block p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(14,29,38,0.3)]";

  if (href) {
    return (
      <Link href={href}>
        <Card className={className}>{content}</Card>
      </Link>
    );
  }

  return <Card className={className}>{content}</Card>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashboardStats>("/admin/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) => {
        toast({ title: "Could not load dashboard", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-navy-100" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-navy-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-navy-100" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-64 animate-pulse rounded-3xl bg-navy-100" />
          <div className="h-64 animate-pulse rounded-3xl bg-navy-100" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-sm text-navy-500">Could not load dashboard stats.</p>;
  }

  const maxRevenue = Math.max(1, ...stats.dailyRevenue.map((d) => d.total));

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of cars, bookings and revenue." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Car} label="Total Cars" value={stats.totalCars} href="/admin/cars" />
        <StatCard icon={Car} label="Available Cars" value={stats.availableCars} accent="lime" href="/admin/cars?status=AVAILABLE" />
        <StatCard icon={CalendarClock} label="Total Bookings" value={stats.totalBookings} href="/admin/bookings" />
        <StatCard
          icon={CalendarClock}
          label="Confirmed Bookings"
          value={stats.confirmedBookings}
          accent="lime"
          href="/admin/bookings?status=CONFIRMED"
        />
        <StatCard
          icon={CalendarClock}
          label="Pending Payments"
          value={stats.pendingPaymentBookings}
          href="/admin/bookings/pending-payments"
        />
        <StatCard
          icon={CalendarClock}
          label="Completed"
          value={stats.completedBookings}
          accent="lime"
          href="/admin/bookings?status=COMPLETED"
        />
        <StatCard icon={CalendarClock} label="Cancelled" value={stats.cancelledBookings} href="/admin/bookings?status=CANCELLED" />
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} href="/admin/users" />
        <StatCard icon={IndianRupee} label="Total Revenue" value={formatINR(stats.totalRevenue)} accent="lime" href="/admin/bookings" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-navy-400" />
            <h2 className="font-display text-base font-bold text-navy-900">Revenue — Last 14 Days</h2>
          </div>
          {stats.dailyRevenue.length === 0 ? (
            <p className="mt-4 text-sm text-navy-400">No revenue data yet.</p>
          ) : (
            <div className="mt-6 flex items-end gap-1.5" style={{ height: 160 }}>
              {stats.dailyRevenue.map((d) => (
                <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-md bg-lime-500 transition-colors group-hover:bg-lime-600"
                    style={{ height: `${Math.max(4, (d.total / maxRevenue) * 140)}px` }}
                  />
                  <span className="mt-1.5 rotate-0 text-[9px] text-navy-400">
                    {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <div className="pointer-events-none absolute -top-8 hidden rounded-md bg-navy-950 px-2 py-1 text-[10px] font-semibold text-white group-hover:block">
                    {formatINR(d.total)} · {d.count} bkg
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-base font-bold text-navy-900">Recent Users</h2>
          {stats.recentUsers.length === 0 ? (
            <p className="mt-4 text-sm text-navy-400">No customers yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recentUsers.map((u, i) => (
                <li key={i} className="flex items-center justify-between border-b border-navy-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{u.name}</p>
                    <p className="text-xs text-navy-400">{u.mobile}</p>
                  </div>
                  <p className="text-xs text-navy-400">{new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-navy-900">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-sm font-semibold text-brand-deep hover:underline">
            View all
          </Link>
        </div>
        {stats.recentBookings.length === 0 ? (
          <p className="mt-4 text-sm text-navy-400">No bookings yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-navy-400">
                  <th className="pb-2 pr-4">Booking ID</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Car</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b._id} className="border-t border-navy-50">
                    <td className="py-2.5 pr-4 font-medium text-navy-900">
                      <Link href={`/admin/bookings/${b._id}`} className="hover:underline">
                        {b.bookingId}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-navy-700">{b.customerName}</td>
                    <td className="py-2.5 pr-4 text-navy-700">
                      {b.car && typeof b.car === "object" ? b.car.name : <span className="text-navy-400">Car removed</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-navy-700">{formatINR(b.totalAmount)}</td>
                    <td className="py-2.5 pr-4">
                      <BookingStatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
