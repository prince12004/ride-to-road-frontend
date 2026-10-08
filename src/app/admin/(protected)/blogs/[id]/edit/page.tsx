"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { BlogForm } from "@/components/admin/blog-form";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminBlog } from "@/types";

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<AdminBlog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminBlog>(`/admin/blogs/${id}`)
      .then((res) => setBlog(res.data))
      .catch((err) => {
        toast({ title: "Could not load blog", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!blog) return <p className="text-sm text-navy-500">Blog not found.</p>;

  return (
    <div>
      <PageHeader title={`Edit ${blog.title}`} description="Update this article." />
      <BlogForm initial={blog} blogId={blog._id} />
    </div>
  );
}
