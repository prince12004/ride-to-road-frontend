import type { Metadata } from "next";
import { LegalPageView } from "@/components/legal/legal-page-view";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Ride to Road's refund policy for self-drive car rental bookings.",
};

export default function RefundPolicyPage() {
  return <LegalPageView contentKey="refund-policy" />;
}
