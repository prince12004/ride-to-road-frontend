import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CarCard } from "@/components/cards/car-card";
import { ProseContent } from "@/components/legal/prose-content";
import { Cta } from "@/components/sections/cta";
import { getLandingPage } from "@/lib/content";
import { buildMetadata, imageUrl } from "@/lib/seo";
import { CustomJsonLd, JsonLd, breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * SEO landing pages (Admin → SEO → Landing Pages), served at /<slug>.
 * Fixed routes like /cars or /faq always win over this dynamic segment.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  if (!page) return {};
  return buildMetadata({
    path: `/${page.slug}`,
    title: page.h1,
    description: page.intro || page.h1,
    image: imageUrl(page.heroImage),
    seo: page,
  });
}

export default async function LandingPageView({ params }: Props) {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  if (!page) notFound();

  const hero = page.heroImage?.url;
  const carsHeading = page.carsHeading || (page.location ? `Self-drive cars available in ${page.location.city}` : "Cars you can book");
  const browseHref = page.location ? `/cars?city=${encodeURIComponent(page.location.city)}` : "/cars";
  const faqSchema = faqPageSchema(page.faqs);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: page.title || page.h1, path: `/${page.slug}` },
          ]),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <CustomJsonLd value={page.customSchema} />
      <section className="relative isolate overflow-hidden bg-navy-950 bg-lanes py-14 lg:py-20">
        {hero && (
          <>
            <Image src={hero} alt={page.heroImage?.alt || page.h1} fill priority sizes="100vw" className="-z-10 object-cover" />
            <div className="absolute inset-0 -z-10 bg-navy-950/75" />
          </>
        )}
        <div className="container max-w-4xl">
          {page.location && (
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-lime">
              <MapPin className="size-3.5" /> {page.location.city}
            </p>
          )}
          <h1 className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
            {page.h1}
          </h1>
          {page.intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-200">{page.intro}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="lime">
              <Link href={browseHref}>
                Browse cars <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="whatsapp">
              <a href={whatsappLink(`Hi Ride to Road, I'm interested in: ${page.h1}`)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> Ask on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {page.cars.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="container">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">{carsHeading}</h2>
              <Link href={browseHref} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-deep hover:underline">
                See all cars <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {page.cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>
      )}

      {page.content && (
        <section className={page.cars.length > 0 ? "border-t border-navy-100 py-12 lg:py-16" : "py-12 lg:py-16"}>
          <div className="container max-w-3xl">
            <ProseContent html={page.content} />
          </div>
        </section>
      )}

      {page.faqs.length > 0 && (
        <section className="bg-navy-50 py-12 lg:py-16">
          <div className="container max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">Frequently asked questions</h2>
            <Accordion type="single" collapsible defaultValue="faq-0" className="mt-6 border-t border-navy-200">
              {page.faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{f.question}</AccordionTrigger>
                  <AccordionContent className="max-w-none whitespace-pre-line">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      <Cta />
    </>
  );
}
