import Image from "next/image";
import { ArrowRight, BadgeIndianRupee, MessageCircle, Truck } from "lucide-react";
import { BookingWidget } from "@/components/sections/booking-widget";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const highlights = [
  { icon: BadgeIndianRupee, label: "Clear, upfront pricing" },
  { icon: Truck, label: "Doorstep delivery in select areas" },
  { icon: MessageCircle, label: "Quick replies on WhatsApp" },
];

export function Hero({ cities }: { cities: string[] }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 bg-lanes">
      <div className="pointer-events-none absolute -right-40 top-10 -z-10 size-[520px] rounded-full bg-lime/20 blur-[140px]" />

      <div className="container grid items-center gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:pb-24 lg:pt-20">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-navy-100">
            <span className="size-2 rounded-full bg-lime" />
            Self-drive car rentals across Delhi NCR
          </p>
          <h1 className="mt-6 text-balance font-display text-[2.75rem] font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl xl:text-7xl">
            Self drive,
            <br />
            <span className="italic text-lime">your way.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-navy-300">{siteConfig.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="/cars">
                Browse cars <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="ghostLight">
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>

          <ul className="mt-10 grid gap-3 text-sm text-navy-200 sm:grid-cols-3 sm:gap-4">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <Icon className="size-4 shrink-0 text-lime" /> {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative -mx-5 sm:mx-0">
          <div className="relative aspect-[16/10] overflow-hidden sm:rounded-[2rem]">
            <Image
              src="/images/hero-suv.jpg"
              alt="SUV with headlights on against a dark background"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
          </div>
        </div>
      </div>

      <div className="container relative z-10 -mt-4 pb-12 lg:-mt-10 lg:pb-16">
        <BookingWidget cities={cities} />
      </div>
    </section>
  );
}
