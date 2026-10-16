"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { whatsappLink } from "@/lib/whatsapp";

// Pages that render their own sticky action bar (e.g. the booking form's
// confirm button) — showing both would stack two bars over the content.
const HIDDEN_ON = [/^\/book\//];

/** Sticky "Book a car" / WhatsApp bar shown on phones only. */
export function MobileCta() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((re) => re.test(pathname))) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-100/80 bg-white/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <Link
          href="/cars"
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-navy-950 font-display text-[15px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(8,19,26,0.8)] active:scale-[0.98]"
        >
          Book a Car <ArrowRight className="size-4 text-lime" />
        </Link>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-4 font-semibold text-white active:scale-[0.98]"
        >
          <WhatsappIcon className="size-5" />
          <span className="text-sm">WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
