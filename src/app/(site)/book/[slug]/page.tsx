import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarBySlug, getLocations } from "@/lib/content";
import { BookingForm } from "@/components/booking/booking-form";
import { BookingProgress } from "@/components/booking/booking-progress";

export const metadata: Metadata = {
  title: "Complete Your Booking",
};

interface BookCarPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string; pickupDate?: string; pickupTime?: string; returnDate?: string; returnTime?: string }>;
}

export default async function BookCarPage({ params, searchParams }: BookCarPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const [car, locations] = await Promise.all([getCarBySlug(slug), getLocations()]);
  if (!car) notFound();

  const matchedLocationId = search.city
    ? locations.find((l) => l.city.toLowerCase() === search.city!.toLowerCase())?.id
    : undefined;

  return (
    <section className="bg-navy-50 py-12 lg:py-12">
      <div className="container max-w-9xl">
        <div className="mb-8 rounded-2xl border border-navy-100 bg-white p-4 sm:p-5">
          <BookingProgress current={1} />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-deep">Booking Details</p>
        <h1 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">
          Book the {car.name}
        </h1>
        <p className="mt-2 text-navy-500">Fill in your details, review the summary and pay securely to confirm.</p>

        <div className="mt-10">
          <Suspense
            fallback={
              <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
                <div className="h-96 animate-pulse rounded-3xl bg-navy-100" />
                <div className="h-72 animate-pulse rounded-3xl bg-navy-100" />
              </div>
            }
          >
            <BookingForm
              car={car}
              locations={locations}
              initial={{
                locationId: matchedLocationId,
                pickupDate: search.pickupDate,
                pickupTime: search.pickupTime,
                dropDate: search.returnDate,
                dropTime: search.returnTime,
              }}
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
