import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Private and transactional areas stay out of search; everything else is crawlable. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/login", "/book/", "/booking/", "/api/", "/revalidate"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
