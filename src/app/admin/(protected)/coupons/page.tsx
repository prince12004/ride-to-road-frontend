"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Ticket, Power } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatINR } from "@/lib/utils";
import type { AdminCarDoc, Coupon } from "@/types";

interface FormState {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  percentage: string;
  fixedAmount: string;
  minBookingAmount: string;
  maxDiscount: string;
  applicableCars: string[];
  usageLimit: string;
  perUserLimit: string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  percentage: "",
  fixedAmount: "",
  minBookingAmount: "",
  maxDiscount: "",
  applicableCars: [],
  usageLimit: "",
  perUserLimit: "",
  startDate: "",
  expiryDate: "",
  isActive: true,
};

function couponStatusLabel(c: Coupon): { label: string; variant: "success" | "outline" | "destructive" } {
  if (!c.isActive) return { label: "Disabled", variant: "outline" };
  if (new Date(c.expiryDate) < new Date()) return { label: "Expired", variant: "destructive" };
  return { label: "Active", variant: "success" };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cars, setCars] = useState<AdminCarDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Coupon[]>("/admin/coupons");
      setCoupons(res.data);
    } catch (err) {
      toast({ title: "Could not load coupons", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    apiFetch<AdminCarDoc[]>("/admin/cars?limit=200").then((res) => setCars(res.data)).catch(() => {});
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      percentage: c.percentage != null ? String(c.percentage) : "",
      fixedAmount: c.fixedAmount != null ? String(c.fixedAmount) : "",
      minBookingAmount: c.minBookingAmount != null ? String(c.minBookingAmount) : "",
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
      applicableCars: c.applicableCars.map((car) => (typeof car === "object" ? car._id : car)),
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      perUserLimit: c.perUserLimit != null ? String(c.perUserLimit) : "",
      startDate: c.startDate?.slice(0, 10) ?? "",
      expiryDate: c.expiryDate?.slice(0, 10) ?? "",
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const toggleCar = (id: string) => {
    setForm((s) => ({
      ...s,
      applicableCars: s.applicableCars.includes(id) ? s.applicableCars.filter((c) => c !== id) : [...s.applicableCars, id],
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.startDate || !form.expiryDate) {
      toast({ title: "Missing fields", description: "Code, start date and expiry date are required.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        percentage: form.discountType === "PERCENTAGE" ? Number(form.percentage) : undefined,
        fixedAmount: form.discountType === "FIXED" ? Number(form.fixedAmount) : undefined,
        minBookingAmount: form.minBookingAmount ? Number(form.minBookingAmount) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        applicableCars: form.applicableCars,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : undefined,
        startDate: form.startDate,
        expiryDate: form.expiryDate,
        isActive: form.isActive,
      };
      if (editing) {
        await apiFetch(`/admin/coupons/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Coupon updated", variant: "success" });
      } else {
        await apiFetch("/admin/coupons", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Coupon created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      await apiFetch(`/admin/coupons/${c._id}`, { method: "PUT", body: JSON.stringify({ ...c, isActive: !c.isActive, applicableCars: c.applicableCars.map((car) => (typeof car === "object" ? car._id : car)) }) });
      load();
    } catch (err) {
      toast({ title: "Could not update", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await apiFetch(`/admin/coupons/${c._id}`, { method: "DELETE" });
      toast({ title: "Coupon deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply at checkout."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Coupon
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState icon={Ticket} title="No coupons added yet." description="Click 'Add Coupon' to get started." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Validity</th>
                <th className="p-4">Usage</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const status = couponStatusLabel(c);
                return (
                  <tr key={c._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                    <td className="p-4 font-semibold text-navy-900">{c.code}</td>
                    <td className="p-4 text-navy-700">
                      {c.discountType === "PERCENTAGE" ? `${c.percentage}%` : formatINR(c.fixedAmount ?? 0)}
                    </td>
                    <td className="p-4 text-navy-700">
                      {new Date(c.startDate).toLocaleDateString("en-IN")} – {new Date(c.expiryDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4 text-navy-700">
                      {c.usedCount}/{c.usageLimit ?? "∞"}
                    </td>
                    <td className="p-4">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleToggleActive(c)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                          <Power className="size-4" />
                        </button>
                        <button onClick={() => openEdit(c)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => handleDelete(c)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                          <Trash2 className="size-4" />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? "Edit Coupon" : "Add Coupon"} className="max-w-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Code</Label>
                <Input className="mt-1.5" value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} placeholder="e.g. RIDE100" />
              </div>
              <div>
                <Label>Discount Type</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm((s) => ({ ...s, discountType: v as "PERCENTAGE" | "FIXED" }))}>
                  <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.discountType === "PERCENTAGE" ? (
                <div>
                  <Label>Percentage (%)</Label>
                  <Input className="mt-1.5" type="number" value={form.percentage} onChange={(e) => setForm((s) => ({ ...s, percentage: e.target.value }))} />
                </div>
              ) : (
                <div>
                  <Label>Fixed Amount (₹)</Label>
                  <Input className="mt-1.5" type="number" value={form.fixedAmount} onChange={(e) => setForm((s) => ({ ...s, fixedAmount: e.target.value }))} />
                </div>
              )}
              <div>
                <Label>Max Discount (₹, optional)</Label>
                <Input className="mt-1.5" type="number" value={form.maxDiscount} onChange={(e) => setForm((s) => ({ ...s, maxDiscount: e.target.value }))} />
              </div>
              <div>
                <Label>Min Booking Amount (₹, optional)</Label>
                <Input className="mt-1.5" type="number" value={form.minBookingAmount} onChange={(e) => setForm((s) => ({ ...s, minBookingAmount: e.target.value }))} />
              </div>
              <div>
                <Label>Usage Limit (optional)</Label>
                <Input className="mt-1.5" type="number" value={form.usageLimit} onChange={(e) => setForm((s) => ({ ...s, usageLimit: e.target.value }))} />
              </div>
              <div>
                <Label>Per-User Limit (optional)</Label>
                <Input className="mt-1.5" type="number" value={form.perUserLimit} onChange={(e) => setForm((s) => ({ ...s, perUserLimit: e.target.value }))} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input className="mt-1.5" type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input className="mt-1.5" type="date" value={form.expiryDate} onChange={(e) => setForm((s) => ({ ...s, expiryDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input className="mt-1.5" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div>
              <Label>Applicable Cars (leave empty for all cars)</Label>
              <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto rounded-2xl border border-navy-100 p-3">
                {cars.map((car) => (
                  <label key={car._id} className="flex items-center gap-2 text-sm text-navy-700">
                    <Checkbox checked={form.applicableCars.includes(car._id)} onCheckedChange={() => toggleCar(car._id)} />
                    {car.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: Boolean(v) }))} id="couponActive" />
              <label htmlFor="couponActive" className="text-sm font-semibold text-navy-700">
                Active
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Coupon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
