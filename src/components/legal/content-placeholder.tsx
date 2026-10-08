import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Honest empty-state for admin-manageable pages (About Us, legal pages, etc.)
 * whose `content` hasn't been written yet. Never replace this with invented
 * copy — the backend intentionally ships these rows blank.
 */
export function ContentPlaceholder({
  message = "This page is being finalized and will be published here shortly. For questions in the meantime, reach out on WhatsApp.",
}: {
  message?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-navy-200 bg-navy-50 p-8 text-center sm:p-12">
      <p className="mx-auto max-w-md leading-relaxed text-navy-500">{message}</p>
      <Button asChild variant="whatsapp" className="mt-5">
        <a href={whatsappLink("Hi Ride to Road, I have a question.")} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4" /> Chat on WhatsApp
        </a>
      </Button>
    </div>
  );
}
