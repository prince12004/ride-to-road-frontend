"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { PermissionGate } from "@/components/admin/permission-gate";
import { ImageUploader } from "@/components/admin/image-uploader";
import { LabelWithCounter } from "@/components/admin/seo-fields";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { ImageRef } from "@/types";

interface SeoSettingsResponse {
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  seo?: {
    defaultSeoTitle?: string;
    defaultDescription?: string;
    defaultOgImage?: ImageRef | null;
    businessType?: string;
    priceRange?: string;
    openingHours?: string;
    areaServed?: string[];
    latitude?: number;
    longitude?: number;
  };
}

const BUSINESS_TYPES = [
  { value: "AutoRental", label: "AutoRental (car rental business)" },
  { value: "LocalBusiness", label: "LocalBusiness (generic)" },
  { value: "Organization", label: "Organization (no physical location)" },
];

export default function SeoSettingsPage() {
  return (
    <PermissionGate module="seo">
      <SeoSettingsContent />
    </PermissionGate>
  );
}

function SeoSettingsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<Pick<SeoSettingsResponse, "companyName" | "phone" | "email" | "address">>({});
  const [form, setForm] = useState({
    defaultSeoTitle: "",
    defaultDescription: "",
    defaultOgImage: null as ImageRef | null,
    businessType: "AutoRental",
    priceRange: "",
    openingHours: "",
    areaServed: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    apiFetch<SeoSettingsResponse>("/admin/seo/settings")
      .then(({ data }) => {
        const s = data?.seo ?? {};
        setBusiness({ companyName: data?.companyName, phone: data?.phone, email: data?.email, address: data?.address });
        setForm({
          defaultSeoTitle: s.defaultSeoTitle ?? "",
          defaultDescription: s.defaultDescription ?? "",
          defaultOgImage: s.defaultOgImage ?? null,
          businessType: s.businessType || "AutoRental",
          priceRange: s.priceRange ?? "",
          openingHours: s.openingHours ?? "",
          areaServed: (s.areaServed ?? []).join(", "),
          latitude: s.latitude !== undefined && s.latitude !== null ? String(s.latitude) : "",
          longitude: s.longitude !== undefined && s.longitude !== null ? String(s.longitude) : "",
        });
      })
      .catch((err) => toast({ title: "Could not load settings", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" }))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/admin/seo/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          areaServed: form.areaServed.split(",").map((c) => c.trim()).filter(Boolean),
        }),
      });
      toast({ title: "SEO settings saved", description: "Live on the website within a few seconds.", variant: "success" });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy-400" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Site SEO Settings" description="Site-wide defaults and the business details used in the structured data (schema) on every page." />

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Defaults</h2>
          <p className="mt-1 text-xs text-navy-400">Used by pages that don&apos;t have their own title, description or share image.</p>
          <div className="mt-4 space-y-4">
            <div>
              <LabelWithCounter label="Fallback SEO title" value={form.defaultSeoTitle} max={60} />
              <Input className="mt-1.5" value={form.defaultSeoTitle} onChange={(e) => set("defaultSeoTitle", e.target.value)} />
            </div>
            <div>
              <LabelWithCounter label="Default meta description" value={form.defaultDescription} max={160} />
              <Textarea className="mt-1.5" value={form.defaultDescription} onChange={(e) => set("defaultDescription", e.target.value)} />
            </div>
            <ImageUploader label="Default social share image" value={form.defaultOgImage} onChange={(img) => set("defaultOgImage", img)} folder="cms" />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Business schema</h2>
          <p className="mt-1 text-xs text-navy-400">
            Added to every page as {form.businessType} structured data. Name, phone, email and address come from Settings → General
            {business.companyName ? ` (currently “${business.companyName}”${business.phone ? `, ${business.phone}` : ""})` : ""}.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Business type</Label>
              <Select value={form.businessType} onValueChange={(v) => set("businessType", v)}>
                <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price range</Label>
              <Input className="mt-1.5" value={form.priceRange} onChange={(e) => set("priceRange", e.target.value)} placeholder="e.g. ₹1500 - ₹8000" />
            </div>
            <div className="sm:col-span-2">
              <Label>Areas served (comma separated)</Label>
              <Input className="mt-1.5" value={form.areaServed} onChange={(e) => set("areaServed", e.target.value)} placeholder="Noida, Delhi, Gurgaon, Ghaziabad, Greater Noida" />
            </div>
            <div className="sm:col-span-2">
              <Label>Opening hours</Label>
              <Input className="mt-1.5" value={form.openingHours} onChange={(e) => set("openingHours", e.target.value)} placeholder="Mo-Su 00:00-23:59" />
              <p className="mt-1 text-xs text-navy-400">schema.org format: days (Mo Tu We Th Fr Sa Su) and 24h times, e.g. “Mo-Sa 09:00-21:00”.</p>
            </div>
            <div>
              <Label>Latitude (optional)</Label>
              <Input className="mt-1.5" inputMode="decimal" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="28.5355" />
            </div>
            <div>
              <Label>Longitude (optional)</Label>
              <Input className="mt-1.5" inputMode="decimal" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="77.3910" />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save SEO Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
