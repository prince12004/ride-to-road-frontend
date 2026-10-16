"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/admin/dialog";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { Button } from "@/components/ui/button";

const loadForm = () => import("@/components/attach-car/attach-car-form").then((m) => m.AttachCarForm);
const AttachCarForm = dynamic(loadForm, {
  ssr: false,
  loading: () => <div aria-hidden className="h-[620px] animate-pulse rounded-2xl bg-navy-50" />,
});
const preloadForm = () => void loadForm();

export function AttachCarDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setWhatsappUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onPointerEnter={preloadForm} onTouchStart={preloadForm} onFocus={preloadForm}>
        {children}
      </DialogTrigger>
      <DialogContent
        title={whatsappUrl ? "Details received" : "Attach your car"}
        description={whatsappUrl ? undefined : "Share your car details and our team will get in touch about listing it with Ride to Road."}
      >
        {whatsappUrl ? (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-lime/20 text-brand-deep">
              <CheckCircle2 className="size-7" />
            </span>
            <p className="mt-4 text-sm text-navy-600">
              Thanks! We've saved your car details. Send them to us on WhatsApp so our team can reply to you right away.
            </p>
            <Button asChild variant="whatsapp" size="lg" className="mt-6 w-full">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsappIcon /> Send details on WhatsApp
              </a>
            </Button>
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <AttachCarForm onSuccess={setWhatsappUrl} />
        )}
      </DialogContent>
    </Dialog>
  );
}
