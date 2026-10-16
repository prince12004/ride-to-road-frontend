import Image from "next/image";
import Link from "next/link";
import { Fuel, Settings2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";
import type { Car } from "@/types";

export function CarCard({ car, searchQuery = "" }: { car: Car; searchQuery?: string }) {
  const soldOut = car.available === false;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-[0_18px_40px_-30px_rgba(14,29,38,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-[0_24px_48px_-24px_rgba(14,29,38,0.35)]",
        soldOut && "opacity-75 hover:translate-y-0 hover:shadow-none",
      )}
    >
      <Link href={`/cars/${car.slug}${searchQuery}`} className="relative aspect-[16/10] overflow-hidden bg-navy-100 sm:aspect-[4/3]">
        <Image
          src={car.image}
          alt={car.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 85vw"
          className={cn("object-cover transition-transform duration-700 group-hover:scale-105", soldOut && "grayscale")}
        />
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-navy-950/55">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-navy-900">
              Sold Out
            </span>
          </div>
        )}
        {car.tag && !soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy-900 backdrop-blur sm:left-4 sm:top-4">
            {car.tag}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-navy-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur sm:right-4 sm:top-4">
          {car.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-400">{car.brand}</p>
        <Link href={`/cars/${car.slug}${searchQuery}`}>
          <h3 className="mt-1 font-display text-xl font-bold text-navy-900 transition-colors group-hover:text-brand-deep">
            {car.name}
          </h3>
        </Link>

        <ul className="mb-4 mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-navy-600 sm:mb-5 sm:mt-4">
          <li className="flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1">
            <Users className="size-3.5 text-navy-400" /> {car.seats} seats
          </li>
          <li className="flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1">
            <Settings2 className="size-3.5 text-navy-400" /> {car.transmission}
          </li>
          <li className="flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1">
            <Fuel className="size-3.5 text-navy-400" /> {car.fuel}
          </li>
        </ul>

        <div className="mt-auto border-t border-dashed border-navy-100 pt-4 sm:pt-5">
          <p className="mb-3">
            <span className="block text-xs text-navy-400">From</span>
            <span className="font-display text-2xl font-extrabold text-navy-900">{formatINR(car.pricePerDay)}</span>
            <span className="text-sm text-navy-400">/day</span>
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="h-11 flex-1 sm:h-9">
              <Link href={`/cars/${car.slug}${searchQuery}`}>View Details</Link>
            </Button>
            {soldOut ? (
              <Button variant="lime" size="sm" className="h-11 flex-1 cursor-not-allowed opacity-50 sm:h-9" disabled>
                Sold Out
              </Button>
            ) : (
              <Button asChild variant="lime" size="sm" className="h-11 flex-1 sm:h-9">
                <Link href={`/book/${car.slug}${searchQuery}`}>Book Now</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
