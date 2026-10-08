import { siteConfig } from "@/config/site";

const DEFAULT_MESSAGE =
  "Hi Ride to Road, I'd like to book a self-drive car. Please share availability.";

/** Builds a wa.me deep link with a prefilled message. */
export function whatsappLink(message: string = DEFAULT_MESSAGE) {
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function carEnquiryLink(carName: string) {
  return whatsappLink(
    `Hi Ride to Road, I'm interested in the ${carName}. Could you share availability and pricing?`,
  );
}
