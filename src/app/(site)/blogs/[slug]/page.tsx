import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CalendarDays, Clock3, MessageCircle, Share2 } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { ProseContent } from "@/components/legal/prose-content";
import { getBlogBySlug, getBlogPosts } from "@/lib/content";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * The `/blogs/:slug` API returns the raw blog document (unlike the list
 * endpoint), so `image` and `category` come back as populated objects
 * rather than the flat strings the listing uses.
 */
interface BlogDetail {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  image?: { url: string; publicId?: string } | string;
  category?: { name: string } | string;
  readTime?: string;
  publishedAt?: string;
}

async function getPost(slug: string) {
  const data = await getBlogBySlug(slug);
  return data ? (data as unknown as BlogDetail) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt || post.title,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([getPost(slug), getBlogPosts(4)]);
  if (!post) notFound();

  const imageUrl = typeof post.image === "string" ? post.image : post.image?.url;
  const categoryName = typeof post.category === "string" ? post.category : post.category?.name;
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const shareUrl = whatsappLink(`${post.title} — check this out: ${post.slug}`);

  return (
    <>
      <section className="bg-navy-950 bg-lanes py-14 lg:py-16">
        <div className="container max-w-3xl">
          <Link href="/blogs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-300 hover:text-lime">
            <ArrowLeft className="size-3.5" /> Back to blogs
          </Link>
          {categoryName && (
            <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-lime">
              <span className="h-px w-6 bg-current" />
              {categoryName}
            </p>
          )}
          <h1 className="mt-4 text-balance font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-navy-300">
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                <time dateTime={post.publishedAt}>{format(parseISO(post.publishedAt), "d MMM yyyy")}</time>
              </span>
            )}
            {post.readTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" /> {post.readTime}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container max-w-3xl">
          {imageUrl && (
            <div className="relative -mt-20 aspect-[16/9] overflow-hidden rounded-[2rem] bg-navy-100 shadow-[0_40px_100px_-30px_rgba(8,19,26,0.5)] ring-1 ring-navy-900/5 lg:-mt-28">
              <Image src={imageUrl} alt={post.title} fill sizes="(min-width: 1024px) 768px, 100vw" className="object-cover" priority />
            </div>
          )}

          <ProseContent html={post.content} className="mt-10" />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-navy-100 pt-8">
            <Link href="/blogs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep hover:underline">
              <ArrowLeft className="size-4" /> Back to Blogs
            </Link>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 transition-colors hover:border-navy-900 hover:text-navy-900"
            >
              <Share2 className="size-4" /> Share
            </a>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-navy-100 py-16 lg:py-20">
          <div className="container">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-deep">
              <span className="h-px w-6 bg-current" />
              Keep reading
            </p>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">More from the blog</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-navy-950 py-14">
        <div className="container flex flex-col items-center gap-4 text-center">
          <p className="font-display text-2xl font-bold text-white">Ready for your next self-drive trip?</p>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-display font-bold text-navy-900 transition-colors hover:bg-lime-400"
          >
            <MessageCircle className="size-4" /> Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
