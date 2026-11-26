"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, Pencil, Plus, Search, Trash2, Waypoints } from "lucide-react";
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
import { PermissionGate } from "@/components/admin/permission-gate";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { SeoRedirect } from "@/types";

interface FormState {
  from: string;
  to: string;
  statusCode: "301" | "302";
  isActive: boolean;
  note: string;
}
const emptyForm: FormState = { from: "", to: "", statusCode: "301", isActive: true, note: "" };

export default function SeoRedirectsPage() {
  return (
    <PermissionGate module="seo">
      <RedirectsContent />
    </PermissionGate>
  );
}

function RedirectsContent() {
  const [items, setItems] = useState<SeoRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SeoRedirect | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await apiFetch<SeoRedirect[]>(`/admin/seo/redirects${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      setItems(res.data);
    } catch (err) {
      toast({ title: "Could not load redirects", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 250);
    return () => clearTimeout(t);
  }, [load, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (r: SeoRedirect) => {
    setEditing(r);
    setForm({ from: r.from, to: r.to, statusCode: String(r.statusCode) as "301" | "302", isActive: r.isActive, note: r.note ?? "" });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, statusCode: Number(form.statusCode) };
      if (editing) {
        await apiFetch(`/admin/seo/redirects/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Redirect updated", variant: "success" });
      } else {
        await apiFetch("/admin/seo/redirects", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Redirect added", description: "Takes effect within 30 seconds.", variant: "success" });
      }
      setOpen(false);
      load(search.trim());
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (r: SeoRedirect) => {
    if (!confirm(`Delete the redirect from ${r.from}?`)) return;
    try {
      await apiFetch(`/admin/seo/redirects/${r._id}`, { method: "DELETE" });
      toast({ title: "Redirect deleted", variant: "success" });
      load(search.trim());
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Redirects"
        description="Send visitors and search engines from an old URL to a new one. Changing a blog or car slug adds a 301 here automatically."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Redirect
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
        <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search paths…" />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Waypoints} title={search ? "No redirects match." : "No redirects yet."} description="Click 'Add Redirect' to create one." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">From</th>
                <th className="p-4">To</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="max-w-xs p-4">
                    <p className="truncate font-mono text-xs font-semibold text-navy-900">{r.from}</p>
                    {r.note && <p className="mt-0.5 truncate text-xs text-navy-400">{r.note}</p>}
                  </td>
                  <td className="max-w-xs p-4">
                    <p className="flex items-center gap-1.5 truncate font-mono text-xs text-navy-700">
                      <ArrowRight className="size-3 shrink-0 text-navy-400" />
                      <span className="truncate">{r.to}</span>
                    </p>
                  </td>
                  <td className="p-4">
                    <Badge variant={r.statusCode === 301 ? "navy" : "outline"}>{r.statusCode === 301 ? "301 Permanent" : "302 Temporary"}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={r.isActive ? "success" : "outline"}>{r.isActive ? "Active" : "Off"}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(r)} aria-label="Edit redirect" className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => handleDelete(r)} aria-label="Delete redirect" className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
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
        <DialogContent title={editing ? "Edit Redirect" : "Add Redirect"}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>From (old path)</Label>
              <Input className="mt-1.5 font-mono text-sm" value={form.from} onChange={(e) => setForm((s) => ({ ...s, from: e.target.value }))} placeholder="/old-page" />
            </div>
            <div>
              <Label>To (new path or full URL)</Label>
              <Input className="mt-1.5 font-mono text-sm" value={form.to} onChange={(e) => setForm((s) => ({ ...s, to: e.target.value }))} placeholder="/new-page" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.statusCode} onValueChange={(v) => setForm((s) => ({ ...s, statusCode: v as "301" | "302" }))}>
                <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 — Permanent (passes SEO value)</SelectItem>
                  <SelectItem value="302">302 — Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input className="mt-1.5" value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} placeholder="Why this redirect exists" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="redirectActive" checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: Boolean(v) }))} />
              <label htmlFor="redirectActive" className="text-sm font-semibold text-navy-700">
                Active
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Add Redirect"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
