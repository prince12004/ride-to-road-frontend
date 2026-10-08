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
    <section id="how-it-works" className="scroll-mt-20 bg-navy-50 py-20 lg:py-28">
      <div className="container">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Three steps to the open road."
          description="No paperwork piles, no waiting around. Booking a self-drive car takes minutes."
        />
        <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
          <span
            aria-hidden
            className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-navy-200 md:block"
          />
          {steps.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <li className="relative flex h-full flex-col items-center rounded-3xl bg-white p-8 text-center">
                <span className="relative grid size-20 place-items-center rounded-full bg-navy-900 text-lime ring-8 ring-navy-50">
                  <Icon className="size-8" />
                  <span className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-lime font-display text-sm font-extrabold text-navy-900">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-6 font-display text-xl font-bold text-navy-900">{title}</h3>
                <p className="mt-3 leading-relaxed text-navy-500">{body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
