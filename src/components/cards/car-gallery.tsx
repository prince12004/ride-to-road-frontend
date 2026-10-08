"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function CarGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const thumbs = images.slice(0, 5);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-navy-100 shadow-[0_30px_80px_-30px_rgba(8,19,26,0.35)]">
        <Image src={images[active] ?? images[0]} alt={alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" priority />
      </div>
      {thumbs.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {thumbs.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-xl bg-navy-100 ring-2 transition-all",
                active === i ? "ring-brand-deep" : "ring-transparent opacity-80 hover:opacity-100",
              )}
            >
              <Image src={img} alt={`${alt} ${i + 1}`} fill sizes="150px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
