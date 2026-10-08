"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, MessageSquareQuote, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { AdminTestimonial } from "@/types";

interface FormState {
  name: string;
  location: string;
  rating: number;
  quote: string;
  car: string;
  isFeatured: boolean;
  isPublished: boolean;
}
const emptyForm: FormState = { name: "", location: "", rating: 5, quote: "", car: "", isFeatured: false, isPublished: true };

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={cn("size-6", n <= value ? "fill-lime-500 text-lime-500" : "text-navy-200")} />
        </button>
      ))}
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminTestimonial[]>("/admin/testimonials");
      setTestimonials(res.data);
    } catch (err) {
      toast({ title: "Could not load testimonials", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
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

  const openEdit = (t: AdminTestimonial) => {
    setEditing(t);
    setForm({ name: t.name, location: t.location ?? "", rating: t.rating, quote: t.quote, car: t.car ?? "", isFeatured: t.isFeatured, isPublished: t.isPublished });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.quote.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        location: form.location || undefined,
        rating: form.rating,
        quote: form.quote,
        car: form.car || undefined,
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
      };
      if (editing) {
        await apiFetch(`/admin/testimonials/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Testimonial updated", variant: "success" });
      } else {
        await apiFetch("/admin/testimonials", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Testimonial created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (t: AdminTestimonial) => {
    if (!confirm(`Delete testimonial from "${t.name}"?`)) return;
    try {
      await apiFetch(`/admin/testimonials/${t._id}`, { method: "DELETE" });
      toast({ title: "Testimonial deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Customer reviews shown on the site."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Testimonial
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : testimonials.length === 0 ? (
        <EmptyState icon={MessageSquareQuote} title="No testimonials added yet." description="Click 'Add Testimonial' to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t._id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("size-4", i < t.rating ? "fill-lime-500 text-lime-500" : "text-navy-200")} />
                  ))}
                </div>
                <Badge variant={t.isPublished ? "success" : "outline"}>{t.isPublished ? "Published" : "Draft"}</Badge>
              </div>
              <p className="mt-3 line-clamp-4 text-sm text-navy-700">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-3 text-sm font-semibold text-navy-900">{t.name}</p>
              <p className="text-xs text-navy-400">
                {t.location} {t.car && `· ${t.car}`}
              </p>
              <div className="mt-3 flex items-center justify-between">
                {t.isFeatured && <Badge variant="lime">Featured</Badge>}
                <div className="ml-auto flex gap-1.5">
                  <button onClick={() => openEdit(t)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => handleDelete(t)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? "Edit Testimonial" : "Add Testimonial"}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input className="mt-1.5" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input className="mt-1.5" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Car (optional)</Label>
              <Input className="mt-1.5" value={form.car} onChange={(e) => setForm((s) => ({ ...s, car: e.target.value }))} placeholder="e.g. Hyundai Creta" />
            </div>
            <div>
              <Label>Rating</Label>
              <div className="mt-1.5">
                <StarPicker value={form.rating} onChange={(v) => setForm((s) => ({ ...s, rating: v }))} />
              </div>
            </div>
            <div>
              <Label>Quote</Label>
              <Textarea className="mt-1.5" rows={4} value={form.quote} onChange={(e) => setForm((s) => ({ ...s, quote: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
                <Checkbox checked={form.isFeatured} onCheckedChange={(v) => setForm((s) => ({ ...s, isFeatured: Boolean(v) }))} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
                <Checkbox checked={form.isPublished} onCheckedChange={(v) => setForm((s) => ({ ...s, isPublished: Boolean(v) }))} />
                Published
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Testimonial"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
