"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText, Gauge, Loader2, Pencil, Trash2, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatDateTimeIST, formatINR, istDateInput, istTimeInput } from "@/lib/utils";
import { formatDuration, MIN_RENTAL_HOURS } from "@/lib/pricing";
import type { AdminBookingDetail, AdminLocationDoc, BookingCustomer, BookingSummary } from "@/types";

const errMsg = (err: unknown, fallback = "Try again.") => (err instanceof ApiClientError ? err.message : fallback);

/** Aadhaar first, then DL, then anything else — the order used on the printed form too. */
export function sortDocuments<T extends { type: string }>(docs: T[]): T[] {
  const rank = (t: string) => (t.startsWith("Aadhaar") ? 0 : t.startsWith("Driving") ? 1 : 2) * 10 + (t.includes("Back") ? 1 : 0);
  return [...docs].sort((a, b) => rank(a.type) - rank(b.type));
}

export function CustomerDocumentsCard({ customer }: { customer: BookingCustomer | null }) {
  if (!customer) {
    return (
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Customer Documents</h2>
        <p className="mt-2 text-sm text-navy-500">
          No customer account matches this booking&apos;s mobile number, so there are no uploaded documents. Collect copies at pickup.
        </p>
      </Card>
    );
  }
  const docs = sortDocuments(customer.documents);
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-navy-900">Customer Documents</h2>
        <Link href={`/admin/customers/${customer._id}`} className="text-xs font-semibold text-brand-deep hover:underline">
          Open customer profile →
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-3">
        {customer.profileImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={customer.profileImage.url} alt={customer.name} className="size-14 rounded-2xl object-cover" />
        ) : (
          <span className="grid size-14 place-items-center rounded-2xl bg-navy-50 text-navy-400">
            <UserRound className="size-6" />
          </span>
        )}
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-navy-900">{customer.name}</p>
          <p className="text-navy-500">
            {customer.mobile}
            {customer.email ? ` · ${customer.email}` : ""}
          </p>
          <p className="text-xs text-navy-400">
            KYC: {customer.verificationStatus?.replace(/_/g, " ") ?? "NOT SUBMITTED"}
            {customer.matchedBy === "mobile" && " · matched by mobile number"}
          </p>
        </div>
      </div>
      {docs.length === 0 ? (
        <p className="mt-4 text-sm text-navy-500">The customer hasn&apos;t uploaded any documents yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {docs.map((d) => (
            <a
              key={d.type}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-2xl border border-navy-100 transition-colors hover:border-navy-900"
            >
              {d.isPdf ? (
                <span className="grid aspect-[4/3] place-items-center bg-navy-50 text-navy-400">
                  <FileText className="size-8" />
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.url} alt={d.type} className="aspect-[4/3] w-full bg-navy-50 object-cover" loading="lazy" />
              )}
              <span className="flex items-center justify-between gap-1 p-2 text-xs font-semibold text-navy-700 group-hover:text-navy-900">
                <span className="truncate">{d.type}</span>
                <ExternalLink className="size-3 shrink-0" />
              </span>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

/** Edits customer and trip details. A new schedule is re-priced by the API at the booking's own rates. */
export function EditBookingButton({ booking, onSaved }: { booking: AdminBookingDetail; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<AdminLocationDoc[]>([]);
  const init = () => ({
    customerName: booking.customerName,
    mobile: booking.mobile,
    email: booking.email ?? "",
    address: booking.address ?? "",
    specialRequest: booking.specialRequest ?? "",
    pickupLocationId: booking.pickupLocation?._id ?? "",
    deliveryAddress: booking.homeDelivery?.address ?? "",
    pickupDate: istDateInput(booking.pickupDate),
    pickupTime: istTimeInput(booking.pickupDate),
    dropDate: istDateInput(booking.dropDate),
    dropTime: istTimeInput(booking.dropDate),
  });
  const [v, setV] = useState(init);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && !locations.length) apiFetch<AdminLocationDoc[]>("/admin/locations").then((r) => setLocations(r.data)).catch(() => {});
  }, [open, locations.length]);

  const set = (k: keyof ReturnType<typeof init>, val: string) => setV((s) => ({ ...s, [k]: val }));
  const hours = Math.ceil(
    (new Date(`${v.dropDate}T${v.dropTime}:00+05:30`).getTime() - new Date(`${v.pickupDate}T${v.pickupTime}:00+05:30`).getTime()) / 3_600_000,
  );
  const scheduleChanged = ["pickupDate", "pickupTime", "dropDate", "dropTime"].some(
    (k) => v[k as keyof typeof v] !== init()[k as keyof typeof v],
  );

  const save = async () => {
    if (v.customerName.trim().length < 2) return setError("Enter the customer's name.");
    if (!/^[6-9]\d{9}$/.test(v.mobile.trim())) return setError("Enter a valid 10-digit mobile number.");
    if (scheduleChanged && !(hours >= MIN_RENTAL_HOURS)) return setError(`Minimum rental duration is ${MIN_RENTAL_HOURS} hours.`);
    if (booking.homeDelivery?.requested && v.deliveryAddress.trim().length < 10) return setError("Enter the complete delivery address.");
    setError("");
    setSaving(true);
    try {
      const res = await apiFetch<unknown>(`/admin/bookings/${booking._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          customerName: v.customerName,
          mobile: v.mobile,
          email: v.email,
          address: v.address,
          specialRequest: v.specialRequest,
          pickupLocationId: v.pickupLocationId || undefined,
          deliveryAddress: booking.homeDelivery?.requested ? v.deliveryAddress : undefined,
          ...(scheduleChanged ? { pickupDate: v.pickupDate, pickupTime: v.pickupTime, dropDate: v.dropDate, dropTime: v.dropTime } : {}),
        }),
      });
      toast({ title: res.message === "Nothing changed." ? "Nothing changed" : "Booking updated", variant: "success" });
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(errMsg(err, "Could not update the booking."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setV(init());
          setError("");
        }
      }}
    >
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" /> Edit
      </Button>
      <DialogContent title={`Edit ${booking.bookingId}`} description="Changes are saved to the booking history." className="max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Customer name</Label>
            <Input className="mt-1.5" value={v.customerName} onChange={(e) => set("customerName", e.target.value)} />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input className="mt-1.5" inputMode="numeric" maxLength={10} value={v.mobile} onChange={(e) => set("mobile", e.target.value.trim())} />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1.5" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <Label>Pickup location</Label>
            <Select value={v.pickupLocationId} onValueChange={(val) => set("pickupLocationId", val)}>
              <SelectTrigger className="mt-1.5 h-11 rounded-xl border border-navy-200 px-3">
                <SelectValue placeholder={booking.pickupLocation?.city ?? "Select"} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l._id} value={l._id}>
                    {l.city}, {l.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Customer address</Label>
            <Input className="mt-1.5" value={v.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          {booking.homeDelivery?.requested && (
            <div className="sm:col-span-2">
              <Label>Delivery address</Label>
              <Textarea className="mt-1.5" rows={2} value={v.deliveryAddress} onChange={(e) => set("deliveryAddress", e.target.value)} />
            </div>
          )}
          <div>
            <Label>Pickup date</Label>
            <Input className="mt-1.5" type="date" value={v.pickupDate} onChange={(e) => set("pickupDate", e.target.value)} />
          </div>
          <div>
            <Label>Pickup time</Label>
            <Input className="mt-1.5" type="time" value={v.pickupTime} onChange={(e) => set("pickupTime", e.target.value)} />
          </div>
          <div>
            <Label>Return date</Label>
            <Input className="mt-1.5" type="date" value={v.dropDate} onChange={(e) => set("dropDate", e.target.value)} />
          </div>
          <div>
            <Label>Return time</Label>
            <Input className="mt-1.5" type="time" value={v.dropTime} onChange={(e) => set("dropTime", e.target.value)} />
          </div>
          {scheduleChanged && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 sm:col-span-2">
              New duration: <b>{Number.isFinite(hours) && hours > 0 ? formatDuration(hours) : "—"}</b>. The rental is re-priced at this booking&apos;s
              original rates and the car&apos;s availability is checked. Use &ldquo;Extend Booking&rdquo; for a simple extension.
            </p>
          )}
          <div className="sm:col-span-2">
            <Label>Special request</Label>
            <Textarea className="mt-1.5" rows={2} value={v.specialRequest} onChange={(e) => set("specialRequest", e.target.value)} />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Soft delete with a reason. Payments and history stay in the database. */
export function DeleteBookingButton({ booking }: { booking: AdminBookingDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    if (reason.trim().length < 3) return setError("Give a reason for deleting this booking.");
    setDeleting(true);
    try {
      await apiFetch(`/admin/bookings/${booking._id}`, { method: "DELETE", body: JSON.stringify({ reason: reason.trim() }) });
      toast({ title: "Booking deleted", variant: "success" });
      router.push("/admin/bookings");
    } catch (err) {
      setError(errMsg(err, "Could not delete the booking."));
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:border-red-600" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> Delete
      </Button>
      <DialogContent
        title={`Delete booking ${booking.bookingId}?`}
        description="It will be removed from the admin panel and the customer's account. Payment records and history are kept."
      >
        {["CONFIRMED", "CAR_ASSIGNED", "ACTIVE", "PAYMENT_PENDING"].includes(booking.status) && (
          <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">This booking is still open — it will be cancelled and the car freed.</p>
        )}
        <Label>Reason</Label>
        <Textarea className="mt-1.5" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Duplicate booking" autoFocus />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Keep booking
          </Button>
          <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={remove} disabled={deleting}>
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/**
 * Closes a booking when the car is returned: km driven (or odometer readings)
 * → extra km at the booking's own rate, plus any other charges.
 */
export function CloseBookingCard({ booking, summary, onClosed }: { booking: AdminBookingDetail; summary: BookingSummary; onClosed: () => void }) {
  const [mode, setMode] = useState<"odometer" | "km">("odometer");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [km, setKm] = useState("");
  const [other, setOther] = useState("");
  const [otherNote, setOtherNote] = useState("");
  const [closedAt, setClosedAt] = useState(nowLocalInput);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const driven = mode === "odometer" ? (start !== "" && end !== "" ? Number(end) - Number(start) : NaN) : km !== "" ? Number(km) : NaN;
  const extraKm = Number.isFinite(driven) ? Math.max(0, Math.round(driven) - summary.includedKm) : 0;
  const extraCharge = Math.round(extraKm * summary.extraKmRate);
  const otherNum = other === "" ? 0 : Number(other);
  const newTotal = booking.totalAmount + extraCharge + (Number.isFinite(otherNum) ? otherNum : 0);
  const balanceAfter = Math.max(0, newTotal - summary.amountReceived);

  const close = async () => {
    if (!Number.isFinite(driven) || driven < 0) return setError(mode === "odometer" ? "Enter valid start and end odometer readings." : "Enter the km driven.");
    if (!Number.isInteger(otherNum) || otherNum < 0) return setError("Other charges must be a whole, non-negative amount.");
    if (!confirm(`Close booking ${booking.bookingId}?\n\n${Math.round(driven)} km driven, ${extraKm} extra km = ${formatINR(extraCharge)}\nNew total ${formatINR(newTotal)} · balance ${formatINR(balanceAfter)}`)) return;
    setError("");
    setSaving(true);
    try {
      await apiFetch(`/admin/bookings/${booking._id}/close`, {
        method: "POST",
        body: JSON.stringify({
          ...(mode === "odometer" ? { odometerStart: Number(start), odometerEnd: Number(end) } : { kmDriven: Number(km) }),
          otherCharges: otherNum || undefined,
          otherChargesNote: otherNote.trim() || undefined,
          closedAt: closedAt ? new Date(closedAt).toISOString() : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      toast({ title: "Booking closed", description: balanceAfter > 0 ? `${formatINR(balanceAfter)} still to collect.` : "Fully settled.", variant: "success" });
      onClosed();
    } catch (err) {
      setError(errMsg(err, "Could not close the booking."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
        <Gauge className="size-5 text-brand-deep" /> Close Booking
      </h2>
      <p className="mt-1 text-sm text-navy-500">
        {summary.includedKm.toLocaleString("en-IN")} km included ({summary.kmPerDay} km / 24 hrs) · extra {formatINR(summary.extraKmRate)}/km
      </p>
      <div className="mt-4 flex gap-2">
        {(["odometer", "km"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={
              "rounded-xl border px-3 py-1.5 text-xs font-semibold " +
              (mode === m ? "border-navy-900 bg-navy-900 text-white" : "border-navy-200 text-navy-600")
            }
          >
            {m === "odometer" ? "Odometer readings" : "KM driven"}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {mode === "odometer" ? (
          <>
            <div>
              <Label>Start reading</Label>
              <Input className="mt-1.5" inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value.trim())} />
            </div>
            <div>
              <Label>End reading</Label>
              <Input className="mt-1.5" inputMode="numeric" value={end} onChange={(e) => setEnd(e.target.value.trim())} />
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <Label>KM driven</Label>
            <Input className="mt-1.5" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.trim())} />
          </div>
        )}
        <div>
          <Label>Other charges (₹)</Label>
          <Input className="mt-1.5" inputMode="numeric" placeholder="0" value={other} onChange={(e) => setOther(e.target.value.trim())} />
        </div>
        <div>
          <Label>For</Label>
          <Input className="mt-1.5" placeholder="e.g. fuel, toll" value={otherNote} onChange={(e) => setOtherNote(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Closed on</Label>
          <Input className="mt-1.5" type="datetime-local" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} />
        </div>
      </div>
      <dl className="mt-3 space-y-1 rounded-2xl bg-navy-50 p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-navy-500">KM driven</dt>
          <dd className="font-semibold text-navy-900">{Number.isFinite(driven) && driven >= 0 ? `${Math.round(driven)} km` : "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-navy-500">Extra km × rate</dt>
          <dd className="font-semibold text-navy-900">
            {extraKm} × {formatINR(summary.extraKmRate)} = {formatINR(extraCharge)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-navy-200 pt-1.5">
          <dt className="text-navy-500">New total · balance</dt>
          <dd className="font-bold text-navy-900">
            {formatINR(newTotal)} · {formatINR(balanceAfter)}
          </dd>
        </div>
      </dl>
      <Textarea className="mt-3" rows={2} placeholder="Closure notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <Button type="button" className="mt-3 w-full" onClick={close} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Close &amp; complete booking
      </Button>
    </Card>
  );
}

export function ClosureDetails({ closure }: { closure: NonNullable<AdminBookingDetail["closure"]> }) {
  const rows: [string, string][] = [
    ["Closed on", formatDateTimeIST(closure.closedAt)],
    ...(closure.odometerStart != null && closure.odometerEnd != null
      ? ([["Odometer", `${closure.odometerStart} → ${closure.odometerEnd}`]] as [string, string][])
      : []),
    ["KM driven", `${closure.kmDriven} km (${closure.includedKm} included)`],
    ["Extra km charge", `${closure.extraKm} km · ${formatINR(closure.extraKmCharge)}`],
    ...(closure.otherCharges
      ? ([["Other charges", `${formatINR(closure.otherCharges)}${closure.otherChargesNote ? ` (${closure.otherChargesNote})` : ""}`]] as [string, string][])
      : []),
    ...(typeof closure.closedBy === "object" && closure.closedBy ? ([["Closed by", closure.closedBy.name]] as [string, string][]) : []),
  ];
  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-bold text-navy-900">Closure</h2>
      <dl className="mt-3 space-y-1.5 text-sm">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-navy-500">{k}</dt>
            <dd className="text-right font-semibold text-navy-900">{val}</dd>
          </div>
        ))}
      </dl>
      {closure.notes && <p className="mt-3 text-sm text-navy-600">{closure.notes}</p>}
    </Card>
  );
}
