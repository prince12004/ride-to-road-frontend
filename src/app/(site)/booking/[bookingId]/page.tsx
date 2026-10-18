import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, MessageCircle, UserRound } from "lucide-react";
import { serverFetch, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import { PaymentPanel } from "@/components/booking/payment-panel";
import { DeliveryAddress } from "@/components/booking/delivery-address";
import { formatINR } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type Booking, type BookingStatusHistoryEntry, type Location } from "@/types";

interface BookingCarSummary {
  name: string;
  brand?: string;
  mainImage?: { url: string };
}

async function getBooking(bookingId: string) {
  try {
    const res = await serverFetch<{ booking: Booking; history: BookingStatusHistoryEntry[] }>(`/bookings/${bookingId}`, {
      revalidate: 0,
    });
    return res.data;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) return null;
    throw err;
  }
}

export default async function BookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const data = await getBooking(bookingId);
  if (!data) notFound();
  const { booking } = data;

  const car = typeof booking.car === "object" ? (booking.car as BookingCarSummary) : null;
  const pickupLocation = typeof booking.pickupLocation === "object" ? (booking.pickupLocation as Location) : null;

  return (
    <section className="bg-navy-50 py-12 lg:py-16">
      <div className="container max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-navy-400">Booking ID</p>
            <h1 className="font-display text-2xl font-extrabold text-navy-950">{booking.bookingId}</h1>
          </div>
          <Button asChild variant="whatsapp">
            <a
              href={whatsappLink(`Hi Ride to Road, I have a question about booking ${booking.bookingId}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" /> Chat on WhatsApp
            </a>
          </Button>
        </div>

        <div className="mt-8">
          <PaymentPanel
            bookingId={booking.bookingId}
            method={booking.payment.method}
            paymentStatus={booking.payment.status}
            bookingStatus={booking.status}
            amount={booking.totalAmount}
            proofUploadedAt={booking.payment.proof?.uploadedAt}
            failureReason={booking.payment.failureReason}
          />
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="overflow-hidden p-0">
            {car?.mainImage?.url && (
              <div className="relative aspect-[21/9] overflow-hidden bg-navy-100">
                <Image src={car.mainImage.url} alt={car.name} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
                <p className="absolute bottom-3 left-4 font-display text-lg font-bold text-white">{car.name}</p>
              </div>
            )}
            <div className="p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-50 text-brand-deep">
                <UserRound className="size-5" />
              </span>
              <h2 className="font-display text-lg font-bold text-navy-900">Booking Details</h2>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              {car && !car.mainImage?.url && (
                <div className="col-span-2">
                  <dt className="text-navy-400">Car</dt>
                  <dd className="font-semibold text-navy-900">{car.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-navy-400">Customer</dt>
                <dd className="font-semibold text-navy-900">{booking.customerName}</dd>
              </div>
              <div>
                <dt className="text-navy-400">Mobile</dt>
                <dd className="font-semibold text-navy-900">{booking.mobile}</dd>
              </div>
              {pickupLocation && (
                <div>
                  <dt className="flex items-center gap-1 text-navy-400">
                    <MapPin className="size-3.5" /> Pickup Location
                  </dt>
                  <dd className="font-semibold text-navy-900">
                    {pickupLocation.city}, {pickupLocation.region}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-navy-400">Duration</dt>
                <dd className="font-semibold text-navy-900">{booking.durationHours} hours</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-navy-400">
                  <CalendarDays className="size-3.5" /> Pickup
                </dt>
                <dd className="font-semibold text-navy-900">
                  {new Date(booking.pickupDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                  {booking.pickupTime}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-navy-400">
                  <CalendarDays className="size-3.5" /> Return
                </dt>
                <dd className="font-semibold text-navy-900">
                  {new Date(booking.dropDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                  {booking.dropTime}
                </dd>
              </div>
              {booking.homeDelivery?.requested && booking.homeDelivery.address ? (
                <DeliveryAddress bookingObjectId={booking._id} maskedAddress={booking.homeDelivery.address} />
              ) : (
                <div className="col-span-2">
                  <dt className="text-navy-400">Pickup / Delivery</dt>
                  <dd className="font-semibold text-navy-900">{booking.homeDelivery?.requested ? "Home delivery" : "Self pickup"}</dd>
                </div>
              )}
              {booking.specialRequest && (
                <div className="col-span-2">
                  <dt className="text-navy-400">Special Request</dt>
                  <dd className="text-navy-800">{booking.specialRequest}</dd>
                </div>
              )}
            </dl>

            <div className="mt-5 rounded-2xl bg-navy-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-navy-500">Car Rental Price</span>
                <span className="font-medium text-navy-900">{formatINR(booking.baseAmount)}</span>
              </div>
              {!!booking.discountAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-navy-500">Discount</span>
                  <span className="font-medium text-brand-deep">- {formatINR(booking.discountAmount)}</span>
                </div>
              )}
              {!!booking.extensionCharges && (
                <div className="flex justify-between text-sm">
                  <span className="text-navy-500">Extension Charges</span>
                  <span className="font-medium text-navy-900">{formatINR(booking.extensionCharges)}</span>
                </div>
              )}
              {!!booking.securityDeposit && (
                <div className="flex justify-between text-sm">
                  <span className="text-navy-500">Security Deposit (refundable)</span>
                  <span className="font-medium text-navy-900">{formatINR(booking.securityDeposit)}</span>
                </div>
              )}
              {!!booking.taxAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-navy-500">Taxes</span>
                  <span className="font-medium text-navy-900">{formatINR(booking.taxAmount)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-navy-200 pt-2 text-base font-bold text-navy-900">
                <span>Total Payable</span>
                <span>{formatINR(booking.totalAmount)}</span>
              </div>
              <p className="mt-2 text-xs text-navy-400">
                Payment: <span className="font-semibold text-navy-700">
                  {booking.payment.method ? PAYMENT_METHOD_LABELS[booking.payment.method] : "—"} · {PAYMENT_STATUS_LABELS[booking.payment.status] ?? booking.payment.status}
                </span>
              </p>
              {booking.payment.status === "PARTIALLY_PAID" && typeof booking.payment.amountReceived === "number" && (
                <p className="mt-1 text-xs text-navy-500">
                  Received {formatINR(booking.payment.amountReceived)} · Balance due{" "}
                  <span className="font-semibold text-navy-900">{formatINR(Math.max(0, booking.totalAmount - booking.payment.amountReceived))}</span>
                </p>
              )}
            </div>
            </div>
          </Card>

          <Card className="flex flex-col p-6">
            <h2 className="font-display text-lg font-bold text-navy-900">Status</h2>
            <div className="mt-4">
              <BookingStatusTimeline status={booking.status} />
            </div>
            {(booking.status === "PAYMENT_FAILED" || booking.status === "CANCELLED") && (
              <div className="mt-6 rounded-2xl bg-navy-50 p-4 text-center">
                <p className="text-sm text-navy-600">Need help with this booking or want to try again?</p>
                <Button asChild variant="whatsapp" size="sm" className="mt-3 w-full">
                  <a
                    href={whatsappLink(`Hi Ride to Road, my booking ${booking.bookingId} needs attention — could you help?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" /> Chat with our team
                  </a>
                </Button>
              </div>
            )}
          </Card>
        </div>

        <Button asChild variant="outline" className="mt-6">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </section>
  );
}
