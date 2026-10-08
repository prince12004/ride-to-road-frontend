import Image from "next/image";
import { ArrowUpRight, Clock, Route } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Journey, Location } from "@/types";

export function Locations({ locations, journeys }: { locations: Location[]; journeys: Journey[] }) {
  return (
    <section id="locations" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Locations"
          title="Pick up anywhere in Delhi NCR."
          description="Choose the pickup point closest to you, or ask about doorstep delivery."
        />

        <div className="mt-12 grid auto-rows-[200px] grid-cols-2 gap-4 lg:auto-rows-[240px] lg:grid-cols-4">
          {locations.map((loc, i) => (
            <Reveal key={loc.id} delay={i * 0.06} className={cn(i === 0 && "col-span-2 row-span-2")}>
              <a
                href={whatsappLink(`Hi Ride to Road, I'd like to rent a self-drive car in ${loc.city}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block h-full overflow-hidden rounded-3xl"
              >
                <Image
                  src={loc.image}
                  alt={loc.city}
                  fill
                  sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <div>
                    <p className="text-xs font-medium text-navy-200">{loc.region}</p>
                    <h3 className={cn("font-display font-bold text-white", i === 0 ? "text-3xl" : "text-xl")}>
                      {loc.city}
                    </h3>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors group-hover:bg-lime group-hover:text-navy-900">
                    <ArrowUpRight className="size-5" />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="mt-20">
          <h3 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">Popular road trips from Delhi</h3>
          <div className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {journeys.map((j) => (
              <article
                key={j.id}
                className="group w-[80%] shrink-0 snap-start overflow-hidden rounded-3xl border border-navy-100 bg-white sm:w-auto"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={j.image}
                    alt={`${j.to}`}
                    fill
                    sizes="(min-width: 640px) 33vw, 80vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="font-display text-lg font-bold text-navy-900">
                    {j.from} <span className="text-brand-green">→</span> {j.to}
                  </p>
                  <p className="mt-1 text-sm text-navy-500">{j.highlight}</p>
                  <div className="mt-4 flex gap-4 text-sm font-semibold text-navy-700">
                    <span className="flex items-center gap-1.5">
                      <Route className="size-4 text-brand-deep" /> ~{j.distanceKm} km
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 text-brand-deep" /> {j.driveTime}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
