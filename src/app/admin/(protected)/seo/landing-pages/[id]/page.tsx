"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PermissionGate } from "@/components/admin/permission-gate";
import { LandingPageForm } from "@/components/admin/landing-page-form";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminLandingPage } from "@/types";

export default function EditLandingPage() {
  return (
    <PermissionGate module="seo">
      <EditLandingPageContent />
    </PermissionGate>
  );
}

function EditLandingPageContent() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<AdminLandingPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminLandingPage>(`/admin/landing-pages/${id}`)
      .then((res) => setPage(res.data))
      .catch((err) => {
        toast({ title: "Could not load page", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy-400" />
      </div>
    );
  }
  if (!page) return <p className="text-sm text-navy-500">Landing page not found.</p>;

  return (
    <div>
      <PageHeader title={`Edit: ${page.title}`} description={`/${page.slug}`} />
      <LandingPageForm initial={page} />
    </div>
  );
}
