import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileCta } from "@/components/layout/mobile-cta";
import { JsonLd, businessSchema, getSchemaSettings, websiteSchema } from "@/lib/schema";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSchemaSettings();
  return (
    <>
      <JsonLd data={[businessSchema(settings), websiteSchema(settings)]} />
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <MobileCta />
    </>
  );
}
