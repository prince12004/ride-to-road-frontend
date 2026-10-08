import type { Faq } from "@/types";

/** DEMO DATA — confirm final policy wording with the business before launch. */
export const faqs: Faq[] = [
  {
    id: "f1",
    question: "How does self-drive rental work?",
    answer:
      "Choose a car, pick your dates and pickup location, and confirm your booking. After a quick document check at pickup, the car is yours to drive for the full rental period. Return it at the agreed time and location.",
  },
  {
    id: "f2",
    question: "What documents are required?",
    answer:
      "A valid driving licence and a government-issued photo ID (such as Aadhaar or passport). Our team may ask for an additional address proof for some bookings.",
  },
  {
    id: "f3",
    question: "What is the minimum rental duration?",
    answer:
      "Most cars can be booked for a minimum of 24 hours. Shorter durations may be available on selected cars — message us on WhatsApp to check.",
  },
  {
    id: "f4",
    question: "Can I extend my booking?",
    answer:
      "Yes, subject to availability. Let us know before your return time and we'll confirm the extension and updated charges.",
  },
  {
    id: "f5",
    question: "What happens if I need to cancel?",
    answer:
      "Cancellations are handled as per our cancellation policy, which depends on how close to pickup you cancel. The applicable terms are shared clearly at the time of booking.",
  },
  {
    id: "f6",
    question: "Is doorstep delivery available?",
    answer:
      "Doorstep delivery and pickup are available in selected areas for an additional charge. Share your address while booking and we'll confirm.",
  },
];
