"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { PermissionGate } from "@/components/admin/permission-gate";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { SiteContentPage } from "@/types";

export default function ContentPagesPage() {
  return (
    <PermissionGate module="cms">
      <ContentPagesContent />
    </PermissionGate>
  );
}

function ContentPagesContent() {
  const [pages, setPages] = useState<SiteContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SiteContentPage | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<SiteContentPage[]>("/admin/cms/site-content");
      setPages(res.data);
    } catch (err) {
      toast({ title: "Could not load content pages", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (p: SiteContentPage) => {
    setEditing(p);
    setTitle(p.title);
    setContent(p.content);
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await apiFetch(`/admin/cms/site-content/${editing.key}`, { method: "PUT", body: JSON.stringify({ title, content }) });
      toast({ title: "Page updated", variant: "success" });
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Content Pages" description="Editable static pages: About Us, Contact Us, Terms, Cancellation & Refund Policy." />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : pages.length === 0 ? (
        <EmptyState icon={FileText} title="No content pages found." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Page</th>
                <th className="p-4">Key</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4 font-semibold text-navy-900">{p.title || p.key}</td>
                  <td className="p-4 font-mono text-xs text-navy-500">{p.key}</td>
                  <td className="p-4 text-navy-400">{p.updatedAt ? new Date(p.updatedAt).toLocaleString("en-IN") : "Never"}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEdit(p)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                      <Pencil className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`Edit: ${editing?.key ?? ""}`} className="max-w-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Content (HTML)</Label>
              <Textarea className="mt-1.5 min-h-[350px] font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
              <p className="mt-2 text-xs text-navy-400">
                Raw HTML is trusted here — it is not automatically sanitized like blog content, since this content is admin-only.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Save Page
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
