import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/blog-card";
import { getBlogPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Road trip ideas, checklists and destinations from the Ride to Road team.",
};

export default async function BlogsPage() {
  const posts = await getBlogPosts(24);

  return (
    <>
      <section className="bg-navy-950 bg-lanes py-14 lg:py-16">
        <div className="container">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">Road Notes</p>
          <h1 className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1] tracking-tight text-white sm:text-5xl">
            Ideas for your next drive.
          </h1>
          <p className="mt-3 max-w-xl text-navy-300">Routes, checklists and destinations from the Ride to Road team.</p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container">
          {posts.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-navy-200 bg-navy-50 p-10 text-center text-navy-500">
              No blogs published yet. Check back soon for road trip ideas and tips.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
