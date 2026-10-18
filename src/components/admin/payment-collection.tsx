"use client";

import { useState } from "react";
import { Banknote, Loader2, Plus, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PaymentStatusBadge } from "@/components/admin/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatINR } from "@/lib/utils";
import type { AdminBookingDetail } from "@/types";

function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function fmt(date: string) {
  return new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Amount received so far — older paid bookings have no running total stored. */
function receivedSoFar(b: AdminBookingDetail) {
  if (typeof b.payment.amountReceived === "number") return b.payment.amountReceived;
  return b.payment.status === "PAID" ? b.payment.amount ?? b.totalAmount : 0;
}

/**
 * Records money received against a booking: cash, online (UPI etc. with a
 * UTR / transaction id), or both together. The API keeps the status in step:
 * Pending → Partially Paid → Fully Paid.
 */
export function PaymentCollectionCard({ booking, onRecorded }: { booking: AdminBookingDetail; onRecorded: () => void }) {
  const received = receivedSoFar(booking);
  const balance = Math.max(0, booking.totalAmount - received);
  const collections = booking.payment.collections ?? [];

  const [open, setOpen] = useState(false);
  const [cash, setCash] = useState("");
  const [online, setOnline] = useState("");
  const [reference, setReference] = useState("");
  const [receivedAt, setReceivedAt] = useState(nowLocalInput);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cashNum = Number(cash || 0);
  const onlineNum = Number(online || 0);
  const entering = cashNum + onlineNum;

  const reset = () => {
    setCash("");
    setOnline("");
    setReference("");
    setNote("");
    setReceivedAt(nowLocalInput());
    setError("");
  };

  const validate = (): string => {
    if (![cash, online].every((v) => v === "" || /^\d+$/.test(v))) return "Enter amounts in whole rupees.";
    if (entering <= 0) return "Enter the cash and/or online amount received.";
    if (entering > balance) return `That's ${formatINR(entering)}, but only ${formatINR(balance)} is due.`;
    if (onlineNum > 0 && !/^[A-Za-z0-9-]{4,60}$/.test(reference.trim())) return "Enter the UTR / transaction ID for the online payment.";
    if (receivedAt && new Date(receivedAt).getTime() > Date.now() + 5 * 60 * 1000) return "Payment date/time can't be in the future.";
    return "";
  };

  const handleSave = async () => {
    const problem = validate();
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/bookings/${booking._id}/payment/collect`, {
        method: "POST",
        body: JSON.stringify({
          cashAmount: cashNum || undefined,
          onlineAmount: onlineNum || undefined,
          reference: onlineNum > 0 ? reference.trim() : undefined,
          receivedAt: receivedAt ? new Date(receivedAt).toISOString() : undefined,
          note: note.trim() || undefined,
        }),
      });
      toast({ title: "Payment recorded", variant: "success" });
      reset();
      setOpen(false);
      onRecorded();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not record the payment. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-navy-900">Payment Collection</h2>
        <PaymentStatusBadge status={booking.payment.status} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-2xl bg-navy-50 p-3">
          <dt className="text-xs text-navy-400">Total amount</dt>
          <dd className="mt-0.5 font-display text-lg font-bold text-navy-900">{formatINR(booking.totalAmount)}</dd>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3">
          <dt className="text-xs text-emerald-700">Received</dt>
          <dd className="mt-0.5 font-display text-lg font-bold text-emerald-800">{formatINR(received)}</dd>
        </div>
        <div className={balance > 0 ? "rounded-2xl bg-amber-50 p-3" : "rounded-2xl bg-navy-50 p-3"}>
          <dt className={balance > 0 ? "text-xs text-amber-700" : "text-xs text-navy-400"}>Balance due</dt>
          <dd className={balance > 0 ? "mt-0.5 font-display text-lg font-bold text-amber-800" : "mt-0.5 font-display text-lg font-bold text-navy-900"}>
            {formatINR(balance)}
          </dd>
        </div>
      </dl>

      {collections.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <p className="text-sm font-semibold text-navy-900">Payment history</p>
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="py-2 pr-3">Received</th>
                <th className="py-2 pr-3">Mode</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2">UTR / Ref.</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c._id} className="border-b border-navy-50 align-top last:border-0">
                  <td className="py-2 pr-3 text-navy-600">{fmt(c.receivedAt)}</td>
                  <td className="py-2 pr-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-navy-900">
                      {c.mode === "CASH" ? <Banknote className="size-3.5" /> : <Smartphone className="size-3.5" />}
                      {c.mode === "CASH" ? "Cash" : "Online"}
                    </span>
                    {c.note && <span className="block text-xs text-navy-400">{c.note}</span>}
                  </td>
                  <td className="py-2 pr-3 font-semibold text-navy-900">{formatINR(c.amount)}</td>
                  <td className="break-all py-2 font-mono text-xs text-navy-700">{c.reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {booking.status !== "CANCELLED" && balance > 0 && (
        <div className="mt-5 border-t border-navy-100 pt-5">
          {!open ? (
            <Button type="button" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Record Payment
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pc-cash">Cash received (₹)</Label>
                  <Input id="pc-cash" className="mt-1.5" inputMode="numeric" placeholder="0" value={cash} onChange={(e) => setCash(e.target.value.trim())} />
                </div>
                <div>
                  <Label htmlFor="pc-online">Online received (₹)</Label>
                  <Input id="pc-online" className="mt-1.5" inputMode="numeric" placeholder="0" value={online} onChange={(e) => setOnline(e.target.value.trim())} />
                </div>
              </div>
              {onlineNum > 0 && (
                <div>
                  <Label htmlFor="pc-ref">UTR / Transaction ID</Label>
                  <Input id="pc-ref" className="mt-1.5 font-mono" placeholder="e.g. 428615937204" value={reference} onChange={(e) => setReference(e.target.value)} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pc-at">Received on</Label>
                  <Input id="pc-at" type="datetime-local" className="mt-1.5" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
                </div>
                <div className="rounded-2xl bg-navy-50 p-3 text-sm">
                  <p className="text-xs text-navy-400">After this entry</p>
                  <p className="font-semibold text-navy-900">
                    {entering > 0 ? (entering >= balance ? "Fully Paid" : `Partially Paid · ${formatINR(balance - entering)} due`) : `${formatINR(balance)} due`}
                  </p>
                </div>
              </div>
              <Textarea placeholder="Note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />} Save Payment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
