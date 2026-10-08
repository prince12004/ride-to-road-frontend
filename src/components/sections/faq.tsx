import { MessageCircle } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/whatsapp";
import type { Faq as FaqType } from "@/types";

export function Faq({ faqs }: { faqs: FaqType[] }) {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-navy-100 py-20 lg:py-28">
      <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading eyebrow="FAQ" title="Questions, answered." />
          <p className="mt-4 text-navy-500">Didn't find what you were looking for?</p>
          <Button asChild variant="outline" className="mt-5">
            <a href={whatsappLink("Hi Ride to Road, I have a question about self-drive rentals.")} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Ask us on WhatsApp
            </a>
          </Button>
        </div>
        <Accordion type="single" collapsible defaultValue={faqs[0]?.id} className="border-t border-navy-100">
          {faqs.map((f) => (
            <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger>{f.question}</AccordionTrigger>
              <AccordionContent>{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
