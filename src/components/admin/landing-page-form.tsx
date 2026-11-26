"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { CustomSchemaField, IndexingControls, LabelWithCounter, SlugInput, customSchemaError, toSlug } from "@/components/admin/seo-fields";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminLandingPage, Car, LandingCarsMode, LandingFaq, LandingPageType, Location } from "@/types";

type FormState = Omit<AdminLandingPage, "_id" | "updatedAt" | "publishedAt">;

const emptyForm: FormState = {
  title: "",
  slug: "",
  pageType: "location",
  h1: "",
  intro: "",
  heroImage: null,
  content: "",
  faqs: [],
  location: null,
  carsMode: "location",
  carsHeading: "",
  cars: [],
  status: "DRAFT",
  showInFooter: false,
  metaTitle: "",
  metaDescription: "",
  ogImage: null,
  canonicalUrl: "",
  noindex: false,
  nofollow: false,
  includeInSitemap: true,
  customSchema: "",
};

function toForm(p: AdminLandingPage): FormState {
  return {
    ...emptyForm,
    ...p,
    intro: p.intro ?? "",
    carsHeading: p.carsHeading ?? "",
    metaTitle: p.metaTitle ?? "",
    metaDescription: p.metaDescription ?? "",
    canonicalUrl: p.canonicalUrl ?? "",
    customSchema: p.customSchema ?? "",
    location: p.location ?? null,
    cars: (p.cars ?? []).map(String),
    faqs: p.faqs ?? [],
  };
}

export function LandingPageForm({ initial }: { initial?: AdminLandingPage }) {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(initial ? toForm(initial) : emptyForm);
  const [locations, setLocations] = useState<Location[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [submitting, setSubmitting] = useState<null | "DRAFT" | "PUBLISHED">(null);
  // New pages: the slug follows the H1 until it is edited by hand.
  const [autoSlug, setAutoSlug] = useState(!initial);

  useEffect(() => {
    // Public endpoints: an SEO-only admin may not have cars/locations permissions.
    apiFetch<Location[]>("/locations").then((r) => setLocations(r.data)).catch(() => {});
    apiFetch<Car[]>("/cars?limit=200").then((r) => setCars(r.data)).catch(() => {});
  }, []);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => setValues((s) => ({ ...s, [key]: val }));

  const setFaq = (i: number, patch: Partial<LandingFaq>) =>
    set("faqs", values.faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const moveFaq = (i: number, dir: -1 | 1) => {
    const next = [...values.faqs];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("faqs", next);
  };

  const toggleCar = (id: string) =>
    set("cars", values.cars.includes(id) ? values.cars.filter((c) => c !== id) : [...values.cars, id]);

  const save = async (status: "DRAFT" | "PUBLISHED") => {
    if (!values.title.trim() || !values.h1.trim()) {
      toast({ title: "Missing fields", description: "Page name and H1 heading are required.", variant: "error" });
      return;
    }
    const schemaError = customSchemaError(values.customSchema ?? "");
    if (schemaError) {
      toast({ title: "Fix the custom schema", description: schemaError, variant: "error" });
      return;
    }
    if (values.carsMode === "location" && !values.location) {
      toast({ title: "Choose a location", description: "Pick the city whose cars this page lists, or change “Cars on this page”.", variant: "error" });
      return;
    }
    setSubmitting(status);
    try {
      const payload = { ...values, slug: toSlug(values.slug) || toSlug(values.h1), status };
      const res = initial
        ? await apiFetch<AdminLandingPage>(`/admin/landing-pages/${initial._id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiFetch<AdminLandingPage>("/admin/landing-pages", { method: "POST", body: JSON.stringify(payload) });
      toast({
        title: status === "PUBLISHED" ? "Page published" : "Draft saved",
        description: status === "PUBLISHED" ? `Live at /${res.data.slug}` : undefined,
        variant: "success",
      });
      router.push("/admin/seo/landing-pages");
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(null);
    }
  };

  const isLive = initial?.status === "PUBLISHED";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(values.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
      }}
      className="space-y-6"
    >
      {isLive && (
        <a
          href={`/${initial!.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep hover:underline"
        >
          View live page /{initial!.slug} <ExternalLink className="size-3.5" />
        </a>
      )}

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Page</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Page name</Label>
            <Input className="mt-1.5" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Noida" />
            <p className="mt-1 text-xs text-navy-400">Shown in the admin list and as the footer link text.</p>
          </div>
          <div>
            <Label>Page type</Label>
            <Select value={values.pageType} onValueChange={(v) => set("pageType", v as LandingPageType)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="location">Location page (e.g. car rental in Noida)</SelectItem>
                <SelectItem value="service">Service page (e.g. monthly car rental)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <LabelWithCounter label="H1 heading" value={values.h1} max={70} />
            <Input
              className="mt-1.5"
              value={values.h1}
              onChange={(e) => {
                const h1 = e.target.value;
                setValues((s) => ({ ...s, h1, ...(autoSlug ? { slug: toSlug(h1) } : {}) }));
              }}
              placeholder="e.g. Self Drive Car Rental in Noida"
            />
          </div>
          <div className="sm:col-span-2">
            <SlugInput prefix="ridetoroad.com/" value={values.slug} onChange={(v) => { if (v !== values.slug) setAutoSlug(false); set("slug", v); }} originalSlug={isLive ? initial!.slug : undefined} />
          </div>
          <div className="sm:col-span-2">
            <Label>Intro (under the H1)</Label>
            <Textarea className="mt-1.5" rows={3} value={values.intro} onChange={(e) => set("intro", e.target.value)} placeholder="One or two sentences with the main keyword." />
          </div>
          <div className="sm:col-span-2">
            <ImageUploader label="Hero image (optional)" withAlt value={values.heroImage} onChange={(img) => set("heroImage", img)} folder="landing" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Cars on this page</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Show</Label>
            <Select value={values.carsMode} onValueChange={(v) => set("carsMode", v as LandingCarsMode)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="location">All cars offered in a location</SelectItem>
                <SelectItem value="selected">Cars I pick</SelectItem>
                <SelectItem value="none">No cars</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Location {values.carsMode === "location" ? "" : "(optional)"}</Label>
            <Select value={values.location ?? "none"} onValueChange={(v) => set("location", v === "none" ? null : v)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No location</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {values.carsMode !== "none" && (
            <div className="sm:col-span-2">
              <Label>Section heading (optional)</Label>
              <Input className="mt-1.5" value={values.carsHeading} onChange={(e) => set("carsHeading", e.target.value)} placeholder="e.g. Self-drive cars available in Noida" />
            </div>
          )}
          {values.carsMode === "selected" && (
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-navy-700">Pick cars ({values.cars.length} selected, shown in the order picked)</p>
              <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto rounded-2xl border border-navy-100 p-3 sm:grid-cols-2">
                {cars.map((c) => (
                  <label key={c.id} htmlFor={`car-${c.id}`} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-navy-50">
                    <Checkbox id={`car-${c.id}`} checked={values.cars.includes(c.id)} onCheckedChange={() => toggleCar(c.id)} />
                    <span className="text-sm text-navy-800">
                      {c.name} <span className="text-navy-400">· {c.brand}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Content</h2>
        <p className="mt-1 text-xs text-navy-400">The H1 above is the page title — structure this with Heading 2 and Heading 3. Link to related cars, blogs and pages.</p>
        <div className="mt-3">
          <RichTextEditor value={values.content} onChange={(html) => set("content", html)} folder="landing" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-navy-900">FAQs</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => set("faqs", [...values.faqs, { question: "", answer: "" }])}>
            <Plus className="size-4" /> Add FAQ
          </Button>
        </div>
        {values.faqs.length === 0 ? (
          <p className="mt-3 text-sm text-navy-400">No FAQs yet. Questions people search for (“Is fuel included?”) work well here.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {values.faqs.map((f, i) => (
              <div key={i} className="rounded-2xl border border-navy-100 p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input value={f.question} onChange={(e) => setFaq(i, { question: e.target.value })} placeholder="Question" aria-label={`FAQ ${i + 1} question`} />
                    <Textarea rows={3} value={f.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} placeholder="Answer" aria-label={`FAQ ${i + 1} answer`} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => moveFaq(i, -1)} disabled={i === 0} aria-label="Move up" className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50 disabled:opacity-30">
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => moveFaq(i, 1)} disabled={i === values.faqs.length - 1} aria-label="Move down" className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50 disabled:opacity-30">
                      <ArrowDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => set("faqs", values.faqs.filter((_, idx) => idx !== i))} aria-label="Remove FAQ" className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">SEO</h2>
        <div className="mt-4 space-y-4">
          <div>
            <LabelWithCounter label="Meta title" value={values.metaTitle ?? ""} max={60} />
            <Input className="mt-1.5" value={values.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder="Defaults to “<H1> | Ride to Road”" />
          </div>
          <div>
            <LabelWithCounter label="Meta description" value={values.metaDescription ?? ""} max={160} />
            <Textarea className="mt-1.5" value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} placeholder="Defaults to the intro" />
          </div>
          <ImageUploader label="Social share image (optional)" value={values.ogImage} onChange={(img) => set("ogImage", img)} folder="landing" />
          <IndexingControls idPrefix="landing" value={values} onChange={(patch) => setValues((s) => ({ ...s, ...patch }))} />
          <CustomSchemaField
            value={values.customSchema ?? ""}
            onChange={(v) => set("customSchema", v)}
            autoNote="Added automatically: FAQPage (from the FAQs above), breadcrumbs and business details."
          />
          <label htmlFor="landing-footer" className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-navy-100 p-3">
            <Checkbox id="landing-footer" checked={values.showInFooter} onCheckedChange={(v) => set("showInFooter", Boolean(v))} />
            <span>
              <span className="block text-sm font-semibold text-navy-800">Show in footer</span>
              <span className="block text-xs text-navy-500">Adds a link to this page under “Popular” in the footer of every page (max 12).</span>
            </span>
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" className="border-transparent" onClick={() => router.push("/admin/seo/landing-pages")}>
          Cancel
        </Button>
        <Button type="button" variant="outline" disabled={Boolean(submitting)} onClick={() => save("DRAFT")}>
          {submitting === "DRAFT" && <Loader2 className="size-4 animate-spin" />}
          {isLive ? "Unpublish & save as draft" : "Save draft"}
        </Button>
        <Button type="button" disabled={Boolean(submitting)} onClick={() => save("PUBLISHED")}>
          {submitting === "PUBLISHED" && <Loader2 className="size-4 animate-spin" />}
          {isLive ? "Save & keep live" : "Publish"}
        </Button>
      </div>
    </form>
  );
}
