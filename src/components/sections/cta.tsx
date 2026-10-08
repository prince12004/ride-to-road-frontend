import Image from "next/image";
import { Phone } from "lucide-react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";

export function Cta() {
  return (
    <section className="relative isolate overflow-hidden py-24 lg:py-32">
      <Image src="/images/cta-road.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover" />
      <div className="absolute inset-0 -z-10 bg-navy-950/75" />
      <div className="container text-center">
        <h2 className="mx-auto max-w-3xl text-balance font-display text-4xl font-extrabold leading-[1] tracking-tight text-white sm:text-6xl">
          The road is waiting. <span className="italic text-lime">Are you?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-navy-200">
          Tell us where and when. We'll have the keys ready.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="whatsapp">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <WhatsappIcon /> Book on WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" variant="ghostLight">
            <a href={`tel:${siteConfig.contact.phone}`}>
              <Phone /> {siteConfig.contact.phoneDisplay}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
