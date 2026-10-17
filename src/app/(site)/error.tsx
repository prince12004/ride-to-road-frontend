"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when live data couldn't be loaded (e.g. the API is briefly down).
 * We never fall back to placeholder content — the visitor gets an honest
 * message and a retry.
 */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="bg-navy-50 py-20">
      <div className="container max-w-lg text-center">
        <h1 className="font-display text-2xl font-extrabold text-navy-950 sm:text-3xl">We couldn't load this page</h1>
        <p className="mt-3 text-navy-500">
          Our servers didn't respond in time. Please try again in a moment — or reach us on WhatsApp if it keeps happening.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            <RefreshCw className="size-4" /> Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
