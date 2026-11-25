import type { Metadata } from "next";
import { LegalPageView } from "@/components/legal/legal-page-view";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ride to Road collects, uses and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return <LegalPageView contentKey="privacy-policy" />;
}
