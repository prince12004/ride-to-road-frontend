import type { Metadata } from "next";
import { LegalPageView } from "@/components/legal/legal-page-view";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description: "Ride to Road's cancellation policy for self-drive car rental bookings.",
};

export default function CancellationPolicyPage() {
  return <LegalPageView contentKey="cancellation-policy" />;
}
