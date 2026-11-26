import type { Metadata } from "next";
import { staticPageMetadata } from "@/lib/seo";
import { LegalPageView } from "@/components/legal/legal-page-view";

export function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata("/refund-policy", {
    title: "Refund Policy",
    description: "Ride to Road's refund policy for self-drive car rental bookings.",
  });
}

export default function RefundPolicyPage() {
  return <LegalPageView contentKey="refund-policy" />;
}
