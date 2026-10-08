"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
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
import type { AdminFaq } from "@/types";

interface FormState {
  question: string;
  answer: string;
  order: string;
  isPublished: boolean;
}
const emptyForm: FormState = { question: "", answer: "", order: "0", isPublished: true };

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFaq | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminFaq[]>("/admin/faqs");
      setFaqs([...res.data].sort((a, b) => a.order - b.order));
    } catch (err) {
      toast({ title: "Could not load FAQs", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: String(faqs.length) });
    setOpen(true);
  };

  const openEdit = (f: AdminFaq) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, order: String(f.order), isPublished: f.isPublished });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setSubmitting(true);
    try {
      const payload = { question: form.question, answer: form.answer, order: Number(form.order), isPublished: form.isPublished };
      if (editing) {
        await apiFetch(`/admin/faqs/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "FAQ updated", variant: "success" });
      } else {
        await apiFetch("/admin/faqs", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "FAQ created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (f: AdminFaq) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await apiFetch(`/admin/faqs/${f._id}`, { method: "DELETE" });
      toast({ title: "FAQ deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="FAQs"
        description="Frequently asked questions shown on the site."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add FAQ
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : faqs.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No FAQs added yet." description="Click 'Add FAQ' to get started." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Order</th>
                <th className="p-4">Question</th>
                <th className="p-4">Published</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4 text-navy-500">{f.order}</td>
                  <td className="p-4 max-w-md truncate font-semibold text-navy-900">{f.question}</td>
                  <td className="p-4">
                    <Badge variant={f.isPublished ? "success" : "outline"}>{f.isPublished ? "Published" : "Draft"}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(f)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => handleDelete(f)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
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
        <DialogContent title={editing ? "Edit FAQ" : "Add FAQ"}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input className="mt-1.5" value={form.question} onChange={(e) => setForm((s) => ({ ...s, question: e.target.value }))} />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea className="mt-1.5" rows={4} value={form.answer} onChange={(e) => setForm((s) => ({ ...s, answer: e.target.value }))} />
            </div>
            <div>
              <Label>Order</Label>
              <Input className="mt-1.5" type="number" value={form.order} onChange={(e) => setForm((s) => ({ ...s, order: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.isPublished} onCheckedChange={(v) => setForm((s) => ({ ...s, isPublished: Boolean(v) }))} id="faqPublished" />
              <label htmlFor="faqPublished" className="text-sm font-semibold text-navy-700">
                Published
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create FAQ"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
