"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { BookingsTable } from "@/components/admin/bookings-table";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminBookingListItem, BookingStatus } from "@/types";

const STATUSES: BookingStatus[] = ["PAYMENT_PENDING", "PAYMENT_FAILED", "CONFIRMED", "CAR_ASSIGNED", "ACTIVE", "COMPLETED", "CANCELLED"];

function AdminBookingsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const [bookings, setBookings] = useState<AdminBookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(statusParam && STATUSES.includes(statusParam as BookingStatus) ? statusParam : "ALL");
  const [customer, setCustomer] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (customer) params.set("customer", customer);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await apiFetch<AdminBookingListItem[]>(`/admin/bookings?${params.toString()}`);
      setBookings(res.data);
      setPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      toast({ title: "Could not load bookings", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [status, customer, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="All bookings across the platform."
        action={
          <Button asChild>
            <Link href="/admin/bookings/offline">
              <Plus className="size-4" /> Offline Booking
            </Link>
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            className="min-w-[200px] flex-1"
            placeholder="Search customer name/mobile..."
            value={customer}
            onChange={(e) => {
              setPage(1);
              setCustomer(e.target.value);
            }}
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
          >
            <SelectTrigger className="h-12 w-48 rounded-2xl border border-navy-200 px-4">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-40"
            value={dateFrom}
            onChange={(e) => {
              setPage(1);
              setDateFrom(e.target.value);
            }}
          />
          <Input
            type="date"
            className="w-40"
            value={dateTo}
            onChange={(e) => {
              setPage(1);
              setDateTo(e.target.value);
            }}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No bookings yet." description="Bookings will show up here once customers start booking cars." />
      ) : (
        <>
          <BookingsTable bookings={bookings} />
          <div className="mt-4">
            <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  );
}
