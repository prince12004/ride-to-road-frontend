import { Quote, Star } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import type { Testimonial } from "@/types";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="bg-navy-50 py-20 lg:py-28">
      <div className="container">
        <SectionHeading align="center" eyebrow="Reviews" title="Heard from the driver's seat." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-3xl bg-white p-8">
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
                <blockquote className="mt-6 flex-1 text-lg leading-relaxed text-navy-800">“{t.quote}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-3 border-t border-navy-100 pt-6">
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
