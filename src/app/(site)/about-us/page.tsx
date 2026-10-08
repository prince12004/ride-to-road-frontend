import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeIndianRupee, Car, MapPin, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { ProseContent } from "@/components/legal/prose-content";
import { getSiteContent } from "@/lib/content";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Ride to Road is Delhi NCR's self-drive car rental platform — a well-kept fleet, transparent pricing and doorstep delivery across Delhi, Noida, Gurgaon, Ghaziabad and Greater Noida.",
};

const stats = [
  { label: "Cars in the fleet", value: "50+" },
  { label: "Cities covered", value: "5" },
  { label: "Trips completed", value: "10,000+" },
  { label: "Average rating", value: "4.8★" },
];

const values = [
  {
    icon: BadgeIndianRupee,
    title: "Transparent pricing",
    body: "The price you see at checkout is the price you pay — no last-minute add-ons, no hidden fuel or cleaning charges.",
  },
  {
    icon: ShieldCheck,
    title: "Cars you can trust",
    body: "Every vehicle is serviced, sanitised and inspected between rentals, with insurance and roadside assistance included.",
  },
  {
    icon: Sparkles,
    title: "Freedom, on your terms",
    body: "No driver, no fixed itinerary. Pick your car, choose your hours and go wherever the day takes you.",
  },
];

const steps = [
  { title: "Choose your car", body: "Filter by city, dates and body type to find the ride that fits your trip." },
  { title: "Book in minutes", body: "Reserve online with secure Razorpay checkout — no paperwork at the counter." },
  { title: "Pick up & drive", body: "Collect the car from our location or get it delivered to your doorstep." },
];

export default async function AboutUsPage() {
  const page = await getSiteContent("about-us");

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy-950 bg-lanes py-20 lg:py-28">
        <div className="pointer-events-none absolute -left-32 top-0 -z-10 size-[420px] rounded-full bg-lime/15 blur-[140px]" />
        <div className="container grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-navy-100">
              <span className="size-2 rounded-full bg-lime" />
              About Ride to Road
            </p>
            <h1 className="mt-6 text-balance font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl">
              {page?.title || "Driving Delhi NCR, on your own terms."}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-300">
              We started Ride to Road because renting a self-drive car in Delhi NCR meant confusing rate cards, surprise
              charges and cars that had seen better days. We built the alternative: a clean, well-maintained fleet,
              upfront pricing and a booking flow that takes minutes, not hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/cars">
                  Browse the fleet <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghostLight">
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> Chat with us
                </a>
              </Button>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
            <Image src="/images/hero-suv.jpg" alt="Ride to Road self-drive SUV" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" priority />
          </div>
        </div>
      </section>

      <section className="border-b border-navy-100 py-10">
        <div className="container grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold text-navy-900 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-navy-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {page?.content ? (
        <section className="py-14 lg:py-16">
          <div className="container max-w-3xl">
            <ProseContent html={page.content} />
          </div>
        </section>
      ) : null}

      <section className="py-20 lg:py-28">
        <div className="container">
          <SectionHeading
            eyebrow="What we stand for"
            title="A rental experience built around trust."
            description="Three things guide every decision we make — from how we price a car to how quickly we reply on WhatsApp."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-navy-100 bg-white p-7 transition-colors hover:border-navy-200 hover:shadow-[0_24px_48px_-24px_rgba(14,29,38,0.2)]">
                  <span className="grid size-12 place-items-center rounded-2xl bg-navy-50 text-brand-deep">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold text-navy-900">{title}</h3>
                  <p className="mt-3 leading-relaxed text-navy-500">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-navy-950 py-20 lg:py-28">
        <Image src="/images/why-texture.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-15" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-950 via-navy-950/80 to-navy-950" />
        <div className="container">
          <SectionHeading
            dark
            align="center"
            eyebrow="How it works"
            title="From search to steering wheel in three steps."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur-sm">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-lime font-display text-lg font-extrabold text-navy-900">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-navy-300">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container grid items-center gap-10 rounded-[2.5rem] bg-navy-50 p-10 lg:grid-cols-[1fr_auto] lg:p-16">
          <div>
            <div className="flex items-center gap-2 text-brand-deep">
              <MapPin className="size-4" />
              <Car className="size-4" />
              <Users className="size-4" />
            </div>
            <h2 className="mt-4 max-w-xl text-balance font-display text-3xl font-extrabold leading-[1.05] text-navy-900 sm:text-4xl">
              Ready to hit the road?
            </h2>
            <p className="mt-3 max-w-lg text-navy-500">
              Browse our fleet, pick your dates and get a confirmed booking in minutes — or message us on WhatsApp and
              we'll help you choose.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <Button asChild size="lg">
              <Link href="/cars">
                Browse Cars <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
