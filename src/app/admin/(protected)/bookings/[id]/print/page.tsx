"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api";
import { formatDateTimeIST, formatINR } from "@/lib/utils";
import { formatDuration } from "@/lib/pricing";
import { siteConfig } from "@/config/site";
import { RENTAL_TERMS } from "@/config/rental-terms";
import { sortDocuments } from "@/components/admin/booking-manage";
import {
  ONLINE_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type AdminBookingDetail,
  type BookingCustomer,
  type BookingSummary,
} from "@/types";

interface PrintData {
  booking: AdminBookingDetail;
  summary: BookingSummary;
  customer: BookingCustomer | null;
}

const DOC_SLOTS = [
  { label: "Aadhaar Card — Front", types: ["Aadhaar Card (Front)", "Aadhaar Card"], number: "aadhaar" },
  { label: "Aadhaar Card — Back", types: ["Aadhaar Card (Back)"], number: "aadhaar" },
  { label: "Driving Licence — Front", types: ["Driving Licence (Front)", "Driving Licence"], number: "drivingLicence" },
  { label: "Driving Licence — Back", types: ["Driving Licence (Back)"], number: "drivingLicence" },
] as const;

/** "123456789012" → "1234 5678 9012" for readability on paper. */
const spacedAadhaar = (n?: string) => (n && /^\d{12}$/.test(n) ? n.replace(/(\d{4})(?=\d)/g, "$1 ") : n);

const dt = formatDateTimeIST;
const dateOnly = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rtr-avoid-break mt-5">
      <h2 className="border-b-2 border-black pb-1 text-[13px] font-bold uppercase tracking-wider">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Field({ label, value, wide }: { label: string; value?: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <div className="flex gap-2 border-b border-dotted border-neutral-400 py-1">
        <span className="w-32 shrink-0 font-semibold">{label}:</span>
        <span className="min-w-0 flex-1 break-words">{value || <span className="text-neutral-400">&nbsp;</span>}</span>
      </div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border border-black bg-neutral-100 px-2 py-1 text-left font-bold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className="border border-black px-2 py-1 align-top">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Printable A4 booking acknowledgement (customer form, documents, trip,
 * charges, payments, extensions, closure, terms and signatures). "Download
 * PDF" uses the browser's Save-as-PDF, so the file matches the print exactly.
 */
export default function BookingPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PrintData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<PrintData>(`/admin/bookings/${id}`)
      .then((res) => {
        setData(res.data);
        document.title = `Booking ${res.data.booking.bookingId} - ${siteConfig.name}`;
      })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load the booking."));
  }, [id]);

  if (error) return <p className="p-8 text-sm text-red-600">{error}</p>;
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const { booking: b, summary: s, customer: c } = data;
  const docs = sortDocuments(c?.documents ?? []);
  const findDoc = (types: readonly string[]) => docs.find((d) => types.includes(d.type));
  const collections = b.payment.collections ?? [];
  const extensions = b.extensions ?? [];
  const currentAddress = c
    ? [c.address, c.city, c.state, c.pincode].filter(Boolean).join(", ") || b.address
    : b.address;
  // Numbers entered by admin on the booking win over the customer's own.
  const numbers = {
    aadhaar: spacedAadhaar(b.documentNumbers?.aadhaar || c?.documentNumbers?.aadhaar),
    drivingLicence: b.documentNumbers?.drivingLicence || c?.documentNumbers?.drivingLicence,
    pan: b.documentNumbers?.pan || c?.documentNumbers?.pan,
  };
  const pickup = b.pickupLocation ? `${b.pickupLocation.city}, ${b.pickupLocation.region}` : "—";
  const drop = b.dropLocation ? `${b.dropLocation.city}, ${b.dropLocation.region}` : "—";

  const charges: [string, number][] = [
    [`Car rental (${formatDuration(b.durationHours)})`, b.baseAmount],
    ...(b.homeDelivery?.requested ? ([["Home delivery", b.homeDelivery.fee]] as [string, number][]) : []),
    ...(b.extensionCharges ? ([["Extension charges", b.extensionCharges]] as [string, number][]) : []),
    ...(b.closure?.extraKmCharge
      ? ([[`Extra km (${b.closure.extraKm} km × ${formatINR(s.extraKmRate)})`, b.closure.extraKmCharge]] as [string, number][])
      : []),
    ...(b.closure?.otherCharges
      ? ([[`Other charges${b.closure.otherChargesNote ? ` — ${b.closure.otherChargesNote}` : ""}`, b.closure.otherCharges]] as [string, number][])
      : []),
    ...(b.taxAmount ? ([["Tax", b.taxAmount]] as [string, number][]) : []),
    ...(b.discountAmount ? ([[`Discount${b.coupon ? ` (${b.coupon.code})` : ""}`, -b.discountAmount]] as [string, number][]) : []),
    ...(b.securityDeposit ? ([["Security deposit (refundable)", b.securityDeposit]] as [string, number][]) : []),
  ];

  return (
    <div className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          html, body { background: #fff !important; }
          .rtr-sheet { box-shadow: none !important; width: auto !important; min-height: 0 !important; padding: 0 !important; }
          .rtr-avoid-break { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto mb-4 flex w-full max-w-[210mm] flex-wrap items-center gap-2 px-4 print:hidden">
        <Link href={`/admin/bookings/${b._id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <button type="button" onClick={() => window.print()} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold">
          <Printer className="size-4" /> Print
        </button>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white">
          <Download className="size-4" /> Download PDF
        </button>
        <p className="w-full text-right text-xs text-neutral-600">For PDF, choose &ldquo;Save as PDF&rdquo; as the printer.</p>
      </div>

      <article className="rtr-sheet mx-auto w-[210mm] max-w-full bg-white p-[12mm] text-[12px] leading-snug text-black shadow-xl">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b-4 border-black pb-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-compact.png" alt={siteConfig.name} className="h-12 w-auto grayscale" />
            <div>
              <p className="text-lg font-extrabold">{siteConfig.name}</p>
              <p className="text-[11px]">Self-drive car rental · Delhi NCR</p>
              <p className="text-[11px]">
                {siteConfig.contact.phoneDisplay} · {siteConfig.contact.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-extrabold uppercase tracking-wide">Acknowledgement</h1>
            <p className="mt-1">
              Booking ID: <b>{b.bookingId}</b>
            </p>
            <p className="text-[11px]">Created: {dt(b.createdAt)}</p>
            <p className="text-[11px]">
              Status: <b>{b.status.replace(/_/g, " ")}</b>
            </p>
          </div>
        </header>

        <Section title="User Personal Form">
          <div className="flex gap-4">
            <div className="grid flex-1 grid-cols-2 gap-x-4">
              <Field label="Name" value={b.customerName} wide />
              <Field label="Email" value={b.email || c?.email} wide />
              <Field label="Phone" value={b.mobile} wide />
              <Field label="PAN No." value={numbers.pan} wide />
              <Field label="Current address" value={currentAddress} wide />
              <Field label="Permanent address" wide />
              {b.homeDelivery?.requested && <Field label="Delivery address" value={b.homeDelivery.address} wide />}
            </div>
            <div className="grid h-[38mm] w-[30mm] shrink-0 place-items-center overflow-hidden border border-black text-center text-[10px] text-neutral-500">
              {c?.profileImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.profileImage.url} alt="Customer" className="size-full object-cover" />
              ) : (
                "Affix photo"
              )}
            </div>
          </div>
        </Section>

        <Section title="Document List">
          <div className="grid grid-cols-2 gap-3">
            {DOC_SLOTS.map((slot) => {
              const doc = findDoc(slot.types);
              return (
                <div key={slot.label} className="rtr-avoid-break border border-black p-2">
                  <p className="text-[11px] font-bold">{slot.label}</p>
                  <div className="mt-1 grid h-[42mm] place-items-center overflow-hidden bg-neutral-50 text-[10px] text-neutral-500">
                    {doc && !doc.isPdf ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doc.url} alt={slot.label} className="max-h-full max-w-full object-contain" />
                    ) : doc ? (
                      "PDF on file — attach a printed copy"
                    ) : (
                      "Not uploaded — attach a copy"
                    )}
                  </div>
                  <p className="mt-2 border-b border-dotted border-neutral-500 pb-0.5">
                    No: <span className="font-mono font-semibold">{numbers[slot.number] ?? ""}</span>
                  </p>
                  <p className="mt-2 border-b border-dotted border-neutral-500 pb-0.5">Signature:</p>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Booking and Car Information">
          <div className="grid grid-cols-2 gap-x-6">
            <Field label="Booking ID" value={b.bookingId} />
            <Field label="Booked on" value={dt(b.createdAt)} />
            <Field label="Start" value={dt(b.pickupDate)} />
            <Field label="End" value={dt(b.dropDate)} />
            <Field label="Duration" value={formatDuration(b.durationHours)} />
            <Field label="Booking type" value={b.source === "ADMIN_OFFLINE" ? "Offline (admin)" : "Online"} />
            <Field label="Car name" value={b.car?.name} />
            <Field label="Model" value={b.car ? `${b.car.brand} ${b.car.model}` : undefined} />
            <Field label="Vehicle number" value={b.car?.registrationNumber} />
            <Field
              label="Rate"
              value={s.dailyRate != null ? `${formatINR(s.dailyRate)}/day${s.hourlyRate ? ` · ${formatINR(s.hourlyRate)}/hr` : ""}` : undefined}
            />
            <Field label="Source" value={b.tripFrom || (b.homeDelivery?.requested ? b.homeDelivery.address : undefined)} />
            <Field label="Destination" value={b.tripTo} />
            <Field label="Pickup location" value={b.homeDelivery?.requested ? `Home delivery (${pickup})` : pickup} />
            <Field label="Return location" value={drop} />
            <Field label="KM allowance" value={`${s.includedKm.toLocaleString("en-IN")} km (${s.kmPerDay} km / 24 hrs)`} />
            <Field label="Extra km rate" value={`${formatINR(s.extraKmRate)} per km`} />
          </div>
        </Section>

        <Section title="Charges">
          <Table
            head={["Description", "Amount"]}
            rows={[
              ...charges.map(([k, v]) => [k, v < 0 ? `− ${formatINR(-v)}` : formatINR(v)]),
              [<b key="t">Total</b>, <b key="v">{formatINR(b.totalAmount)}</b>],
            ]}
          />
        </Section>

        <Section title="Payments">
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <Field label="Method" value={b.payment.method ? PAYMENT_METHOD_LABELS[b.payment.method] : "—"} />
            <Field label="Status" value={PAYMENT_STATUS_LABELS[b.payment.status] ?? b.payment.status} />
            <Field label="Cash received" value={formatINR(s.cashReceived)} />
            <Field label="Online received" value={formatINR(s.onlineReceived)} />
            <Field label="Total paid" value={formatINR(s.amountReceived)} />
            <Field label="Balance due" value={<b>{formatINR(s.balanceDue)}</b>} />
          </div>
          {collections.length > 0 && (
            <div className="mt-2">
              <Table
                head={["Date", "Mode", "Amount", "UTR / Ref.", "Recorded by"]}
                rows={collections.map((p) => [
                  dt(p.receivedAt),
                  p.mode === "CASH" ? "Cash" : p.method ? ONLINE_METHOD_LABELS[p.method] : "Online",
                  formatINR(p.amount),
                  p.reference ?? "—",
                  typeof p.recordedBy === "object" && p.recordedBy ? p.recordedBy.name : "—",
                ])}
              />
            </div>
          )}
        </Section>

        {extensions.length > 0 && (
          <Section title="Extension History">
            <Table
              head={["Previous return", "New return", "Extra duration", "Amount", "Added on"]}
              rows={extensions.map((e) => [dt(e.previousDropAt), dt(e.newDropAt), formatDuration(e.extraHours), formatINR(e.amount), dateOnly(e.createdAt)])}
            />
          </Section>
        )}

        {b.closure && (
          <Section title="Closure Details">
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Closed on" value={dt(b.closure.closedAt)} />
              <Field
                label="Odometer"
                value={b.closure.odometerStart != null && b.closure.odometerEnd != null ? `${b.closure.odometerStart} → ${b.closure.odometerEnd}` : "—"}
              />
              <Field label="KM driven" value={`${b.closure.kmDriven} km`} />
              <Field label="Included km" value={`${b.closure.includedKm} km`} />
              <Field label="Extra km" value={`${b.closure.extraKm} km · ${formatINR(b.closure.extraKmCharge)}`} />
              <Field label="Other charges" value={b.closure.otherCharges ? formatINR(b.closure.otherCharges) : "—"} />
              {b.closure.notes && <Field label="Notes" value={b.closure.notes} wide />}
            </div>
          </Section>
        )}

        <Section title="Terms and Conditions">
          <p className="text-[11px]">
            I, the undersigned, confirm that the details and documents given above are true and belong to me. I have received the vehicle
            described above in good condition and will return it on the end date and time with the same fuel level. I will drive within
            the law and am responsible for traffic challans, tolls, fuel and any damage or loss during the rental period. The rental
            includes {s.includedKm.toLocaleString("en-IN")} km ({s.kmPerDay} km per 24 hours); km beyond this is charged at{" "}
            {formatINR(s.extraKmRate)} per km. Late return is charged at the booking&apos;s rate. The security deposit is refunded after the
            vehicle is inspected and all dues are settled.
          </p>
          <ul className="mt-1 grid list-disc grid-cols-2 gap-x-6 pl-5 text-[11px]">
            {RENTAL_TERMS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Section>

        <section className="rtr-avoid-break mt-8 grid grid-cols-3 gap-4 text-[11px]">
          {["Date", "Customer Signature", "Authorised Signatory"].map((label) => (
            <div key={label} className="flex h-[22mm] flex-col justify-end border border-black p-2">
              <span className="border-t border-black pt-1 font-semibold">{label}</span>
            </div>
          ))}
        </section>

        <p className="mt-4 text-center text-[10px] text-neutral-500">
          {siteConfig.name} · {siteConfig.url.replace("https://", "")} · Generated {dt(new Date())}
        </p>
      </article>
    </div>
  );
}
