import { getSiteContent } from "@/lib/content";
import { ContentPlaceholder } from "@/components/legal/content-placeholder";
import { ProseContent } from "@/components/legal/prose-content";

const TITLES = {
  "terms-and-conditions": "Terms & Conditions",
  "cancellation-policy": "Cancellation Policy",
  "refund-policy": "Refund Policy",
} as const;

export type LegalContentKey = keyof typeof TITLES;

export async function LegalPageView({ contentKey }: { contentKey: LegalContentKey }) {
  const page = await getSiteContent(contentKey);
  const title = page?.title || TITLES[contentKey];

  return (
    <>
      <section className="bg-navy-950 bg-lanes py-14 lg:py-16">
        <div className="container">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">Legal</p>
          <h1 className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1] tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container max-w-3xl">
          {page?.content ? <ProseContent html={page.content} /> : <ContentPlaceholder />}
        </div>
      </section>
    </>
  );
}
