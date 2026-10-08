"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminBlog, BlogCategory, ImageRef } from "@/types";

interface FormState {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: ImageRef | null;
  author: string;
  status: "DRAFT" | "PUBLISHED";
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: ImageRef | null;
}

const emptyForm: FormState = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  image: null,
  author: "",
  status: "DRAFT",
  seoTitle: "",
  metaDescription: "",
  keywords: [],
  ogTitle: "",
  ogDescription: "",
  ogImage: null,
};

function blogToForm(b: AdminBlog): FormState {
  return {
    title: b.title,
    excerpt: b.excerpt ?? "",
    content: b.content ?? "",
    category: typeof b.category === "object" ? b.category?._id ?? "" : b.category ?? "",
    image: b.image,
    author: b.author ?? "",
    status: b.status,
    seoTitle: b.seoTitle ?? "",
    metaDescription: b.metaDescription ?? "",
    keywords: b.keywords ?? [],
    ogTitle: b.ogTitle ?? "",
    ogDescription: b.ogDescription ?? "",
    ogImage: b.ogImage ?? null,
  };
}

export function BlogForm({ initial, blogId }: { initial?: AdminBlog; blogId?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(initial ? blogToForm(initial) : emptyForm);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<BlogCategory[]>("/admin/blog-categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => setValues((s) => ({ ...s, [key]: val }));

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    set("keywords", [...values.keywords, keywordInput.trim()]);
    setKeywordInput("");
  };
  const removeKeyword = (i: number) => set("keywords", values.keywords.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim() || !values.content.trim() || !values.image) {
      toast({ title: "Missing fields", description: "Title, content and image are required.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        excerpt: values.excerpt || undefined,
        content: values.content,
        category: values.category || undefined,
        image: values.image,
        author: values.author || undefined,
        status: values.status,
        seoTitle: values.seoTitle || undefined,
        metaDescription: values.metaDescription || undefined,
        keywords: values.keywords,
        ogTitle: values.ogTitle || undefined,
        ogDescription: values.ogDescription || undefined,
        ogImage: values.ogImage ?? undefined,
      };
      if (blogId) {
        await apiFetch(`/admin/blogs/${blogId}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Blog updated", variant: "success" });
      } else {
        await apiFetch("/admin/blogs", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Blog created", variant: "success" });
      }
      router.push("/admin/blogs");
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Basic Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input className="mt-1.5" value={values.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={values.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Author (optional)</Label>
            <Input className="mt-1.5" value={values.author} onChange={(e) => set("author", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Excerpt (optional)</Label>
            <Textarea className="mt-1.5" value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy-900">Content</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((s) => !s)}>
            {showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
        </div>
        <Textarea
          className="mt-3 min-h-[400px] font-mono text-sm"
          value={values.content}
          onChange={(e) => set("content", e.target.value)}
          placeholder="<p>Write your blog content as HTML...</p>"
        />
        <p className="mt-2 text-xs text-navy-400">HTML is supported and sanitized automatically on save.</p>
        {showPreview && (
          <div className="mt-4 rounded-2xl border border-navy-100 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-navy-400">Preview</p>
            <div className="max-w-none text-sm text-navy-800 [&_a]:text-brand-deep [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_p]:mt-2" dangerouslySetInnerHTML={{ __html: values.content }} />
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Featured Image</h2>
        <div className="mt-3">
          <ImageUploader label="Image" required value={values.image} onChange={(img) => set("image", img)} folder="blogs" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Status</h2>
        <div className="mt-3">
          <Select value={values.status} onValueChange={(v) => set("status", v as "DRAFT" | "PUBLISHED")}>
            <SelectTrigger className="h-12 w-48 rounded-2xl border border-navy-200 px-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">SEO</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label>SEO Title</Label>
            <Input className="mt-1.5" value={values.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
          </div>
          <div>
            <Label>Meta Description</Label>
            <Textarea className="mt-1.5" value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
          </div>
          <div>
            <Label>Keywords</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addKeyword}>
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {values.keywords.map((k, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700">
                  {k}
                  <button type="button" onClick={() => removeKeyword(i)}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <Label>OG Title (optional)</Label>
            <Input className="mt-1.5" value={values.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} />
          </div>
          <div>
            <Label>OG Description (optional)</Label>
            <Textarea className="mt-1.5" value={values.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} />
          </div>
          <ImageUploader label="OG Image (optional)" value={values.ogImage} onChange={(img) => set("ogImage", img)} folder="blogs" />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/blogs")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {blogId ? "Save Changes" : "Create Blog"}
        </Button>
      </div>
    </form>
  );
}
