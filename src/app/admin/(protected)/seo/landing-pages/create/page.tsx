"use client";

import { PageHeader } from "@/components/admin/page-header";
import { PermissionGate } from "@/components/admin/permission-gate";
import { LandingPageForm } from "@/components/admin/landing-page-form";

export default function CreateLandingPage() {
  return (
    <PermissionGate module="seo">
      <PageHeader title="New Landing Page" description="A location or service page with its own URL, H1, content, cars and FAQs." />
      <LandingPageForm />
    </PermissionGate>
  );
}
