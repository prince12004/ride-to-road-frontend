"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Plus, Pencil, Trash2, Newspaper, FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminBlog } from "@/types";

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminBlog[]>(`/admin/blogs?page=${page}&limit=20`);
      setBlogs(res.data);
      setPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      toast({ title: "Could not load blogs", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = async (b: AdminBlog) => {
    try {
      await apiFetch(`/admin/blogs/${b._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: b.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
      });
      load();
    } catch (err) {
      toast({ title: "Could not update", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const handleDelete = async (b: AdminBlog) => {
    if (!confirm(`Delete "${b.title}"?`)) return;
    try {
      await apiFetch(`/admin/blogs/${b._id}`, { method: "DELETE" });
      toast({ title: "Blog deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Blogs"
        description="Articles shown on the public blog."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/blogs/categories">
                <FolderKanban className="size-4" /> Categories
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/blogs/create">
                <Plus className="size-4" /> Add Blog
              </Link>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : blogs.length === 0 ? (
        <EmptyState icon={Newspaper} title="No blogs added yet." description="Click 'Add Blog' to get started." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Blog</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Published</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-navy-50">
                        {b.image?.url && <Image src={b.image.url} alt="" fill className="object-cover" unoptimized />}
                      </div>
                      <p className="font-semibold text-navy-900">{b.title}</p>
                    </div>
                  </td>
                  <td className="p-4 text-navy-700">{typeof b.category === "object" ? b.category?.name : "—"}</td>
                  <td className="p-4">
                    <button onClick={() => handleToggleStatus(b)}>
                      <Badge variant={b.status === "PUBLISHED" ? "success" : "outline"}>{b.status}</Badge>
                    </button>
                  </td>
                  <td className="p-4 text-navy-400">{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString("en-IN") : "—"}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/admin/blogs/${b._id}/edit`} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Pencil className="size-4" />
                      </Link>
                      <button onClick={() => handleDelete(b)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4">
            <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
