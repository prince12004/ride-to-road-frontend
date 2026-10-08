"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { BlogCategory } from "@/types";

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<BlogCategory[]>("/admin/blog-categories");
      setCategories(res.data);
    } catch (err) {
      toast({ title: "Could not load categories", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setIsActive(true);
    setOpen(true);
  };

  const openEdit = (c: BlogCategory) => {
    setEditing(c);
    setName(c.name);
    setIsActive(c.isActive);
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await apiFetch(`/admin/blog-categories/${editing._id}`, { method: "PUT", body: JSON.stringify({ name, isActive }) });
        toast({ title: "Category updated", variant: "success" });
      } else {
        await apiFetch("/admin/blog-categories", { method: "POST", body: JSON.stringify({ name, isActive }) });
        toast({ title: "Category created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: BlogCategory) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await apiFetch(`/admin/blog-categories/${c._id}`, { method: "DELETE" });
      toast({ title: "Category deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Blog Categories"
        description="Organize blog articles."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Category
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No categories yet." description="Click 'Add Category' to get started." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4 font-semibold text-navy-900">{c.name}</td>
                  <td className="p-4 text-navy-500">{c.slug}</td>
                  <td className="p-4">
                    <Badge variant={c.isActive ? "success" : "outline"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(c)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => handleDelete(c)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
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
        <DialogContent title={editing ? "Edit Category" : "Add Category"}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} id="catActive" />
              <label htmlFor="catActive" className="text-sm font-semibold text-navy-700">
                Active
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create Category"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
