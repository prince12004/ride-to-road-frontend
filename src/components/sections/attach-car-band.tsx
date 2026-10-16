import { CarFront, ClipboardList, MessageCircle, PhoneCall } from "lucide-react";
import { AttachCarDialog } from "@/components/attach-car/attach-car-dialog";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: ClipboardList, label: "Share your car details" },
  { icon: MessageCircle, label: "Send them to us on WhatsApp" },
  { icon: PhoneCall, label: "Our team calls you back" },
];

export function AttachCarBand() {
  return (
    <section id="attach-your-car" className="scroll-mt-20 py-12 sm:py-16 lg:py-20">
      <div className="container">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy-950 bg-lanes p-6 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="pointer-events-none absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-lime/20 blur-[100px]" />
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-lime">
                <span className="h-px w-6 bg-current" />
                For car owners
              </p>
              <h2 className="mt-4 text-balance font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl">
                Own a car? <span className="text-lime">Attach it with Ride to Road.</span>
              </h2>
              <p className="mt-4 text-navy-300">
                List your car on our self-drive platform. Tell us about it in a minute and our team will get in touch.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-navy-200 sm:grid-cols-3">
                {steps.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-lime" /> {label}
                  </li>
                ))}
              </ul>
            </div>
            <AttachCarDialog>
              <Button size="lg" className="mt-8 w-full shrink-0 sm:w-auto lg:mt-0">
                <CarFront /> Attach Your Car
              </Button>
            </AttachCarDialog>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
