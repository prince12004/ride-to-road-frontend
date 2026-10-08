import Image from "next/image";
import { format, parseISO } from "date-fns";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import type { BlogPost } from "@/types";

export function Stories({ posts }: { posts: BlogPost[] }) {
  return (
    <section id="stories" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Road notes"
          title="Ideas for your next drive."
          description="Routes, checklists and destinations from the Ride to Road team."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.08}>
              <article className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy-100">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy-900">
                    {post.category}
                  </span>
                </div>
                <p className="mt-5 text-sm text-navy-400">
                  <time dateTime={post.publishedAt}>{format(parseISO(post.publishedAt), "d MMM yyyy")}</time> ·{" "}
                  {post.readTime}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold leading-snug text-navy-900 transition-colors group-hover:text-brand-deep">
                  {post.title}
                </h3>
                <p className="mt-2 leading-relaxed text-navy-500">{post.excerpt}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
