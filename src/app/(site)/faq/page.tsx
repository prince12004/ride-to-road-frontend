import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getFaqs } from "@/lib/content";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about self-drive car rentals with Ride to Road.",
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <>
      <section className="bg-navy-950 bg-lanes py-14 lg:py-16">
        <div className="container text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">FAQ</p>
          <h1 className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1] tracking-tight text-white sm:text-5xl">
            Questions, answered.
          </h1>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container max-w-3xl">
          {faqs.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-navy-200 bg-navy-50 p-10 text-center text-navy-500">
              No FAQs published yet.
            </p>
          ) : (
            <Accordion type="single" collapsible defaultValue={faqs[0]?.id} className="border-t border-navy-100">
              {faqs.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger>{f.question}</AccordionTrigger>
                  <AccordionContent className="max-w-none">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          <div className="mt-12 rounded-3xl border border-navy-100 bg-navy-50 p-8 text-center">
            <h2 className="font-display text-xl font-bold text-navy-900">Still have questions?</h2>
            <p className="mt-2 text-navy-500">Our team is happy to help over WhatsApp.</p>
            <Button asChild variant="whatsapp" className="mt-5">
              <a
                href={whatsappLink("Hi Ride to Road, I have a question about self-drive rentals.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" /> Ask us on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
