import type { Offer } from "@/types";

/** DEMO DATA — replace with the `coupons` / `offers` collection. */
export const featuredOffer: Offer = {
  id: "o1",
  code: "WEEKEND",
  eyebrow: "Weekend Drive",
  title: "Make your weekend count.",
  description: "Get special rates on selected weekend rentals. Friday evening to Monday morning, sorted.",
  terms: "Valid on selected cars and dates. Subject to availability.",
  image: "/images/offer-weekend.jpg",
  ctaLabel: "Explore Offers",
  ctaHref: "/cars",
};
