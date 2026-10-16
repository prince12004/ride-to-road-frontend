import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Offer } from "@/types";

export function OfferBanner({ offer }: { offer: Offer }) {
  return (
    <section id="offers" className="scroll-mt-20 pb-14 sm:pb-20 lg:pb-28">
      <div className="container">
        <div className="relative isolate grid overflow-hidden rounded-[2rem] bg-lime lg:grid-cols-2">
          <div className="relative z-10 p-6 sm:p-12 lg:p-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy-800">{offer.eyebrow}</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1] tracking-tight text-navy-950 sm:text-5xl">
              {offer.title}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-navy-800">{offer.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild variant="navy" size="lg">
                <Link href={offer.ctaHref}>
                  {offer.ctaLabel} <ArrowRight />
                </Link>
              </Button>
              {offer.code && (
                <p className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-navy-900/30 px-4 py-2.5 text-sm font-semibold text-navy-900">
                  <Tag className="size-4" /> Use code <span className="font-display font-extrabold tracking-wider">{offer.code}</span>
                </p>
              )}
            </div>
            <p className="mt-6 text-xs text-navy-700">{offer.terms}</p>
          </div>
          <div className="relative min-h-[260px] lg:min-h-full">
            <Image src={offer.image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-lime via-transparent to-transparent lg:bg-gradient-to-r" />
          </div>
        </div>
      </div>
    </section>
  );
}
