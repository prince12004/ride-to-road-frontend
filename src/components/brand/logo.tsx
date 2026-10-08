import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/** The logo artwork sits on white, so on dark surfaces it is framed in a white chip. */
export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className={cn("relative inline-flex w-fit shrink-0 items-center", onDark && "rounded-xl bg-white px-3 py-1.5")}
    >
      <Image
        src="/brand/logo-compact.png"
        alt={siteConfig.name}
        width={900}
        height={429}
        priority
        className={cn("h-10 w-auto sm:h-11", className)}
      />
    </Link>
  );
}
