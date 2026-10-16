import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Fuel, MapPin, Settings2, Users, Check, ShieldCheck, Truck, FileCheck2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CarGallery } from "@/components/cards/car-gallery";
import { getCarBySlug } from "@/lib/content";
import { formatINR } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return {};
  return {
    title: `${car.name} Self Drive Rental`,
    description: car.description || `Book the ${car.name} for self-drive rental starting at ${formatINR(car.pricePerDay)}/day.`,
  };
}

const DOCUMENTS_REQUIRED = ["Aadhaar Card (front & back)", "PAN Card", "Valid Driving Licence (1+ year old)", "Selfie with Driving Licence"];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Fully insured" },
  { icon: Sparkles, label: "Sanitised before every trip" },
  { icon: FileCheck2, label: "Instant confirmation" },
];

interface CarDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CarDetailPage({ params, searchParams }: CarDetailPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const forwardedQuery = new URLSearchParams();
  for (const key of ["city", "pickupDate", "pickupTime", "returnDate", "returnTime"]) {
    if (search[key]) forwardedQuery.set(key, search[key]!);
  }
  const searchQuery = forwardedQuery.toString() ? `?${forwardedQuery.toString()}` : "";

  const location = typeof car.location === "object" ? car.location : null;
  const images = [car.image, ...car.gallery.filter((g) => g !== car.image)];
  const isBookable = car.status === "AVAILABLE";

  return (
    <>
      <section className="bg-navy-950 bg-lanes py-14 lg:py-16">
        <div className="container">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="lime">{car.category}</Badge>
            {location && (
              <Badge variant="outline" className="border-white/20 text-white">
                <MapPin className="mr-1 size-3" /> {location.city}
              </Badge>
            )}
            {!isBookable && <Badge variant="destructive">Currently unavailable</Badge>}
          </div>
          <h1 className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1] tracking-tight text-white sm:text-5xl">
            {car.name}
          </h1>
          <p className="mt-3 text-navy-300">{car.brand}</p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 text-sm text-navy-200">
                <Icon className="size-4 text-lime" /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <CarGallery images={images} alt={car.name} />

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SpecTile icon={Users} label="Seats" value={String(car.seats)} />
              <SpecTile icon={Settings2} label="Transmission" value={car.transmission} />
              <SpecTile icon={Fuel} label="Fuel" value={car.fuel} />
              {car.specifications.slice(0, 4).map((s) => (
                <SpecTile key={s.label} icon={Check} label={s.label} value={s.value} />
              ))}
            </div>

            {car.description && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-navy-900">About this car</h2>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-navy-600">{car.description}</p>
              </div>
            )}

            {car.features.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-navy-900">Features</h2>
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {car.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 rounded-xl border border-navy-100 px-3 py-2.5 text-sm text-navy-700">
                      <Check className="size-4 text-brand-deep" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 rounded-3xl border border-navy-100 p-6">
              <h2 className="font-display text-lg font-bold text-navy-900">Documents Required</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {DOCUMENTS_REQUIRED.map((doc) => (
                  <li key={doc} className="flex items-center gap-2 text-sm text-navy-600">
                    <Check className="size-4 shrink-0 text-brand-deep" /> {doc}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-2xl bg-navy-50 p-3 text-xs text-navy-500">
                Documents are verified under your account once — after that, booking any car takes seconds.
              </p>
            </div>
          </div>

          <div>
            <Card className="sticky top-24 overflow-hidden p-0 shadow-[0_30px_80px_-20px_rgba(8,19,26,0.25)]">
              <div className="bg-navy-950 bg-lanes p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime">Starting at</p>
                <p className="mt-1 font-display text-3xl font-extrabold text-white">
                  {formatINR(car.pricePerHour || car.pricePerDay)}
                  <span className="text-sm font-medium text-navy-300">{car.pricePerHour ? "/hr" : "/day"}</span>
                </p>
                {car.pricePerHour && (
                  <p className="mt-1 text-xs text-navy-300">or {formatINR(car.pricePerDay)}/day for longer trips</p>
                )}
              </div>

              <div className="p-6">
                <dl className="space-y-2.5 text-sm">
                  {car.securityDeposit ? (
                    <div className="flex justify-between">
                      <dt className="text-navy-500">Security deposit (refundable)</dt>
                      <dd className="font-semibold text-navy-900">{formatINR(car.securityDeposit)}</dd>
                    </div>
                  ) : null}
                  {car.homeDelivery?.available && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5 text-navy-500">
                        <Truck className="size-4 text-navy-400" /> Home delivery
                      </dt>
                      <dd className="font-semibold text-navy-900">+{formatINR(car.homeDelivery.price)}</dd>
                    </div>
                  )}
                </dl>

                <Button asChild size="lg" className="mt-6 w-full">
                  <Link href={isBookable ? `/book/${car.slug}${searchQuery}` : "#"} aria-disabled={!isBookable}>
                    {isBookable ? "Book Now" : "Currently Unavailable"} <ArrowRight />
                  </Link>
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-navy-400">
                  <ShieldCheck className="size-3.5" /> Pay by cash at pickup or UPI QR
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      {isBookable && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-navy-100 bg-white p-3 shadow-[0_-8px_30px_-10px_rgba(8,19,26,0.15)] lg:hidden">
          <div>
            <p className="text-xs text-navy-400">From</p>
            <p className="font-display text-lg font-extrabold text-navy-900">
              {formatINR(car.pricePerHour || car.pricePerDay)}
              {car.pricePerHour ? "/hr" : "/day"}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={`/book/${car.slug}${searchQuery}`}>Book Now</Link>
          </Button>
        </div>
      )}
    </>
  );
}

function SpecTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-navy-100 p-3 text-center">
      <Icon className="size-5 text-brand-deep" />
      <p className="text-sm font-semibold text-navy-900">{value}</p>
      <p className="text-xs text-navy-400">{label}</p>
    </div>
  );
}
