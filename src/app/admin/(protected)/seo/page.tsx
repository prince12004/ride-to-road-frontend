"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { PermissionGate } from "@/components/admin/permission-gate";
import { ImageUploader } from "@/components/admin/image-uploader";
import { CustomSchemaField, IndexingControls, LabelWithCounter, customSchemaError } from "@/components/admin/seo-fields";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { PageSeo } from "@/types";

export default function SeoPageMetaPage() {
  return (
    <PermissionGate module="seo">
      <PageMetaContent />
    </PermissionGate>
  );
}

function PageMetaContent() {
  const [pages, setPages] = useState<PageSeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PageSeo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<PageSeo[]>("/admin/seo/pages");
      setPages(res.data);
    } catch (err) {
      toast({ title: "Could not load pages", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = (p: Partial<PageSeo>) => setEditing((s) => (s ? { ...s, ...p } : s));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const schemaError = customSchemaError(editing.customSchema ?? "");
    if (schemaError) {
      toast({ title: "Fix the custom schema", description: schemaError, variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/admin/seo/pages", {
        method: "PUT",
        body: JSON.stringify({
          path: editing.path,
          metaTitle: editing.metaTitle ?? "",
          metaDescription: editing.metaDescription ?? "",
          canonicalUrl: editing.canonicalUrl ?? "",
          ogImage: editing.ogImage ?? null,
          noindex: Boolean(editing.noindex),
          nofollow: Boolean(editing.nofollow),
          includeInSitemap: editing.includeInSitemap !== false,
          customSchema: editing.customSchema ?? "",
        }),
      });
      toast({ title: "Page SEO saved", description: "Live on the website within a few seconds.", variant: "success" });
      setEditing(null);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Page Meta"
        description="Meta title, description, canonical URL and indexing for the site's fixed pages. Blogs and cars have their own SEO section in their edit forms."
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Page</th>
                <th className="p-4">Meta Title</th>
                <th className="p-4">Indexing</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.path} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4">
                    <p className="font-semibold text-navy-900">{p.label}</p>
                    <a href={p.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-navy-400 hover:text-brand-deep">
                      {p.path} <ExternalLink className="size-3" />
                    </a>
                  </td>
                  <td className="max-w-sm p-4">
                    {p.metaTitle ? (
                      <p className="truncate text-navy-800">{p.metaTitle}</p>
                    ) : (
                      <p className="text-navy-400">Default</p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.noindex ? <Badge variant="destructive">noindex</Badge> : <Badge variant="success">index</Badge>}
                      {p.nofollow && <Badge variant="warning">nofollow</Badge>}
                      {(p.noindex || p.includeInSitemap === false) && <Badge variant="outline">not in sitemap</Badge>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditing(p)}
                        aria-label={`Edit SEO for ${p.label}`}
                        className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title={editing ? `SEO — ${editing.label}` : "SEO"}>
          {editing && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <LabelWithCounter label="Meta Title" value={editing.metaTitle ?? ""} max={60} />
                <Input
                  className="mt-1.5"
                  value={editing.metaTitle ?? ""}
                  onChange={(e) => patch({ metaTitle: e.target.value })}
                  placeholder="Leave empty to keep the current default"
                />
                <p className="mt-1 text-xs text-navy-400">Used exactly as typed — “| Ride to Road” is not added.</p>
              </div>
              <div>
                <LabelWithCounter label="Meta Description" value={editing.metaDescription ?? ""} max={160} />
                <Textarea
                  className="mt-1.5"
                  rows={3}
                  value={editing.metaDescription ?? ""}
                  onChange={(e) => patch({ metaDescription: e.target.value })}
                  placeholder="Leave empty to keep the current default"
                />
              </div>
              <ImageUploader label="Social share image (optional)" value={editing.ogImage ?? null} onChange={(img) => patch({ ogImage: img ?? undefined })} folder="cms" />
              <IndexingControls idPrefix="page" value={editing} onChange={patch} />
              <CustomSchemaField
                value={editing.customSchema ?? ""}
                onChange={(v) => patch({ customSchema: v })}
                autoNote={
                  editing.path === "/faq"
                    ? "Added automatically: FAQPage from your FAQs, plus business details."
                    : "Added automatically on every page: business (AutoRental) and website details."
                }
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
