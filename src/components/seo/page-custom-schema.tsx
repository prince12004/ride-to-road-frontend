import { CustomJsonLd } from "@/lib/schema";
import { getAllPageSeo, type StaticSeoPath } from "@/lib/seo";

/** Renders the "Custom schema" saved in SEO → Page Meta for a fixed page. */
export async function PageCustomSchema({ path }: { path: StaticSeoPath }) {
  try {
    const page = (await getAllPageSeo()).find((p) => p.path === path);
    return <CustomJsonLd value={page?.customSchema} />;
  } catch {
    return null;
  }
}
