import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CarCard } from "@/components/cards/car-card";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { Button } from "@/components/ui/button";
import type { Car } from "@/types";

export function FeaturedCars({ cars }: { cars: Car[] }) {
  return (
    <section id="cars" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="The fleet"
          title="Pick the car that fits the trip."
          description="Hatchbacks for the city, SUVs for the hills, and something special for the occasions that deserve it."
          action={
            <Button asChild variant="outline" className="self-start md:self-auto">
              <Link href="/cars">
                View all cars <ArrowRight />
              </Link>
            </Button>
          }
        />
        {cars.length > 0 ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cars.map((car, i) => (
              <Reveal key={car.id} delay={i * 0.08} className="h-full">
                <CarCard car={car} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-navy-200 p-12 text-center">
            <p className="font-display text-lg font-bold text-navy-900">Cars will appear here soon.</p>
            <p className="mt-2 text-navy-500">Our team is adding fresh rides to the fleet — check back shortly.</p>
          </div>
        )}
      </div>
    </section>
  );
}
