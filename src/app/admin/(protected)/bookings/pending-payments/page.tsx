"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { BookingsTable } from "@/components/admin/bookings-table";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminBookingListItem } from "@/types";

export default function PendingPaymentsPage() {
  const [bookings, setBookings] = useState<AdminBookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminBookingListItem[]>(`/admin/bookings/pending-payments?page=${page}&limit=20`);
      setBookings(res.data);
      setPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      toast({ title: "Could not load pending payments", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Pending Payments" description="UPI QR bookings waiting for payment or for screenshot verification." />

      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Rows marked “Screenshot to review” have a payment screenshot — open the booking to verify or reject it. The rest haven't
          paid yet (or their screenshot was rejected): call them to help complete the payment or convert to an offline booking.
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState title="No pending payments." description="All bookings currently have completed or resolved payments." />
      ) : (
        <>
          <BookingsTable bookings={bookings} highlightMobile />
          <div className="mt-4">
            <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
