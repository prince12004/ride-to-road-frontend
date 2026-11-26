import type { Metadata } from "next";
import { staticPageMetadata } from "@/lib/seo";
import { LegalPageView } from "@/components/legal/legal-page-view";

export function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata("/privacy-policy", {
    title: "Privacy Policy",
    description: "How Ride to Road collects, uses and protects your personal information.",
  });
}

export default function PrivacyPolicyPage() {
  return <LegalPageView contentKey="privacy-policy" />;
}
