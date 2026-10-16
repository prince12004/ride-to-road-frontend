import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeIndianRupee, CarFront, MessageCircle, Truck } from "lucide-react";
import { BookingWidget } from "@/components/sections/booking-widget";
import { AttachCarDialog } from "@/components/attach-car/attach-car-dialog";
import { Button } from "@/components/ui/button";

const highlights = [
  { icon: BadgeIndianRupee, label: "Upfront pricing" },
  { icon: Truck, label: "Doorstep delivery*" },
  { icon: MessageCircle, label: "WhatsApp support" },
];

/**
 * Phones: the photo sits behind the copy and the booking widget follows the
 * headline, so customers can start a search on the first screen.
 * Desktop: copy on the left, photo on the right, widget spanning below.
 * One widget instance is placed with grid areas — no duplicate markup.
 */
export function Hero({ cities }: { cities: string[] }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <div className="pointer-events-none absolute -right-40 top-10 -z-10 size-[520px] rounded-full bg-lime/15 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-lanes" />

      <div
        className="container grid gap-x-12 pb-10 pt-10 [grid-template-areas:'copy'_'widget'_'actions'_'trust'] sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:pb-16 lg:pt-20 lg:[grid-template-areas:'copy_photo'_'actions_photo'_'trust_photo'_'widget_widget']"
      >
        <div className="[grid-area:copy] lg:self-end">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-100 backdrop-blur">
            <span className="size-1.5 rounded-full bg-lime" />
            Self-drive · Delhi NCR
          </p>
          <h1 className="mt-5 text-balance font-display text-[2.6rem] font-extrabold leading-[0.95] tracking-tight text-white min-[380px]:text-5xl sm:text-6xl xl:text-7xl">
            Self drive,
            <br />
            <span className="italic text-lime">your way.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-navy-200 sm:mt-6 sm:text-lg sm:text-navy-300">
            Premium self-drive cars across Delhi NCR. Pick your ride, choose your time, and hit the road on your terms.
          </p>
        </div>

        <div className="mt-7 [grid-area:widget] lg:mt-12">
          <BookingWidget cities={cities} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 [grid-area:actions] sm:flex sm:flex-wrap lg:mt-8 lg:self-start">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/cars">
              Browse cars <ArrowRight />
            </Link>
          </Button>
          <AttachCarDialog>
            <Button size="lg" variant="ghostLight" className="w-full border-lime/50 px-4 text-lime hover:bg-lime/10 sm:w-auto sm:px-7">
              <CarFront /> Attach Car
            </Button>
          </AttachCarDialog>
        </div>

        <ul className="mt-5 flex flex-wrap gap-2 [grid-area:trust] lg:mt-8 lg:self-start">
          {highlights.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-navy-200"
            >
              <Icon className="size-3.5 shrink-0 text-lime" /> {label}
            </li>
          ))}
        </ul>

        {/* One photo: a faded backdrop behind the copy on phones, a framed
            image in the right column on desktop. */}
        <div className="absolute inset-x-0 top-0 -z-10 h-[460px] lg:relative lg:inset-auto lg:z-auto lg:h-auto lg:[grid-area:photo]">
          <div className="relative h-full lg:aspect-[16/10] lg:h-auto lg:overflow-hidden lg:rounded-[2rem] lg:ring-1 lg:ring-white/10">
            <Image
              src="/images/hero-suv.jpg"
              alt="SUV with headlights on against a dark background"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover object-[50%_30%] opacity-50 lg:object-center lg:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 via-navy-950/70 to-navy-950 lg:bg-gradient-to-t lg:from-navy-950/80 lg:via-transparent lg:to-transparent" />
          </div>
        </div>
      </div>
      <p className="container pb-6 text-[11px] text-navy-400 lg:pb-8">*Doorstep delivery available in select areas.</p>
    </section>
  );
}
