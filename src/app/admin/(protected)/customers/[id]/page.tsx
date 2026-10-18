"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Ban, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { VerificationPanel } from "@/components/admin/verification-panel";
import { BookingStatusBadge } from "@/components/admin/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatINR } from "@/lib/utils";
import type { AdminCustomer, AdminBookingListItem } from "@/types";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const [bookings, setBookings] = useState<AdminBookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ customer: AdminCustomer; bookings: AdminBookingListItem[] }>(`/admin/customers/${id}`);
      setCustomer(res.data.customer);
      setBookings(res.data.bookings);
    } catch (err) {
      toast({ title: "Could not load customer", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBlock = async () => {
    if (!customer) return;
    setBlocking(true);
    try {
      await apiFetch(`/admin/customers/${customer._id}/block-status`, {
        method: "PATCH",
        body: JSON.stringify({ isBlocked: !customer.isBlocked }),
      });
      toast({ title: customer.isBlocked ? "Customer unblocked" : "Customer blocked", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Could not update", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setBlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!customer) return <p className="text-sm text-navy-500">Customer not found.</p>;

  const showVerificationPanel = customer.verification.status === "PENDING" || customer.verification.status === "REJECTED";

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`Joined ${new Date(customer.createdAt).toLocaleDateString("en-IN")}`}
        action={
          <Button
            variant={customer.isBlocked ? "lime" : "outline"}
            onClick={toggleBlock}
            disabled={blocking}
            className={!customer.isBlocked ? "border-red-200 text-red-600 hover:border-red-600" : ""}
          >
            {blocking ? <Loader2 className="size-4 animate-spin" /> : customer.isBlocked ? <CheckCircle className="size-4" /> : <Ban className="size-4" />}
            {customer.isBlocked ? "Unblock Customer" : "Block Customer"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-navy-400">Mobile</dt>
                <dd className="font-semibold text-navy-900">{customer.mobile}</dd>
              </div>
              {customer.email && (
                <div>
                  <dt className="text-navy-400">Email</dt>
                  <dd className="font-semibold text-navy-900">{customer.email}</dd>
                </div>
              )}
              {(customer.address || customer.city) && (
                <div>
                  <dt className="text-navy-400">Address</dt>
                  <dd className="font-semibold text-navy-900">
                    {[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-navy-400">Account Status</dt>
                <dd className="mt-1">
                  <Badge variant={customer.isBlocked ? "destructive" : "success"}>{customer.isBlocked ? "Blocked" : "Active"}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-navy-400">Mobile Verified</dt>
                <dd className="font-semibold text-navy-900">{customer.isVerifiedMobile ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </Card>

          {showVerificationPanel && <VerificationPanel customer={customer} onReviewed={load} />}
        </div>

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Booking History</h2>
          {bookings.length === 0 ? (
            <EmptyState title="No bookings yet." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-navy-400">
                    <th className="pb-2 pr-4">Booking ID</th>
                    <th className="pb-2 pr-4">Car</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-t border-navy-50">
                      <td className="py-2.5 pr-4 font-medium text-navy-900">{b.bookingId}</td>
                      <td className="py-2.5 pr-4 text-navy-700">{b.car && typeof b.car === "object" ? b.car.name : <span className="text-navy-400">Car removed</span>}</td>
                      <td className="py-2.5 pr-4 text-navy-700">{formatINR(b.totalAmount)}</td>
                      <td className="py-2.5 pr-4">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link href={`/admin/bookings/${b._id}`} className="text-sm font-semibold text-brand-deep hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
