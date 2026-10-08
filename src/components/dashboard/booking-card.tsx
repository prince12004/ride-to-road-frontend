import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/dashboard/booking-status-badge";
import { formatINR } from "@/lib/utils";
import type { UserBooking } from "@/types";

export function BookingCard({ booking }: { booking: UserBooking }) {
  const pickup = new Date(booking.pickupDate);
  const drop = new Date(booking.dropDate);

  return (
    <Card className="group overflow-hidden p-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-[0_24px_48px_-24px_rgba(14,29,38,0.25)]">
      <Link href={`/booking/${booking.bookingId}`} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-navy-50 ring-1 ring-navy-100">
            {booking.car?.mainImage?.url ? (
              <Image src={booking.car.mainImage.url} alt={booking.car.name} fill className="object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-xs font-bold text-navy-400">
                {booking.car?.brand ? booking.car.brand.slice(0, 3).toUpperCase() : "RTR"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">{booking.bookingId}</p>
            <p className="truncate font-display text-base font-bold text-navy-900">{booking.car?.name ?? "Car"}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-navy-500">
              <CalendarDays className="size-3.5 text-navy-400" />
              {pickup.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} →{" "}
              {drop.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-dashed border-navy-100 pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
            <BookingStatusBadge status={booking.status} />
            <p className="font-display text-lg font-extrabold text-navy-900">{formatINR(booking.totalAmount)}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-deep opacity-0 transition-opacity group-hover:opacity-100">
            View details <ArrowRight className="size-3.5" />
          </span>
        </div>
      </Link>
    </Card>
  );
}
