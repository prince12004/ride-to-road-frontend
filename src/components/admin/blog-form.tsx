"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { CustomSchemaField, IndexingControls, LabelWithCounter, SlugInput, customSchemaError } from "@/components/admin/seo-fields";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminBlog, BlogCategory, ImageRef, PageIndexing } from "@/types";

interface FormState extends PageIndexing {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image: ImageRef | null;
  author: string;
  /** SCHEDULED = published with a future publish time. */
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  /** datetime-local value (browser local time). */
  scheduledAt: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: ImageRef | null;
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  canonicalUrl: "",
  noindex: false,
  nofollow: false,
  includeInSitemap: true,
  customSchema: "",
  excerpt: "",
  content: "",
  category: "",
  image: null,
  author: "",
  status: "DRAFT",
  scheduledAt: "",
  seoTitle: "",
  metaDescription: "",
  keywords: [],
  ogTitle: "",
  ogDescription: "",
  ogImage: null,
};

function isScheduled(b: Pick<AdminBlog, "status" | "publishedAt">) {
  return b.status === "PUBLISHED" && Boolean(b.publishedAt) && new Date(b.publishedAt!).getTime() > Date.now();
}

/** Date -> "YYYY-MM-DDTHH:mm" in the browser's local time, for <input type="datetime-local">. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function blogToForm(b: AdminBlog): FormState {
  return {
    title: b.title,
    slug: b.slug ?? "",
    canonicalUrl: b.canonicalUrl ?? "",
    noindex: Boolean(b.noindex),
    nofollow: Boolean(b.nofollow),
    includeInSitemap: b.includeInSitemap !== false,
    customSchema: b.customSchema ?? "",
    excerpt: b.excerpt ?? "",
    content: b.content ?? "",
    category: typeof b.category === "object" ? b.category?._id ?? "" : b.category ?? "",
    image: b.image,
    author: b.author ?? "",
    status: isScheduled(b) ? "SCHEDULED" : b.status,
    scheduledAt: b.publishedAt ? toLocalInput(new Date(b.publishedAt)) : "",
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
    const schemaError = customSchemaError(values.customSchema ?? "");
    if (schemaError) {
      toast({ title: "Fix the custom schema", description: schemaError, variant: "error" });
      return;
    }
    let publishedAt: string | undefined;
    if (values.status === "SCHEDULED") {
      const when = values.scheduledAt ? new Date(values.scheduledAt) : null;
      if (!when || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        toast({ title: "Pick a future time", description: "Scheduled posts need a publish date and time in the future.", variant: "error" });
        return;
      }
      publishedAt = when.toISOString();
    } else if (values.status === "PUBLISHED" && initial && isScheduled(initial)) {
      // "Publish now" on a post that was scheduled for later.
      publishedAt = new Date().toISOString();
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
        status: values.status === "SCHEDULED" ? "PUBLISHED" : values.status,
        ...(publishedAt ? { publishedAt } : {}),
        slug: values.slug || undefined,
        seoTitle: values.seoTitle,
        metaDescription: values.metaDescription,
        keywords: values.keywords,
        ogTitle: values.ogTitle,
        ogDescription: values.ogDescription,
        ogImage: values.ogImage,
        canonicalUrl: values.canonicalUrl,
        noindex: values.noindex,
        nofollow: values.nofollow,
        includeInSitemap: values.includeInSitemap,
        customSchema: values.customSchema,
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
          <div className="sm:col-span-2">
            <SlugInput
              prefix="/blogs/"
              value={values.slug}
              onChange={(v) => set("slug", v)}
              originalSlug={initial?.status === "PUBLISHED" ? initial.slug : undefined}
            />
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
        <h2 className="font-display text-lg font-bold text-navy-900">Content</h2>
        <p className="mt-1 text-xs text-navy-400">The blog title is the page&apos;s H1 — structure the body with Heading 2 and Heading 3.</p>
        <div className="mt-3">
          <RichTextEditor value={values.content} onChange={(html) => set("content", html)} folder="blogs" placeholder="Write your blog post…" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Featured Image</h2>
        <div className="mt-3">
          <ImageUploader label="Image" required withAlt value={values.image} onChange={(img) => set("image", img)} folder="blogs" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Status</h2>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <Select value={values.status} onValueChange={(v) => set("status", v as FormState["status"])}>
            <SelectTrigger className="h-12 w-56 rounded-2xl border border-navy-200 px-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            </SelectContent>
          </Select>
          {values.status === "SCHEDULED" && (
            <div>
              <Label htmlFor="scheduledAt">Publish on</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                className="mt-1.5 w-60"
                value={values.scheduledAt}
                min={toLocalInput(new Date())}
                onChange={(e) => set("scheduledAt", e.target.value)}
              />
            </div>
          )}
        </div>
        {values.status === "SCHEDULED" && (
          <p className="mt-2 text-xs text-navy-500">The post goes live automatically at this time (it can take up to a minute to appear).</p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">SEO</h2>
        <div className="mt-4 space-y-4">
          <div>
            <LabelWithCounter label="SEO Title" value={values.seoTitle} max={60} />
            <Input className="mt-1.5" value={values.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder="Defaults to the blog title" />
          </div>
          <div>
            <LabelWithCounter label="Meta Description" value={values.metaDescription} max={160} />
            <Textarea className="mt-1.5" value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} placeholder="Defaults to the excerpt" />
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
          <IndexingControls idPrefix="blog" value={values} onChange={(patch) => setValues((s) => ({ ...s, ...patch }))} />
          <CustomSchemaField
            value={values.customSchema ?? ""}
            onChange={(v) => set("customSchema", v)}
            autoNote="Added automatically: BlogPosting (article), breadcrumbs and business details."
          />
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
