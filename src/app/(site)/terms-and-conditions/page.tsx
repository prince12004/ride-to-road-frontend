import type { Metadata } from "next";
import { staticPageMetadata } from "@/lib/seo";
import { LegalPageView } from "@/components/legal/legal-page-view";

export function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata("/terms-and-conditions", {
    title: "Terms & Conditions",
    description: "Terms and conditions for using Ride to Road's self-drive car rental service.",
  });
}

export default function TermsAndConditionsPage() {
  return <LegalPageView contentKey="terms-and-conditions" />;
}
