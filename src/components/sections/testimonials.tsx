import { Quote, Star } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import type { Testimonial } from "@/types";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="bg-navy-50 py-14 sm:py-20 lg:py-28">
      <div className="container">
        <SectionHeading align="center" eyebrow="Reviews" title="Heard from the driver's seat." />
        <div className="snap-rail mt-8 pb-2 sm:mt-14 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08} className="w-[85%] max-w-[340px] md:w-auto md:max-w-none">
              <figure className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-[0_18px_40px_-34px_rgba(14,29,38,0.5)] md:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star
                        key={s}
                        className={s < t.rating ? "size-4 fill-lime text-lime" : "size-4 text-navy-200"}
                      />
                    ))}
                  </div>
                  <Quote className="size-8 text-navy-100" />
                </div>
                <blockquote className="mt-5 flex-1 text-base leading-relaxed text-navy-800 md:mt-6 md:text-lg">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-navy-100 pt-5 md:mt-8 md:pt-6">
                  <span className="grid size-11 place-items-center rounded-full bg-navy-900 font-display font-bold text-lime">
                    {t.name.split(" ").map((p) => p[0]).join("")}
                  </span>
                  <span>
                    <span className="block font-semibold text-navy-900">{t.name}</span>
                    <span className="text-sm text-navy-400">
                      {t.location}
                      {t.car && ` · ${t.car}`}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
