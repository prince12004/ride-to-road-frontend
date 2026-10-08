import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/contact/contact-form";
import { ApiClientError, serverFetch } from "@/lib/api";
import { getSiteContent } from "@/lib/content";
import { whatsappLink } from "@/lib/whatsapp";

interface Settings {
  companyName: string;
  whatsappNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
}

async function getSettings() {
  try {
    const res = await serverFetch<Settings>("/settings", { revalidate: 60 });
    return res.data;
  } catch (err) {
    if (err instanceof ApiClientError) return null;
    throw err;
  }
}

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Ride to Road team for bookings, support or general queries.",
};

export default async function ContactUsPage() {
  const [settings, intro] = await Promise.all([getSettings(), getSiteContent("contact-us")]);

  return (
    <>
      <section className="bg-navy-950 bg-lanes py-14 lg:py-16">
        <div className="container">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">Contact</p>
          <h1 className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1] tracking-tight text-white sm:text-5xl">
            Get in touch.
          </h1>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            {intro?.content && <p className="leading-relaxed text-navy-600">{intro.content}</p>}

            <Card className={intro?.content ? "mt-6 divide-y divide-navy-100 p-2" : "divide-y divide-navy-100 p-2"}>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-navy-50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime/20 text-brand-deep">
                  <MessageCircle className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-navy-400">WhatsApp</p>
                  <p className="font-semibold text-navy-900">Chat with us</p>
                </div>
              </a>

              {settings?.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-navy-50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime/20 text-brand-deep">
                    <Phone className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-navy-400">Phone</p>
                    <p className="font-semibold text-navy-900">{settings.phone}</p>
                  </div>
                </a>
              )}

              {settings?.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-navy-50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime/20 text-brand-deep">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-navy-400">Email</p>
                    <p className="font-semibold text-navy-900">{settings.email}</p>
                  </div>
                </a>
              )}

              {settings?.address && (
                <div className="flex items-center gap-3 rounded-2xl p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime/20 text-brand-deep">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-navy-400">Address</p>
                    <p className="font-semibold text-navy-900">{settings.address}</p>
                  </div>
                </div>
              )}
            </Card>

            <Button asChild size="lg" variant="whatsapp" className="mt-6 w-full">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> Message us on WhatsApp
              </a>
            </Button>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
