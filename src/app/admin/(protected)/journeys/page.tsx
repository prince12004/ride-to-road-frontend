"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Plus, Pencil, Trash2, Route } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminJourney, ImageRef } from "@/types";

interface FormState {
  from: string;
  to: string;
  distanceKm: string;
  driveTime: string;
  highlight: string;
  image: ImageRef | null;
  isActive: boolean;
}
const emptyForm: FormState = { from: "", to: "", distanceKm: "", driveTime: "", highlight: "", image: null, isActive: true };

export default function AdminJourneysPage() {
  const [journeys, setJourneys] = useState<AdminJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminJourney | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminJourney[]>("/admin/journeys");
      setJourneys(res.data);
    } catch (err) {
      toast({ title: "Could not load journeys", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
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

  const openEdit = (j: AdminJourney) => {
    setEditing(j);
    setForm({ from: j.from, to: j.to, distanceKm: String(j.distanceKm), driveTime: j.driveTime, highlight: j.highlight, image: j.image, isActive: j.isActive });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from.trim() || !form.to.trim() || !form.image) {
      toast({ title: "Missing fields", description: "From, to and image are required.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        from: form.from,
        to: form.to,
        distanceKm: Number(form.distanceKm) || 0,
        driveTime: form.driveTime,
        highlight: form.highlight,
        image: form.image,
        isActive: form.isActive,
      };
      if (editing) {
        await apiFetch(`/admin/journeys/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Journey updated", variant: "success" });
      } else {
        await apiFetch("/admin/journeys", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Journey created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (j: AdminJourney) => {
    if (!confirm(`Delete journey "${j.from} → ${j.to}"?`)) return;
    try {
      await apiFetch(`/admin/journeys/${j._id}`, { method: "DELETE" });
      toast({ title: "Journey deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Journeys"
        description="Popular road trip inspiration cards shown on the homepage."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Journey
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : journeys.length === 0 ? (
        <EmptyState icon={Route} title="No journeys added yet." description="Click 'Add Journey' to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {journeys.map((j) => (
            <Card key={j._id} className="overflow-hidden p-0">
              <div className="relative h-32 w-full bg-navy-50">
                <Image src={j.image.url} alt={j.from} fill className="object-cover" unoptimized />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-bold text-navy-900">
                    {j.from} → {j.to}
                  </p>
                  <Badge variant={j.isActive ? "success" : "outline"}>{j.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="mt-1 text-xs text-navy-500">
                  {j.distanceKm} km · {j.driveTime}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-navy-600">{j.highlight}</p>
                <div className="mt-3 flex justify-end gap-1.5">
                  <button onClick={() => openEdit(j)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => handleDelete(j)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? "Edit Journey" : "Add Journey"}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>From</Label>
                <Input className="mt-1.5" value={form.from} onChange={(e) => setForm((s) => ({ ...s, from: e.target.value }))} />
              </div>
              <div>
                <Label>To</Label>
                <Input className="mt-1.5" value={form.to} onChange={(e) => setForm((s) => ({ ...s, to: e.target.value }))} />
              </div>
              <div>
                <Label>Distance (km)</Label>
                <Input className="mt-1.5" type="number" value={form.distanceKm} onChange={(e) => setForm((s) => ({ ...s, distanceKm: e.target.value }))} />
              </div>
              <div>
                <Label>Drive Time</Label>
                <Input className="mt-1.5" value={form.driveTime} onChange={(e) => setForm((s) => ({ ...s, driveTime: e.target.value }))} placeholder="e.g. 3h 30m" />
              </div>
            </div>
            <div>
              <Label>Highlight</Label>
              <Input className="mt-1.5" value={form.highlight} onChange={(e) => setForm((s) => ({ ...s, highlight: e.target.value }))} />
            </div>
            <ImageUploader label="Image" required value={form.image} onChange={(img) => setForm((s) => ({ ...s, image: img }))} folder="journeys" />
            <div className="flex items-center gap-2">
              <Checkbox checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: Boolean(v) }))} id="journeyActive" />
              <label htmlFor="journeyActive" className="text-sm font-semibold text-navy-700">
                Active
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Journey"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
