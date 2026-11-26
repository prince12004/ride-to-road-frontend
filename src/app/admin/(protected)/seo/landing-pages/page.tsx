"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, EyeOff, LayoutTemplate, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { PermissionGate } from "@/components/admin/permission-gate";
import { Tabs, TabsList, TabsTrigger } from "@/components/admin/tabs";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminLandingPage } from "@/types";

type Row = Pick<AdminLandingPage, "_id" | "title" | "slug" | "pageType" | "h1" | "status" | "updatedAt" | "noindex" | "showInFooter">;

export default function LandingPagesListPage() {
  return (
    <PermissionGate module="seo">
      <LandingPagesContent />
    </PermissionGate>
  );
}

function LandingPagesContent() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "PUBLISHED" | "DRAFT">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      const res = await apiFetch<Row[]>(`/admin/landing-pages?${params.toString()}`);
      setRows(res.data);
    } catch (err) {
      toast({ title: "Could not load pages", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const toggleStatus = async (r: Row) => {
    const next = r.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await apiFetch(`/admin/landing-pages/${r._id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      toast({ title: next === "PUBLISHED" ? "Published" : "Unpublished", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Could not update", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const remove = async (r: Row) => {
    const warning =
      r.status === "PUBLISHED"
        ? `Delete "${r.title}"? /${r.slug} is live — after deleting, add a redirect in SEO → Redirects so visitors and Google aren't sent to a 404.`
        : `Delete "${r.title}"?`;
    if (!confirm(warning)) return;
    try {
      await apiFetch(`/admin/landing-pages/${r._id}`, { method: "DELETE" });
      toast({ title: "Page deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Landing Pages"
        description="Location and service pages, each at its own URL (ridetoroad.com/<slug>)."
        action={
          <Button asChild>
            <Link href="/admin/seo/landing-pages/create">
              <Plus className="size-4" /> New Page
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
          <Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, slug or H1…" />
        </div>
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
            <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title={search || status !== "all" ? "No pages match." : "No landing pages yet."}
          description="Create pages like “Self Drive Car Rental in Noida” to rank for local searches."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Page</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="max-w-md p-4">
                    <p className="truncate font-semibold text-navy-900">{r.title}</p>
                    <p className="truncate text-xs text-navy-500">{r.h1}</p>
                    {r.status === "PUBLISHED" ? (
                      <a href={`/${r.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-navy-400 hover:text-brand-deep">
                        /{r.slug} <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <p className="text-xs text-navy-400">/{r.slug}</p>
                    )}
                  </td>
                  <td className="p-4 capitalize text-navy-600">{r.pageType}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={r.status === "PUBLISHED" ? "success" : "outline"}>{r.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
                      {r.noindex && <Badge variant="destructive">noindex</Badge>}
                      {r.showInFooter && <Badge variant="lime">footer</Badge>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-4 text-navy-400">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => toggleStatus(r)}
                        title={r.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        aria-label={r.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50"
                      >
                        {r.status === "PUBLISHED" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                      <Link href={`/admin/seo/landing-pages/${r._id}`} aria-label="Edit" className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Pencil className="size-4" />
                      </Link>
                      <button onClick={() => remove(r)} aria-label="Delete" className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
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
    </div>
  );
}
