"use client";

import { PageHeader } from "@/components/admin/page-header";
import { BlogForm } from "@/components/admin/blog-form";

export default function CreateBlogPage() {
  return (
    <div>
      <PageHeader title="Add Blog" description="Publish a new article." />
      <BlogForm />
    </div>
  );
}
