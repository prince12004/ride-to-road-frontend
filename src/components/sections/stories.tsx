import Image from "next/image";
import { format, parseISO } from "date-fns";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import type { BlogPost } from "@/types";

export function Stories({ posts }: { posts: BlogPost[] }) {
  return (
    <section id="stories" className="scroll-mt-20 py-14 sm:py-20 lg:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Road notes"
          title="Ideas for your next drive."
          description="Routes, checklists and destinations from the Ride to Road team."
        />
        <div className="snap-rail mt-8 pb-2 sm:mt-12 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.08} className="w-[80%] max-w-[320px] md:w-auto md:max-w-none">
              <article className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-navy-100">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy-700 via-navy-900 to-navy-950 bg-lanes" />
                  )}
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
