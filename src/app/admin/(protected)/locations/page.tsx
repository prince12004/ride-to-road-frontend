"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminLocationDoc, ImageRef } from "@/types";

interface FormState {
  city: string;
  region: string;
  address: string;
  image: ImageRef | null;
  isActive: boolean;
  showAllCars: boolean;
}

const emptyForm: FormState = { city: "", region: "", address: "", image: null, isActive: true, showAllCars: false };

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<AdminLocationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminLocationDoc | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminLocationDoc[]>("/admin/locations");
      setLocations(res.data);
    } catch (err) {
      toast({ title: "Could not load locations", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
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

  const openEdit = (loc: AdminLocationDoc) => {
    setEditing(loc);
    setForm({ city: loc.city, region: loc.region, address: loc.address ?? "", image: loc.image ?? null, isActive: loc.isActive, showAllCars: Boolean(loc.showAllCars) });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.city.trim() || !form.region.trim()) {
      toast({ title: "Missing fields", description: "City and region are required.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { city: form.city, region: form.region, address: form.address || undefined, image: form.image ?? undefined, isActive: form.isActive, showAllCars: form.showAllCars };
      if (editing) {
        await apiFetch(`/admin/locations/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Location updated", variant: "success" });
      } else {
        await apiFetch("/admin/locations", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Location created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (loc: AdminLocationDoc) => {
    if (!confirm(`Delete "${loc.city}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/locations/${loc._id}`, { method: "DELETE" });
      toast({ title: "Location deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Pickup points used by cars and bookings."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Location
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations added yet."
          description="Click 'Add Location' to get started."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> Add Location
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">City</th>
                <th className="p-4">Region</th>
                <th className="p-4">Address</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4 font-semibold text-navy-900">{loc.city}</td>
                  <td className="p-4 text-navy-700">{loc.region}</td>
                  <td className="p-4 text-navy-700">{loc.address ?? "—"}</td>
                  <td className="p-4">
                    <Badge variant={loc.isActive ? "success" : "outline"}>{loc.isActive ? "Active" : "Inactive"}</Badge>
                    {loc.showAllCars && (
                      <Badge variant="lime" className="ml-1.5">
                        All cars
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(loc)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => handleDelete(loc)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? "Edit Location" : "Add Location"}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>City</Label>
              <Input className="mt-1.5" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
            </div>
            <div>
              <Label>Region</Label>
              <Input className="mt-1.5" value={form.region} onChange={(e) => setForm((s) => ({ ...s, region: e.target.value }))} />
            </div>
            <div>
              <Label>Address (optional)</Label>
              <Input className="mt-1.5" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
            </div>
            <ImageUploader label="Image (optional)" value={form.image} onChange={(img) => setForm((s) => ({ ...s, image: img }))} folder="locations" />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                className="size-4"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-navy-700">
                Active
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="showAllCars"
                checked={form.showAllCars}
                onChange={(e) => setForm((s) => ({ ...s, showAllCars: e.target.checked }))}
                className="mt-0.5 size-4"
              />
              <label htmlFor="showAllCars" className="text-sm text-navy-700">
                <span className="font-semibold">Show all cars in search</span>
                <span className="block text-xs text-navy-400">
                  Customers searching this city see the whole fleet (cars based here first), not only cars located here.
                </span>
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Location"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
