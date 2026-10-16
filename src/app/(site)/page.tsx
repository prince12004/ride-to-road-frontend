import { AttachCarBand } from "@/components/sections/attach-car-band";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";
import { FeaturedCars } from "@/components/sections/featured-cars";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Locations } from "@/components/sections/locations";
import { OfferBanner } from "@/components/sections/offer-banner";
import { Stories } from "@/components/sections/stories";
import { Testimonials } from "@/components/sections/testimonials";
import { WhyUs } from "@/components/sections/why-us";
import {
  getBlogPosts,
  getFaqs,
  getFeaturedOffer,
  getHomeCars,
  getJourneys,
  getLocations,
  getTestimonials,
} from "@/lib/content";

export default async function HomePage() {
  const [cars, locations, journeys, offer, testimonials, posts, faqs] = await Promise.all([
    getHomeCars(8),
    getLocations(),
    getJourneys(),
    getFeaturedOffer(),
    getTestimonials(),
    getBlogPosts(3),
    getFaqs(),
  ]);

  return (
    <>
      <Hero cities={locations.map((l) => l.city)} />
      <FeaturedCars cars={cars} />
      <HowItWorks />
      <Locations locations={locations} journeys={journeys} />
      {offer && <OfferBanner offer={offer} />}
      <WhyUs />
      <AttachCarBand />
      {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}
      {posts.length > 0 && <Stories posts={posts} />}
      {faqs.length > 0 && <Faq faqs={faqs} />}
      <Cta />
    </>
  );
}
