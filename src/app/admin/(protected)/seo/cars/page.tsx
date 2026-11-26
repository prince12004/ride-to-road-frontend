"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { CarFront, ExternalLink, Loader2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { PermissionGate } from "@/components/admin/permission-gate";
import { ImageUploader } from "@/components/admin/image-uploader";
import { CustomSchemaField, IndexingControls, LabelWithCounter, SlugInput, customSchemaError, toSlug } from "@/components/admin/seo-fields";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { CarSeo, ImageRef } from "@/types";

interface CarSeoRow {
  _id: string;
  name: string;
  brand: string;
  slug: string;
  status: string;
  seo?: CarSeo;
  mainImage?: ImageRef;
  gallery?: ImageRef[];
}

interface EditState {
  car: CarSeoRow;
  slug: string;
  seo: CarSeo;
  mainImageAlt: string;
  galleryAlts: string[];
}

export default function CarSeoPage() {
  return (
    <PermissionGate module="seo">
      <CarSeoContent />
    </PermissionGate>
  );
}

function CarSeoContent() {
  const [rows, setRows] = useState<CarSeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await apiFetch<CarSeoRow[]>("/admin/seo/cars")).data);
    } catch (err) {
      toast({ title: "Could not load cars", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (car: CarSeoRow) =>
    setEdit({
      car,
      slug: car.slug,
      seo: { includeInSitemap: true, ...car.seo, customSchema: car.seo?.customSchema ?? "" },
      mainImageAlt: car.mainImage?.alt ?? "",
      galleryAlts: (car.gallery ?? []).map((g) => g.alt ?? ""),
    });

  const patchSeo = (p: Partial<CarSeo>) => setEdit((s) => (s ? { ...s, seo: { ...s.seo, ...p } } : s));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const schemaError = customSchemaError(edit.seo.customSchema ?? "");
    if (schemaError) {
      toast({ title: "Fix the custom schema", description: schemaError, variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/admin/seo/cars/${edit.car._id}`, {
        method: "PUT",
        body: JSON.stringify({ slug: toSlug(edit.slug) || edit.car.slug, seo: edit.seo, mainImageAlt: edit.mainImageAlt, galleryAlts: edit.galleryAlts }),
      });
      toast({ title: "Car SEO saved", variant: "success" });
      setEdit(null);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const missingAlts = (c: CarSeoRow) => (c.mainImage && !c.mainImage.alt ? 1 : 0) + (c.gallery ?? []).filter((g) => !g.alt).length;

  return (
    <div>
      <PageHeader title="Car SEO" description="URL, meta tags, indexing, schema and photo alt text for each car. Prices and other details stay in Cars." />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={CarFront} title="No cars yet." description="Cars added under Cars appear here." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Car</th>
                <th className="p-4">Meta title</th>
                <th className="p-4">Checks</th>
                <th className="p-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const missing = missingAlts(c);
                return (
                  <tr key={c._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                    <td className="p-4">
                      <p className="font-semibold text-navy-900">
                        {c.name} <span className="font-normal text-navy-400">· {c.brand}</span>
                      </p>
                      {c.status === "INACTIVE" ? (
                        <p className="text-xs text-navy-400">/cars/{c.slug} (inactive — not on the site)</p>
                      ) : (
                        <a href={`/cars/${c.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-navy-400 hover:text-brand-deep">
                          /cars/{c.slug} <ExternalLink className="size-3" />
                        </a>
                      )}
                    </td>
                    <td className="max-w-xs p-4">
                      {c.seo?.seoTitle ? <p className="truncate text-navy-800">{c.seo.seoTitle}</p> : <p className="text-navy-400">Default</p>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.seo?.noindex && <Badge variant="destructive">noindex</Badge>}
                        {!c.seo?.metaDescription && <Badge variant="outline">no description</Badge>}
                        {missing > 0 ? <Badge variant="warning">{missing} missing alt</Badge> : <Badge variant="success">alt text ok</Badge>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        <button onClick={() => open(c)} aria-label={`Edit SEO for ${c.name}`} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                          <Pencil className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent title={edit ? `SEO — ${edit.car.name}` : "Car SEO"} className="max-w-2xl">
          {edit && (
            <form onSubmit={save} className="space-y-4">
              <SlugInput
                prefix="/cars/"
                value={edit.slug}
                onChange={(v) => setEdit((s) => (s ? { ...s, slug: v } : s))}
                originalSlug={edit.car.status !== "INACTIVE" ? edit.car.slug : undefined}
              />
              <div>
                <LabelWithCounter label="SEO title" value={edit.seo.seoTitle ?? ""} max={60} />
                <Input className="mt-1.5" value={edit.seo.seoTitle ?? ""} onChange={(e) => patchSeo({ seoTitle: e.target.value })} placeholder={`Defaults to “${edit.car.name} Self Drive Rental | Ride to Road”`} />
              </div>
              <div>
                <LabelWithCounter label="Meta description" value={edit.seo.metaDescription ?? ""} max={160} />
                <Textarea className="mt-1.5" value={edit.seo.metaDescription ?? ""} onChange={(e) => patchSeo({ metaDescription: e.target.value })} />
              </div>

              <div>
                <Label>Photo alt text</Label>
                <div className="mt-1.5 space-y-2">
                  {edit.car.mainImage && (
                    <AltRow url={edit.car.mainImage.url} label="Main" value={edit.mainImageAlt} onChange={(v) => setEdit((s) => (s ? { ...s, mainImageAlt: v } : s))} />
                  )}
                  {(edit.car.gallery ?? []).map((g, i) => (
                    <AltRow
                      key={g.publicId + i}
                      url={g.url}
                      label={`Gallery ${i + 1}`}
                      value={edit.galleryAlts[i] ?? ""}
                      onChange={(v) => setEdit((s) => (s ? { ...s, galleryAlts: s.galleryAlts.map((a, idx) => (idx === i ? v : a)) } : s))}
                    />
                  ))}
                </div>
              </div>

              <ImageUploader label="Social share image (optional)" value={edit.seo.ogImage ?? null} onChange={(img) => patchSeo({ ogImage: img ?? undefined })} folder="cars" />
              <IndexingControls idPrefix="carseo" value={edit.seo} onChange={patchSeo} />
              <CustomSchemaField
                value={edit.seo.customSchema ?? ""}
                onChange={(v) => patchSeo({ customSchema: v })}
                autoNote="Added automatically: Product/Car with daily price and availability, breadcrumbs and business details."
              />
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AltRow({ url, label, value, onChange }: { url: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-navy-50">
        <Image src={url} alt="" fill className="object-cover" unoptimized />
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={`${label} photo — describe it`} aria-label={`${label} photo alt text`} />
    </div>
  );
}
