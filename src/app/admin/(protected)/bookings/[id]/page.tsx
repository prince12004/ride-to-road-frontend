"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, ExternalLink, Loader2, MessageCircle, Save, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { PaymentCollectionCard } from "@/components/admin/payment-collection";
import { ExtendBookingCard } from "@/components/admin/extend-booking";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatINR } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type AdminBookingDetail, type BookingHistoryEntry, type BookingStatus } from "@/types";

const EXTENDABLE: BookingStatus[] = ["CONFIRMED", "CAR_ASSIGNED", "ACTIVE"];
const PAYMENT_METHODS = [
  { value: "OFFLINE_CASH", label: "Cash" },
  { value: "OFFLINE_UPI", label: "UPI" },
  { value: "OFFLINE_OTHER", label: "Other" },
];

const STATUSES: BookingStatus[] = ["PAYMENT_PENDING", "PAYMENT_FAILED", "CONFIRMED", "CAR_ASSIGNED", "ACTIVE", "COMPLETED", "CANCELLED"];

function fmtDateTime(date: string) {
  return new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [history, setHistory] = useState<BookingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [cancelling, setCancelling] = useState(false);


  const [reviewingPayment, setReviewingPayment] = useState<"verify" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ booking: AdminBookingDetail; history: BookingHistoryEntry[] }>(`/admin/bookings/${id}`);
      setBooking(res.data.booking);
      setHistory(res.data.history);
      setNewStatus(res.data.booking.status);
      setNotes(res.data.booking.adminNotes ?? "");
    } catch (err) {
      toast({ title: "Could not load booking", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusUpdate = async () => {
    if (!booking) return;
    setSavingStatus(true);
    try {
      await apiFetch(`/admin/bookings/${booking._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, note: statusNote || undefined }),
      });
      toast({ title: "Status updated", variant: "success" });
      setStatusNote("");
      load();
    } catch (err) {
      toast({
        title: "Could not update status",
        description: err instanceof ApiClientError ? err.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleNotesSave = async () => {
    if (!booking) return;
    setSavingNotes(true);
    try {
      await apiFetch(`/admin/bookings/${booking._id}/notes`, { method: "PATCH", body: JSON.stringify({ note: notes }) });
      toast({ title: "Notes saved", variant: "success" });
    } catch (err) {
      toast({ title: "Could not save notes", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!booking) return;
    const isCod = booking.payment.method === "COD";
    if (!confirm(isCod ? `Mark ${formatINR(booking.totalAmount)} cash as received?` : "Confirm this UPI payment is received in the account?")) return;
    setReviewingPayment("verify");
    try {
      await apiFetch(`/admin/bookings/${booking._id}/payment/verify`, { method: "POST", body: JSON.stringify({}) });
      toast({ title: isCod ? "Cash payment recorded" : "Payment verified", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Could not verify payment", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setReviewingPayment(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!booking) return;
    if (rejectReason.trim().length < 3) {
      toast({ title: "Add a reason for the customer", variant: "error" });
      return;
    }
    setReviewingPayment("reject");
    try {
      await apiFetch(`/admin/bookings/${booking._id}/payment/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      toast({ title: "Payment rejected", description: "The customer can upload a new screenshot.", variant: "success" });
      setShowReject(false);
      setRejectReason("");
      load();
    } catch (err) {
      toast({ title: "Could not reject payment", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setReviewingPayment(null);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    setCancelling(true);
    try {
      await apiFetch(`/admin/bookings/${booking._id}/cancel`, { method: "POST", body: JSON.stringify({}) });
      toast({ title: "Booking cancelled", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Could not cancel", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!booking) return <p className="text-sm text-navy-500">Booking not found.</p>;

  const whatsappHref = `https://wa.me/91${booking.mobile}?text=${encodeURIComponent(
    `Hi ${booking.customerName}, this is Ride to Road regarding your booking ${booking.bookingId}.`,
  )}`;

  return (
    <div>
      <PageHeader
        title={`Booking ${booking.bookingId}`}
        description={`Created ${fmtDateTime(booking.createdAt)} · Source: ${booking.source === "ADMIN_OFFLINE" ? "Offline (Admin)" : "Online"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="whatsapp">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> WhatsApp Customer
              </a>
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/bookings")}>
              Back to list
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Customer & Car</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-navy-400">Customer</dt>
                <dd className="font-semibold text-navy-900">{booking.customerName}</dd>
                {booking.user?._id && (
                  <dd className="mt-0.5">
                    <Link href={`/admin/customers/${booking.user._id}`} className="text-xs font-semibold text-brand-deep hover:underline">
                      View profile &amp; KYC documents →
                    </Link>
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-navy-400">Mobile</dt>
                <dd className="font-semibold text-navy-900">{booking.mobile}</dd>
              </div>
              {booking.email && (
                <div>
                  <dt className="text-navy-400">Email</dt>
                  <dd className="font-semibold text-navy-900">{booking.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-navy-400">Car</dt>
                <dd className="font-semibold text-navy-900">
                  {booking.car?.name ?? <span className="text-navy-400">Car removed from fleet</span>}
                </dd>
              </div>
              <div>
                <dt className="text-navy-400">Pickup Location</dt>
                <dd className="font-semibold text-navy-900">
                  {booking.pickupLocation ? `${booking.pickupLocation.city}, ${booking.pickupLocation.region}` : "Location removed"}
                </dd>
              </div>
              <div>
                <dt className="text-navy-400">Drop Location</dt>
                <dd className="font-semibold text-navy-900">
                  {booking.dropLocation ? `${booking.dropLocation.city}, ${booking.dropLocation.region}` : "Location removed"}
                </dd>
              </div>
              <div>
                <dt className="text-navy-400">Pickup</dt>
                <dd className="font-semibold text-navy-900">
                  {new Date(booking.pickupDate).toLocaleDateString("en-IN")} · {booking.pickupTime}
                </dd>
              </div>
              <div>
                <dt className="text-navy-400">Drop</dt>
                <dd className="font-semibold text-navy-900">
                  {new Date(booking.dropDate).toLocaleDateString("en-IN")} · {booking.dropTime}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-navy-400">Pickup / Delivery</dt>
                {booking.homeDelivery?.requested ? (
                  <dd className="mt-1 rounded-2xl border border-lime/50 bg-lime/10 p-3">
                    <span className="block text-xs font-bold uppercase tracking-wide text-brand-deep">
                      Home delivery · {formatINR(booking.homeDelivery.fee)}
                    </span>
                    <span className="mt-1 block whitespace-pre-line font-semibold text-navy-900">
                      {booking.homeDelivery.address || "No address on file — call the customer."}
                    </span>
                  </dd>
                ) : (
                  <dd className="font-semibold text-navy-900">Self pickup</dd>
                )}
              </div>
              {booking.specialRequest && (
                <div className="col-span-2">
                  <dt className="text-navy-400">Special Request</dt>
                  <dd className="text-navy-800">{booking.specialRequest}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Price Breakdown</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-navy-500">Base Amount</dt>
                <dd className="font-medium text-navy-900">{formatINR(booking.baseAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Additional Charges</dt>
                <dd className="font-medium text-navy-900">{formatINR(booking.additionalCharges)}</dd>
              </div>
              {!!booking.extensionCharges && (
                <div className="flex justify-between">
                  <dt className="text-navy-500">Extension Charges</dt>
                  <dd className="font-medium text-navy-900">{formatINR(booking.extensionCharges)}</dd>
                </div>
              )}
              {!!booking.securityDeposit && (
                <div className="flex justify-between">
                  <dt className="text-navy-500">Security Deposit (refundable)</dt>
                  <dd className="font-medium text-navy-900">{formatINR(booking.securityDeposit)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-navy-500">Tax</dt>
                <dd className="font-medium text-navy-900">{formatINR(booking.taxAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Discount {booking.coupon ? `(${booking.coupon.code})` : ""}</dt>
                <dd className="font-medium text-brand-deep">- {formatINR(booking.discountAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-navy-100 pt-2 text-base font-bold text-navy-900">
                <dt>Total</dt>
                <dd>{formatINR(booking.totalAmount)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Payment Info</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-navy-400">Status</dt>
                <dd className="mt-1">
                  <PaymentStatusBadge status={booking.payment.status} />
                </dd>
              </div>
              <div>
                <dt className="text-navy-400">Method</dt>
                <dd className="font-semibold text-navy-900">{booking.payment.method ? PAYMENT_METHOD_LABELS[booking.payment.method] ?? booking.payment.method : "—"}</dd>
              </div>
              {booking.payment.razorpayOrderId && (
                <div>
                  <dt className="text-navy-400">Razorpay Order ID</dt>
                  <dd className="break-all font-mono text-xs text-navy-900">{booking.payment.razorpayOrderId}</dd>
                </div>
              )}
              {booking.payment.razorpayPaymentId && (
                <div>
                  <dt className="text-navy-400">Razorpay Payment ID</dt>
                  <dd className="break-all font-mono text-xs text-navy-900">{booking.payment.razorpayPaymentId}</dd>
                </div>
              )}
              {booking.payment.paidAt && (
                <div>
                  <dt className="text-navy-400">Paid At</dt>
                  <dd className="font-semibold text-navy-900">{fmtDateTime(booking.payment.paidAt)}</dd>
                </div>
              )}
              {booking.payment.failureReason && (
                <div className="col-span-2">
                  <dt className="text-navy-400">Failure Reason</dt>
                  <dd className="text-red-600">{booking.payment.failureReason}</dd>
                </div>
              )}
            </dl>

            {booking.payment.method === "UPI_QR" && (
              <div className="mt-5 border-t border-navy-100 pt-5">
                <p className="text-sm font-semibold text-navy-900">Payment screenshot</p>
                {booking.payment.proof?.url ? (
                  <a
                    href={booking.payment.proof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-3 block w-fit overflow-hidden rounded-2xl border border-navy-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={booking.payment.proof.url} alt="Customer's UPI payment screenshot" className="max-h-80 w-auto object-contain" />
                    <span className="flex items-center justify-center gap-1.5 bg-navy-50 p-2 text-xs font-semibold text-navy-700 group-hover:text-navy-900">
                      <ExternalLink className="size-3.5" /> Open full size · uploaded {fmtDateTime(booking.payment.proof.uploadedAt)}
                    </span>
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-navy-400">The customer hasn't uploaded a screenshot yet.</p>
                )}
              </div>
            )}

            {booking.payment.method === "UPI_QR" &&
              booking.payment.status !== "PAID" &&
              booking.payment.status !== "PARTIALLY_PAID" &&
              booking.status !== "CANCELLED" && (
                <div className="mt-5 space-y-3 border-t border-navy-100 pt-5">
                  {showReject && (
                    <Textarea
                      placeholder="Reason shown to the customer, e.g. amount doesn't match"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      autoFocus
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {!showReject && (
                      <Button
                        type="button"
                        onClick={handleVerifyPayment}
                        disabled={reviewingPayment !== null || (booking.payment.method === "UPI_QR" && !booking.payment.proof?.url)}
                      >
                        {reviewingPayment === "verify" ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                        Verify Payment
                      </Button>
                    )}
                    {booking.payment.method === "UPI_QR" && booking.payment.proof?.url && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:border-red-600"
                        onClick={showReject ? handleRejectPayment : () => setShowReject(true)}
                        disabled={reviewingPayment !== null}
                      >
                        {reviewingPayment === "reject" ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                        {showReject ? "Confirm Rejection" : "Reject"}
                      </Button>
                    )}
                    {showReject && (
                      <Button type="button" variant="outline" onClick={() => setShowReject(false)}>
                        Back
                      </Button>
                    )}
                  </div>
                </div>
              )}
          </Card>

          <PaymentCollectionCard booking={booking} onRecorded={load} />

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Admin Notes</h2>
            <Textarea className="mt-3" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this booking..." />
            <Button type="button" size="sm" className="mt-3" onClick={handleNotesSave} disabled={savingNotes}>
              {savingNotes ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Notes
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Current Status</h2>
            <div className="mt-3">
              <BookingStatusBadge status={booking.status} />
            </div>

            <div className="mt-5 space-y-3 border-t border-navy-100 pt-5">
              <Label>Update Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="Note (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
              <Button type="button" className="w-full" onClick={handleStatusUpdate} disabled={savingStatus || newStatus === booking.status}>
                {savingStatus && <Loader2 className="size-4 animate-spin" />}
                Update Status
              </Button>
            </div>

            {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full border-red-200 text-red-600 hover:border-red-600"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                Cancel Booking
              </Button>
            )}
          </Card>

          {EXTENDABLE.includes(booking.status) && <ExtendBookingCard key={booking.dropDate} booking={booking} onExtended={load} />}

          {!!booking.extensions?.length && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">Extensions</h2>
              <ul className="mt-4 space-y-4">
                {booking.extensions.map((ext) => (
                  <li key={ext._id} className="rounded-2xl border border-navy-100 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-navy-900">+{formatINR(ext.amount)}</span>
                      <span
                        className={
                          ext.paymentStatus === "PAID"
                            ? "rounded-full bg-lime/20 px-2.5 py-0.5 text-xs font-semibold text-brand-deep"
                            : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                        }
                      >
                        {ext.paymentStatus === "PAID"
                          ? `Collected${ext.paymentMethod ? ` · ${PAYMENT_METHODS.find((m) => m.value === ext.paymentMethod)?.label ?? ext.paymentMethod}` : ""}`
                          : "Added to balance"}
                      </span>
                    </div>
                    <p className="mt-2 text-navy-600">
                      {fmtDateTime(ext.previousDropAt)} → {fmtDateTime(ext.newDropAt)} ({ext.extraHours} hrs)
                    </p>
                    {ext.note && <p className="mt-1 text-navy-500">{ext.note}</p>}
                    <p className="mt-1 text-xs text-navy-400">Added {fmtDateTime(ext.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Status History</h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-navy-400">No history yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {history.map((h) => (
                  <li key={h._id} className="border-l-2 border-navy-100 pl-3">
                    <BookingStatusBadge status={h.status} />
                    {h.note && <p className="mt-1.5 text-sm text-navy-700">{h.note}</p>}
                    <p className="mt-1 text-xs text-navy-400">
                      {fmtDateTime(h.createdAt)} {h.changedByAdmin && `· ${h.changedByAdmin.name}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
