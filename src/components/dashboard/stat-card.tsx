import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = {
  default: { icon: "bg-lime/20 text-brand-deep", ring: "hover:border-lime/50" },
  warning: { icon: "bg-amber-100 text-amber-700", ring: "hover:border-amber-300" },
  danger: { icon: "bg-red-100 text-red-700", ring: "hover:border-red-300" },
  success: { icon: "bg-emerald-100 text-emerald-700", ring: "hover:border-emerald-300" },
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  href?: string;
}) {
  const t = TONES[tone];
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
        <div className={cn("grid size-10 place-items-center rounded-2xl", t.icon)}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <p className="font-display text-3xl font-extrabold text-navy-950">{value}</p>
        {href && <ArrowRight className="size-4 text-navy-300 transition-transform group-hover:translate-x-0.5" />}
      </div>
    </>
  );

  const className = cn(
    "group block p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(14,29,38,0.35)]",
    t.ring,
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className={className}>{content}</Card>
      </Link>
    );
  }

  return <Card className={className}>{content}</Card>;
}
