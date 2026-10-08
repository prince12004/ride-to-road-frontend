import { Phone } from "lucide-react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { siteConfig } from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";

/** Sticky call / WhatsApp bar shown on phones only. */
export function MobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-100 bg-white/95 p-3 backdrop-blur md:hidden">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <a
          href={`tel:${siteConfig.contact.phone}`}
          aria-label={`Call ${siteConfig.contact.phoneDisplay}`}
          className="grid size-12 place-items-center rounded-full border border-navy-200 text-navy-900"
        >
          <Phone className="size-5" />
        </a>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] font-semibold text-white"
        >
          <WhatsappIcon className="size-5" /> Book on WhatsApp
        </a>
      </div>
    </div>
  );
}
