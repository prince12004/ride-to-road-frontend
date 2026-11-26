import type { Metadata } from "next";
import { staticPageMetadata } from "@/lib/seo";
import { LegalPageView } from "@/components/legal/legal-page-view";

export function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata("/cancellation-policy", {
    title: "Cancellation Policy",
    description: "Ride to Road's cancellation policy for self-drive car rental bookings.",
  });
}

export default function CancellationPolicyPage() {
  return <LegalPageView contentKey="cancellation-policy" />;
}
