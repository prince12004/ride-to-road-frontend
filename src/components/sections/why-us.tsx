import Image from "next/image";
import { BadgeIndianRupee, Headphones, MapPin, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";

const reasons = [
  {
    icon: BadgeIndianRupee,
    title: "Upfront pricing",
    body: "The rate you're quoted is the rate you pay. Charges and deposits are explained before you book.",
  },
  {
    icon: ShieldCheck,
    title: "Well-kept cars",
    body: "Every car is cleaned and checked between rentals, so it's ready the moment you pick it up.",
  },
  {
    icon: MapPin,
    title: "Across Delhi NCR",
    body: "Pickup points in Delhi, Noida, Gurgaon, Ghaziabad and Greater Noida, with doorstep delivery in select areas.",
  },
  {
    icon: Headphones,
    title: "People who reply",
    body: "Questions before, during or after your trip go to a real person on WhatsApp or phone.",
  },
];

export function WhyUs() {
  return (
    <section id="why" className="relative isolate scroll-mt-20 overflow-hidden bg-navy-950 py-14 sm:py-20 lg:py-28">
      <Image src="/images/why-texture.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-15" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950 via-navy-950/80 to-navy-950" />
      <div className="container grid gap-8 sm:gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            dark
            eyebrow="Why Ride to Road"
            title={
              <>
                Your trip, <span className="text-lime">your rules.</span>
              </>
            }
            description="No driver, no fixed route, no one waiting for you. Just a good car and the freedom to go where the day takes you."
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {reasons.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-colors hover:border-lime/40 sm:p-7">
                <span className="grid size-10 place-items-center rounded-2xl bg-lime/15 text-lime sm:size-12">
                  <Icon className="size-5 sm:size-6" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-white sm:mt-6 sm:text-xl">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-navy-300 sm:mt-3 sm:text-base">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
