import type { Metadata } from "next";
import { CarsBrowser } from "@/components/cards/cars-browser";
import { Cta } from "@/components/sections/cta";
import { getCars, getLocations } from "@/lib/content";

export const metadata: Metadata = {
  title: "Self-Drive Cars",
  description: "Browse hatchbacks, sedans, SUVs and luxury cars available for self-drive rental across Delhi NCR.",
};

interface CarsPageProps {
  searchParams: Promise<{
    city?: string;
    pickupDate?: string;
    pickupTime?: string;
    returnDate?: string;
    returnTime?: string;
  }>;
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  const params = await searchParams;
  const filters = {
    city: params.city,
    pickupDate: params.pickupDate,
    pickupTime: params.pickupTime,
    dropDate: params.returnDate,
    dropTime: params.returnTime,
  };
  const [cars, locations] = await Promise.all([getCars(filters), getLocations()]);

  return (
    <>
      <section className="bg-navy-950 bg-lanes py-16 lg:py-20">
        <div className="container">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-lime">
            <span className="h-px w-6 bg-current" />
            The fleet
          </p>
          <h1 className="mt-4 max-w-2xl text-balance font-display text-4xl font-extrabold leading-[1] tracking-tight text-white sm:text-6xl">
            Find your <span className="italic text-lime">ride.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-navy-300">
            Every car is self-drive. Filter by type or gearbox, then message us on WhatsApp to check availability for your dates.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container">
          <CarsBrowser
            cars={cars}
            locations={locations.map((l) => l.city)}
            initialSearch={{
              city: params.city,
              pickupDate: params.pickupDate,
              pickupTime: params.pickupTime,
              returnDate: params.returnDate,
              returnTime: params.returnTime,
            }}
          />
        </div>
      </section>

      <Cta />
    </>
  );
}
