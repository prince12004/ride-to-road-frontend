"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin/tabs";
import { ImageUploader } from "@/components/admin/image-uploader";
import { PageHeader } from "@/components/admin/page-header";
import { PermissionGate } from "@/components/admin/permission-gate";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { CmsSettings } from "@/types";

export default function AdminSettingsPage() {
  return (
    <PermissionGate module="settings">
      <AdminSettingsContent />
    </PermissionGate>
  );
}

function AdminSettingsContent() {
  const [settings, setSettings] = useState<CmsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<CmsSettings>("/admin/cms/settings")
      .then((res) => setSettings(res.data))
      .catch((err) => {
        toast({ title: "Could not load settings", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (partial: Partial<CmsSettings>) => {
    if (!settings) return;
    setSaving(true);
    try {
      const merged = { ...settings, ...partial };
      await apiFetch("/admin/cms/settings", { method: "PUT", body: JSON.stringify(merged) });
      setSettings(merged);
      toast({ title: "Settings saved", variant: "success" });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!settings) return <p className="text-sm text-navy-500">Could not load settings.</p>;

  return (
    <div>
      <PageHeader title="Settings" description="Site-wide configuration used across the public site." />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="booking">Booking Rules</TabsTrigger>
          <TabsTrigger value="seo">SEO Defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab settings={settings} onSave={save} saving={saving} />
        </TabsContent>
        <TabsContent value="booking">
          <BookingTab settings={settings} onSave={save} saving={saving} />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab settings={settings} onSave={save} saving={saving} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralTab({
  settings,
  onSave,
  saving,
}: {
  settings: CmsSettings;
  onSave: (p: Partial<CmsSettings>) => void;
  saving: boolean;
}) {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [logo, setLogo] = useState(settings.logo ?? null);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [email, setEmail] = useState(settings.email ?? "");
  const [address, setAddress] = useState(settings.address ?? "");
  const [instagram, setInstagram] = useState(settings.socialLinks?.instagram ?? "");
  const [facebook, setFacebook] = useState(settings.socialLinks?.facebook ?? "");
  const [youtube, setYoutube] = useState(settings.socialLinks?.youtube ?? "");
  const [x, setX] = useState(settings.socialLinks?.x ?? "");

  return (
    <Card className="p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Company Name</Label>
          <Input className="mt-1.5" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div>
          <Label>WhatsApp Number</Label>
          <Input className="mt-1.5" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
          <p className="mt-1 text-xs text-navy-400">Single source of truth used across the public site.</p>
        </div>
        <div>
          <Label>Phone (optional)</Label>
          <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>Email (optional)</Label>
          <Input className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Address (optional)</Label>
          <Input className="mt-1.5" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        <ImageUploader label="Logo" value={logo} onChange={setLogo} folder="cms" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Instagram</Label>
          <Input className="mt-1.5" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </div>
        <div>
          <Label>Facebook</Label>
          <Input className="mt-1.5" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        </div>
        <div>
          <Label>YouTube</Label>
          <Input className="mt-1.5" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
        </div>
        <div>
          <Label>X (Twitter)</Label>
          <Input className="mt-1.5" value={x} onChange={(e) => setX(e.target.value)} />
        </div>
      </div>

      <Button
        className="mt-6"
        disabled={saving}
        onClick={() =>
          onSave({
            companyName,
            logo: logo ?? undefined,
            whatsappNumber,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            socialLinks: { instagram: instagram || undefined, facebook: facebook || undefined, youtube: youtube || undefined, x: x || undefined },
          })
        }
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save General Settings
      </Button>
    </Card>
  );
}

function BookingTab({
  settings,
  onSave,
  saving,
}: {
  settings: CmsSettings;
  onSave: (p: Partial<CmsSettings>) => void;
  saving: boolean;
}) {
  const [minRentalHours, setMinRentalHours] = useState(String(settings.booking?.minRentalHours ?? 4));
  const [maxRentalDays, setMaxRentalDays] = useState(String(settings.booking?.maxRentalDays ?? 30));
  const [taxPercent, setTaxPercent] = useState(String(settings.booking?.taxPercent ?? 0));
  const [cancellationRulesText, setCancellationRulesText] = useState(settings.booking?.cancellationRulesText ?? "");

  return (
    <Card className="p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Min Rental Hours</Label>
          <Input className="mt-1.5" type="number" value={minRentalHours} onChange={(e) => setMinRentalHours(e.target.value)} />
        </div>
        <div>
          <Label>Max Rental Days</Label>
          <Input className="mt-1.5" type="number" value={maxRentalDays} onChange={(e) => setMaxRentalDays(e.target.value)} />
        </div>
        <div>
          <Label>Tax Percent (%)</Label>
          <Input className="mt-1.5" type="number" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
          <p className="mt-1 text-xs text-navy-400">Real percentage applied to bookings.</p>
        </div>
      </div>
      <div className="mt-4">
        <Label>Cancellation Rules (optional)</Label>
        <Textarea className="mt-1.5" rows={5} value={cancellationRulesText} onChange={(e) => setCancellationRulesText(e.target.value)} />
      </div>
      <Button
        className="mt-6"
        disabled={saving}
        onClick={() =>
          onSave({
            booking: {
              minRentalHours: Number(minRentalHours),
              maxRentalDays: Number(maxRentalDays),
              taxPercent: Number(taxPercent),
              cancellationRulesText: cancellationRulesText || undefined,
            },
          })
        }
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save Booking Rules
      </Button>
    </Card>
  );
}

function SeoTab({
  settings,
  onSave,
  saving,
}: {
  settings: CmsSettings;
  onSave: (p: Partial<CmsSettings>) => void;
  saving: boolean;
}) {
  const [defaultSeoTitle, setDefaultSeoTitle] = useState(settings.seo?.defaultSeoTitle ?? "");
  const [defaultDescription, setDefaultDescription] = useState(settings.seo?.defaultDescription ?? "");
  const [defaultOgImage, setDefaultOgImage] = useState(settings.seo?.defaultOgImage ?? null);

  return (
    <Card className="p-6">
      <div>
        <Label>Default SEO Title</Label>
        <Input className="mt-1.5" value={defaultSeoTitle} onChange={(e) => setDefaultSeoTitle(e.target.value)} />
      </div>
      <div className="mt-4">
        <Label>Default Meta Description</Label>
        <Textarea className="mt-1.5" value={defaultDescription} onChange={(e) => setDefaultDescription(e.target.value)} />
      </div>
      <div className="mt-4">
        <ImageUploader label="Default OG Image" value={defaultOgImage} onChange={setDefaultOgImage} folder="cms" />
      </div>
      <Button
        className="mt-6"
        disabled={saving}
        onClick={() =>
          onSave({
            seo: {
              defaultSeoTitle: defaultSeoTitle || undefined,
              defaultDescription: defaultDescription || undefined,
              defaultOgImage: defaultOgImage ?? undefined,
            },
          })
        }
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save SEO Defaults
      </Button>
    </Card>
  );
}
