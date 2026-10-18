import Link from "next/link";
import { Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { formatINR, cn } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type AdminBookingListItem } from "@/types";

function fmtDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function BookingsTable({ bookings, highlightMobile = false }: { bookings: AdminBookingListItem[]; highlightMobile?: boolean }) {
  return (
    <Card className={cn("overflow-x-auto p-0", highlightMobile && "border-amber-200")}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
            <th className="p-4">Booking ID</th>
            <th className="p-4">Customer</th>
            <th className="p-4">Car</th>
            <th className="p-4">Pickup</th>
            <th className="p-4">Drop</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Status</th>
            <th className="p-4">Payment</th>
            <th className="p-4">Created</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id} className="border-b border-navy-50 transition-colors duration-150 last:border-0 hover:bg-navy-50/60">
              <td className="p-4 font-medium text-navy-900">{b.bookingId}</td>
              <td className="p-4">
                <p className="font-medium text-navy-900">{b.customerName}</p>
                <p
                  className={cn(
                    "text-xs text-navy-400",
                    highlightMobile && "flex items-center gap-1 font-bold text-amber-700",
                  )}
                >
                  {highlightMobile && <Phone className="size-3" />}
                  {b.mobile}
                </p>
              </td>
              <td className="p-4 text-navy-700">{b.car && typeof b.car === "object" ? b.car.name : <span className="text-navy-400">Car removed</span>}</td>
              <td className="p-4 text-navy-700">
                {fmtDate(b.pickupDate)} · {b.pickupTime}
              </td>
              <td className="p-4 text-navy-700">
                {fmtDate(b.dropDate)} · {b.dropTime}
              </td>
              <td className="p-4 font-medium text-navy-900">{formatINR(b.totalAmount)}</td>
              <td className="p-4">
                <BookingStatusBadge status={b.status} />
              </td>
              <td className="p-4">
                <PaymentStatusBadge status={b.payment.status} />
                {b.payment.method && (
                  <p className="mt-1 whitespace-nowrap text-xs text-navy-400">
                    {PAYMENT_METHOD_LABELS[b.payment.method] ?? b.payment.method}
                  </p>
                )}
                {b.payment.method === "UPI_QR" && b.payment.status === "PENDING" && b.payment.proof?.uploadedAt && (
                  <p className="mt-1 whitespace-nowrap text-xs font-semibold text-amber-700">Screenshot to review</p>
                )}
              </td>
              <td className="p-4 text-navy-400">{fmtDate(b.createdAt)}</td>
              <td className="p-4 text-right">
                <Link href={`/admin/bookings/${b._id}`} className="text-sm font-semibold text-brand-deep hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
