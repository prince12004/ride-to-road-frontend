"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatINR } from "@/lib/utils";
import type { AdminBookingDetail } from "@/types";

interface Quote {
  extraHours: number;
  amount: number;
  dailyRate: number;
  rates: { pricePerHour?: number; pricePerDay: number; weeklyPrice?: number; monthlyPrice?: number };
  fromBookingRates: boolean;
  newTotal: number;
  balanceAfter: number;
}

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function toTimeInput(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmt(date: string | Date) {
  return new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Extends a booking. The charge is calculated by the API from the rates the
 * customer originally booked at and previewed here before confirming.
 */
export function ExtendBookingCard({ booking, onExtended }: { booking: AdminBookingDetail; onExtended: () => void }) {
  const currentDrop = new Date(booking.dropDate);
  const [date, setDate] = useState(() => toDateInput(new Date(currentDrop.getTime() + 24 * 60 * 60 * 1000)));
  const [time, setTime] = useState(() => toTimeInput(currentDrop));
  const [override, setOverride] = useState("");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-price whenever the new drop date/time changes.
  useEffect(() => {
    if (!date || !time) return;
    let cancelled = false;
    setQuoting(true);
    const timer = setTimeout(() => {
      apiFetch<Quote>(`/admin/bookings/${booking._id}/extend/quote`, {
        method: "POST",
        body: JSON.stringify({ dropDate: date, dropTime: time }),
      })
        .then((res) => {
          if (cancelled) return;
          setQuote(res.data);
          setQuoteError("");
        })
        .catch((err) => {
          if (cancelled) return;
          setQuote(null);
          setQuoteError(err instanceof ApiClientError ? err.message : "Could not calculate the extension.");
        })
        .finally(() => !cancelled && setQuoting(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [booking._id, booking.dropDate, date, time]);

  const overrideNum = override.trim() === "" ? undefined : Number(override);
  const finalAmount = overrideNum ?? quote?.amount ?? 0;

  const handleExtend = async () => {
    if (!quote) return;
    if (overrideNum !== undefined && (!Number.isFinite(overrideNum) || overrideNum < 0)) {
      toast({ title: "Enter a valid amount", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/admin/bookings/${booking._id}/extend`, {
        method: "POST",
        body: JSON.stringify({ dropDate: date, dropTime: time, amount: overrideNum, note: note.trim() || undefined }),
      });
      toast({ title: "Booking extended", description: `${formatINR(finalAmount)} added to the balance.`, variant: "success" });
      setOverride("");
      setNote("");
      onExtended();
    } catch (err) {
      toast({ title: "Could not extend booking", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
        <CalendarPlus className="size-5 text-brand-deep" /> Extend Booking
      </h2>
      <p className="mt-1 text-sm text-navy-500">Current drop: {fmt(currentDrop)}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label>New Drop Date</Label>
          <Input type="date" className="mt-1.5" value={date} min={toDateInput(currentDrop)} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>New Drop Time</Label>
          <Input type="time" className="mt-1.5" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-navy-100 bg-navy-50 p-4 text-sm">
        {quoting ? (
          <p className="flex items-center gap-2 text-navy-500">
            <Loader2 className="size-4 animate-spin" /> Calculating…
          </p>
        ) : quoteError ? (
          <p className="text-red-600">{quoteError}</p>
        ) : quote ? (
          <dl className="space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-navy-500">Extension</dt>
              <dd className="font-semibold text-navy-900">
                +{quote.extraHours} hrs ({Math.floor(quote.extraHours / 24)}d {quote.extraHours % 24}h)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy-500">Rate applied</dt>
              <dd className="text-right font-semibold text-navy-900">
                {formatINR(quote.dailyRate)}/day{quote.rates.pricePerHour ? ` · ${formatINR(quote.rates.pricePerHour)}/hr` : ""}
                <span className="block text-xs font-normal text-navy-400">
                  {quote.fromBookingRates ? "Original booking rate" : "Car's current rate (older booking)"}
                </span>
              </dd>
            </div>
            <div className="flex justify-between border-t border-navy-200 pt-1.5">
              <dt className="font-semibold text-navy-900">Extension charge</dt>
              <dd className="font-display text-base font-bold text-navy-900">{formatINR(quote.amount)}</dd>
            </div>
            <div className="flex justify-between text-xs text-navy-500">
              <dt>New total · balance due after</dt>
              <dd>
                {formatINR(booking.totalAmount + finalAmount)} · {formatINR(quote.balanceAfter - quote.amount + finalAmount)}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="mt-3">
        <Label>Override amount (₹) · optional</Label>
        <Input
          type="number"
          min={0}
          className="mt-1.5"
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          placeholder={quote ? `Calculated: ${quote.amount}` : "Leave blank to use the calculated amount"}
        />
      </div>
      <Textarea className="mt-3" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="button" className="mt-3 w-full" onClick={handleExtend} disabled={saving || quoting || !quote}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
        Extend & add {formatINR(finalAmount)}
      </Button>
      <p className="mt-2 text-center text-xs text-navy-400">Record the money received for the extension under Payment Collection.</p>
    </Card>
  );
}
