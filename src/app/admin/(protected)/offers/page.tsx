"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Plus, Pencil, Trash2, BadgePercent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminOffer, ImageRef } from "@/types";

interface FormState {
  eyebrow: string;
  title: string;
  description: string;
  terms: string;
  code: string;
  image: ImageRef | null;
  ctaLabel: string;
  ctaHref: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  eyebrow: "Limited offer",
  title: "",
  description: "",
  terms: "",
  code: "",
  image: null,
  ctaLabel: "Claim Offer",
  ctaHref: "/cars",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminOffer[]>("/admin/offers");
      setOffers(res.data);
    } catch (err) {
      toast({ title: "Could not load offers", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (o: AdminOffer) => {
    setEditing(o);
    setForm({
      eyebrow: o.eyebrow,
      title: o.title,
      description: o.description,
      terms: o.terms ?? "",
      code: o.code ?? "",
      image: o.image,
      ctaLabel: o.ctaLabel,
      ctaHref: o.ctaHref,
      startDate: o.startDate?.slice(0, 10) ?? "",
      endDate: o.endDate?.slice(0, 10) ?? "",
      isActive: o.isActive,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.image) {
      toast({ title: "Missing fields", description: "Title, description and image are required.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        eyebrow: form.eyebrow || "Limited offer",
        title: form.title,
        description: form.description,
        terms: form.terms || undefined,
        code: form.code || undefined,
        image: form.image,
        ctaLabel: form.ctaLabel || "Claim Offer",
        ctaHref: form.ctaHref || "/cars",
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        await apiFetch(`/admin/offers/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Offer updated", variant: "success" });
      } else {
        await apiFetch("/admin/offers", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Offer created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (o: AdminOffer) => {
    if (!confirm(`Delete offer "${o.title}"?`)) return;
    try {
      await apiFetch(`/admin/offers/${o._id}`, { method: "DELETE" });
      toast({ title: "Offer deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Offers"
        description="Promotional offers. The newest active offer is shown publicly."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Offer
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : offers.length === 0 ? (
        <EmptyState icon={BadgePercent} title="No offers added yet." description="Click 'Add Offer' to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <Card key={o._id} className="overflow-hidden p-0">
              <div className="relative h-36 w-full bg-navy-50">
                <Image src={o.image.url} alt={o.title} fill className="object-cover" unoptimized />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{o.eyebrow}</p>
                  <Badge variant={o.isActive ? "success" : "outline"}>{o.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="mt-1 font-display text-base font-bold text-navy-900">{o.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-navy-500">{o.description}</p>
                {o.code && <p className="mt-2 text-xs font-mono text-brand-deep">Code: {o.code}</p>}
                <div className="mt-3 flex justify-end gap-1.5">
                  <button onClick={() => openEdit(o)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => handleDelete(o)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? "Edit Offer" : "Add Offer"} className="max-w-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Eyebrow</Label>
                <Input className="mt-1.5" value={form.eyebrow} onChange={(e) => setForm((s) => ({ ...s, eyebrow: e.target.value }))} />
              </div>
              <div>
                <Label>Code (optional)</Label>
                <Input className="mt-1.5" value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input className="mt-1.5" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1.5" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div>
              <Label>Terms (optional)</Label>
              <Textarea className="mt-1.5" value={form.terms} onChange={(e) => setForm((s) => ({ ...s, terms: e.target.value }))} />
            </div>
            <ImageUploader label="Offer Image" required value={form.image} onChange={(img) => setForm((s) => ({ ...s, image: img }))} folder="offers" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>CTA Label</Label>
                <Input className="mt-1.5" value={form.ctaLabel} onChange={(e) => setForm((s) => ({ ...s, ctaLabel: e.target.value }))} />
              </div>
              <div>
                <Label>CTA Href</Label>
                <Input className="mt-1.5" value={form.ctaHref} onChange={(e) => setForm((s) => ({ ...s, ctaHref: e.target.value }))} />
              </div>
              <div>
                <Label>Start Date (optional)</Label>
                <Input className="mt-1.5" type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date (optional)</Label>
                <Input className="mt-1.5" type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: Boolean(v) }))} id="offerActive" />
              <label htmlFor="offerActive" className="text-sm font-semibold text-navy-700">
                Active
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Offer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
