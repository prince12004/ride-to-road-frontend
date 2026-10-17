import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { serverFetch, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import type { Booking } from "@/types";

async function getBooking(bookingId: string) {
  try {
    const res = await serverFetch<{ booking: Booking }>(`/bookings/${bookingId}`, { revalidate: 0 });
    return res.data.booking;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return null;
    throw err;
  }
}

export default async function BookingSuccessPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);
  if (!booking) notFound();

  const car = typeof booking.car === "object" ? (booking.car as { name: string }) : null;
  const isPaid = booking.payment.status === "PAID";
  const isCod = booking.payment.method === "COD";
  const isConfirmed = booking.status === "CONFIRMED" || isPaid;

  return (
    <section className="bg-navy-50 py-14 lg:py-20">
      <div className="container max-w-xl text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-lime/20 text-brand-deep">
          <CheckCircle2 className="size-9" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-navy-950">
          {isConfirmed ? "Booking Confirmed!" : "Booking Request Received"}
        </h1>
        <p className="mt-2 text-navy-500">
          {isPaid
            ? "Your payment is received and your booking is confirmed."
            : isCod
              ? `Pay ${formatINR(booking.totalAmount)} in cash when you pick up the car.`
              : "We've saved your booking. Complete the UPI payment and upload the screenshot to confirm it."}
        </p>

        <Card className="mt-8 p-6 text-left">
          <div className="flex items-center justify-between border-b border-dashed border-navy-100 pb-4">
            <div>
              <p className="text-xs text-navy-400">Booking ID</p>
              <p className="font-display text-lg font-bold text-navy-900">{booking.bookingId}</p>
            </div>
            <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">{booking.status.replace(/_/g, " ")}</span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            {car && (
              <div className="flex justify-between">
                <dt className="text-navy-400">Car</dt>
                <dd className="font-semibold text-navy-900">{car.name}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-navy-400">Customer</dt>
              <dd className="font-semibold text-navy-900">{booking.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy-400">Payment</dt>
              <dd className="font-semibold text-navy-900">{isCod ? "Cash on Delivery" : booking.payment.method === "UPI_QR" ? "UPI QR" : "—"}</dd>
            </div>
            {!!booking.securityDeposit && (
              <div className="flex justify-between">
                <dt className="text-navy-400">Security deposit (refundable)</dt>
                <dd className="font-semibold text-navy-900">{formatINR(booking.securityDeposit)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-navy-100 pt-2 text-base font-bold text-navy-900">
              <dt>Total</dt>
              <dd>{formatINR(booking.totalAmount)}</dd>
            </div>
          </dl>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="sm:flex-1">
            <Link href={`/booking/${booking.bookingId}`}>View Booking Details</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="sm:flex-1">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
