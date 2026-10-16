import { CarFront, IdCard, KeyRound } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";

const steps = [
  {
    icon: CarFront,
    title: "Choose your car",
    body: "Pick a city, your dates and a car that suits the trip. Share the details with us on WhatsApp or call.",
  },
  {
    icon: IdCard,
    title: "Quick document check",
    body: "Keep your driving licence and a government photo ID handy. We verify them at pickup in a few minutes.",
  },
  {
    icon: KeyRound,
    title: "Take the keys and go",
    body: "Collect the car or get it delivered in select areas. Drive it for the full rental period and return on time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-navy-50 py-14 sm:py-20 lg:py-28">
      <div className="container">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Three steps to the open road."
          description="No paperwork piles, no waiting around. Booking a self-drive car takes minutes."
        />
        <ol className="relative mt-8 grid gap-3 sm:mt-14 sm:gap-5 md:grid-cols-3">
          <span
            aria-hidden
            className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-navy-200 md:block"
          />
          {steps.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <li className="relative flex h-full items-start gap-4 rounded-3xl bg-white p-5 shadow-[0_18px_40px_-34px_rgba(14,29,38,0.5)] md:flex-col md:items-center md:p-8 md:text-center">
                <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-navy-900 text-lime md:size-20 md:rounded-full md:ring-8 md:ring-navy-50">
                  <Icon className="size-6 md:size-8" />
                  <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-lime font-display text-xs font-extrabold text-navy-900 md:size-7 md:text-sm">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-900 md:mt-6 md:text-xl">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy-500 md:mt-3 md:text-base">{body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
