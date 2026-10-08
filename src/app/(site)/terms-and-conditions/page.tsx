import type { Metadata } from "next";
import { LegalPageView } from "@/components/legal/legal-page-view";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using Ride to Road's self-drive car rental service.",
};

export default function TermsAndConditionsPage() {
  return <LegalPageView contentKey="terms-and-conditions" />;
}
